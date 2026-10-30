// Reads every test image in a folder through a running dev server, scores it against test-letters/answer-key.json,
// runs the rules and the second reader (Tesseract, here in Node), and saves the run in public/accuracy.json for the
// "How it decides" page. A run with the same label replaces the old one. Held-out letters (L13–L18) are saved as their
// own run, labeled "held-out letters L13–L18, …", and every reading goes to test-letters/runs/ so a run can be checked
// case by case. Run `npm run dev` first.
//   node scripts/measure.mjs <folder> "<what the images are>" [http://127.0.0.1:8792]
// Files are matched to letters by name: L02.jpg and L02-blurry.jpg both score as L02.
// REPEAT=2 node scripts/measure.mjs … reads the folder again for the run-to-run spread: the readings go to
// test-letters/runs/repeats/ and public/accuracy.json is left alone.
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";
import { createWorker } from "tesseract.js";

// The same rules and matching the app runs, bundled on the fly so this script needs no TypeScript loader.
const bundled = await esbuild.build({
  stdin: {
    contents: 'export { decide } from "./src/shared/rules.ts"; export { FOUND, findPhone, findQuote, wordsFromBlocks } from "./src/shared/match.ts";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  write: false,
});
const { decide, FOUND, findPhone, findQuote, wordsFromBlocks } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);

const [dir, label, base = "http://127.0.0.1:8792"] = process.argv.slice(2);
if (!dir || !label) {
  console.error('usage: node scripts/measure.mjs <folder> "<what the images are>" [base url]');
  process.exit(1);
}
const key = JSON.parse(await readFile("test-letters/answer-key.json", "utf8")).letters;
const files = (await readdir(dir)).filter((f) => /^L\d\d.*\.(jpe?g|png)$/i.test(f)).sort();
const ocr = await createWorker("eng", 1, { langPath: "node_modules/@tesseract.js-data/eng/4.0.0_best_int", gzip: true, cacheMethod: "none" });

async function readOnce(image) {
  const res = await fetch(`${base}/api/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
  return JSON.parse(await res.text());
}

/** Retries a dev-server restart once, and waits out the 6-reads-a-minute limit (the dev server enforces it too). */
async function readWithRetry(image) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const body = await readOnce(image).catch(() => null);
    if (body && !(body.ok === false && body.error === "rate_limited")) return body;
    await new Promise((r) => setTimeout(r, 12_000));
  }
  return { ok: false, error: "rate_limited" };
}

const norm = (s) => (s ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().replace(/^"|"$/g, "").toLowerCase();
const digits = (s) => (s ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
// One run per group, so the held-out letters (L13–L18, ANSWER-KEY.md) never mix into the numbers for L01–L12.
const groups = new Map();
function group(heldOut) {
  if (!groups.has(heldOut)) {
    groups.set(heldOut, {
      tally: { Service: { right: 0, empty: 0, wrong: 0 }, Reason: { right: 0, empty: 0, wrong: 0 }, Deadline: { right: 0, empty: 0, wrong: 0 }, Phone: { right: 0, empty: 0, wrong: 0 } },
      // The second reader on the two fields it checks against a known answer: confirmed = right and matched exactly,
      // caught = wrong and flagged. "correct" and "wrong" count the AI's right and wrong values it looked at.
      second: { confirmed: 0, correct: 0, caught: 0, wrong: 0 },
      misses: [],
      right: 0,
      total: 0,
    });
  }
  return groups.get(heldOut);
}
// Every reading, kept so a run can be checked case by case later (test-letters/runs/).
const cases = [];
let neurons = 0;
let model = "";

for (const file of files) {
  const id = file.slice(0, 3).toUpperCase();
  const want = key[id];
  if (!want) continue;
  const g = group(!!want.heldOut);
  g.total++;
  const path = join(dir, file);
  const image = (await readFile(path)).toString("base64");
  const body = await readWithRetry(image);
  if (!body.ok) {
    g.misses.push(`${file}: the reader failed (${body.error})`);
    cases.push({ file, letter: id, heldOut: !!want.heldOut, error: body.error });
    console.log(file, "FAILED", body.error);
    continue;
  }
  const r = body.reading;
  neurons += body.neurons ?? 0;
  model = body.model;
  const words = wordsFromBlocks((await ocr.recognize(path, {}, { blocks: true, text: false })).data.blocks);

  const scores = {};
  const score = (field, ok, empty, note) => {
    const t = g.tally[field];
    scores[field] = ok ? "right" : empty ? "empty" : "wrong";
    if (ok) t.right++;
    else if (empty) t.empty++;
    else {
      t.wrong++;
      g.misses.push(`${file}: ${note}`);
    }
  };
  score("Service", norm(r.service).includes(want.service), !r.service, `denied service read as "${r.service}"`);
  // "Reason" scores the kind of reason (the category that picks the next step), not the reason quote; the How page says so.
  if (want.category) score("Reason", r.category === want.category, false, `reason read as ${r.category} (should be ${want.category})`);
  const deadlineRight = want.deadline === null ? r.deadlineQuote === null : norm(r.deadlineQuote) === norm(want.deadline);
  score(
    "Deadline",
    deadlineRight,
    want.deadline !== null && r.deadlineQuote === null,
    want.deadline === null ? `made up a deadline that isn't printed: "${r.deadlineQuote}"` : `deadline read as "${r.deadlineQuote}"`,
  );
  const phoneRight = want.phones.includes(digits(r.appealPhone));
  score("Phone", phoneRight, !r.appealPhone, `picked ${r.appealPhone} as the phone number, which isn't the letter's number to call`);

  const checks = {};
  if (r.deadlineQuote) {
    const m = findQuote(r.deadlineQuote, words);
    const exact = !!m && m.score >= FOUND && m.exact;
    checks.deadline = exact ? "confirmed" : "flagged";
    if (deadlineRight) {
      g.second.correct++;
      if (exact) g.second.confirmed++;
    } else {
      g.second.wrong++;
      if (!exact) g.second.caught++;
    }
  }
  if (r.appealPhone) {
    const p = findPhone(r.appealPhone, words);
    const ok = !!p && !p.fax;
    checks.phone = ok ? "confirmed" : p?.fax ? "flagged as fax" : "flagged";
    if (phoneRight) {
      g.second.correct++;
      if (ok) g.second.confirmed++;
    } else {
      g.second.wrong++;
      if (!ok) g.second.caught++;
    }
  }

  const outcome = decide(want.answers, r).outcome;
  if (outcome === want.outcome) g.right++;
  else g.misses.push(`${file}: next step would be ${outcome} without fixes (should be ${want.outcome})`);
  cases.push({ file, letter: id, heldOut: !!want.heldOut, model: body.model, neurons: body.neurons, ms: body.ms, ocrWords: words.length, reading: r, scores, secondReader: checks, outcome, expected: want.outcome });
  console.log(file.padEnd(16), outcome === want.outcome ? "ok  " : "MISS", outcome.padEnd(14), `${body.neurons?.toFixed(1)} neurons`, `${body.ms} ms`, `${words.length} OCR words`);
}
await ocr.terminate();

const measuredOn = new Date().toISOString().slice(0, 10);
const newRuns = [...groups].map(([heldOut, g]) => ({
  measuredOn,
  images: heldOut ? `held-out letters L13–L18, ${label}` : label,
  model: model.replace("@cf/", ""),
  photos: g.total,
  fields: Object.entries(g.tally).map(([name, t]) => ({ name, ...t })),
  results: { right: g.right, total: g.total },
  secondReader: g.second,
  misses: g.misses,
}));
const previous = JSON.parse(await readFile("public/accuracy.json", "utf8").catch(() => "null"));
const labels = new Set(newRuns.map((x) => x.images));
const runs = (previous?.runs ?? (previous ? [previous] : [])).filter((x) => !labels.has(x.images));
const repeat = process.env.REPEAT;
if (!repeat) await writeFile("public/accuracy.json", JSON.stringify({ runs: [...runs, ...newRuns] }, null, 2) + "\n");

let readerCommit = "unknown";
try {
  readerCommit = execFileSync("git", ["log", "-1", "--format=%h", "--", "src/read.ts"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || "unknown";
} catch {
  // Not in a git checkout; the run still saves.
}
const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const runsDir = repeat ? "test-letters/runs/repeats" : "test-letters/runs";
const casesFile = `${runsDir}/${measuredOn}-${slug}${repeat ? `-repeat-${repeat}` : ""}.json`;
await mkdir(runsDir, { recursive: true });
await writeFile(
  casesFile,
  JSON.stringify({ measuredOn, images: label, repeat: repeat ? Number(repeat) : undefined, readerInstructions: `src/read.ts at ${readerCommit}`, neurons: Math.round(neurons), runs: newRuns, cases }, null, 2) + "\n",
);

console.log(`\n${neurons.toFixed(0)} neurons used · every reading saved in ${casesFile}`);
for (const run of newRuns) {
  console.log(`\n${run.images}: right next step ${run.results.right}/${run.results.total}${repeat ? "" : " · saved in public/accuracy.json"}`);
  console.log(`second reader: confirmed ${run.secondReader.confirmed}/${run.secondReader.correct} right values, caught ${run.secondReader.caught}/${run.secondReader.wrong} wrong ones`);
  for (const m of run.misses) console.log(" -", m);
}
