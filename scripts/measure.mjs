// Reads every test image in a folder through a running dev server, scores it against test-letters/answer-key.json,
// runs the rules and the second reader (Tesseract, here in Node), and saves the run in public/accuracy.json for the
// "How it decides" page. A run with the same label replaces the old one. Run `npm run dev` first.
//   node scripts/measure.mjs <folder> "<what the images are>" [http://127.0.0.1:8792]
// Files are matched to letters by name: L02.jpg and L02-blurry.jpg both score as L02.
import { readdir, readFile, writeFile } from "node:fs/promises";
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
const tally = { Service: { right: 0, empty: 0, wrong: 0 }, Reason: { right: 0, empty: 0, wrong: 0 }, Deadline: { right: 0, empty: 0, wrong: 0 }, Phone: { right: 0, empty: 0, wrong: 0 } };
// The second reader on the two fields it checks against a known answer: confirmed = right and matched exactly,
// caught = wrong and flagged. "correct" and "wrong" count the AI's right and wrong values it looked at.
const second = { confirmed: 0, correct: 0, caught: 0, wrong: 0 };
const misses = [];
let resultsRight = 0;
let neurons = 0;
let model = "";

for (const file of files) {
  const id = file.slice(0, 3).toUpperCase();
  const want = key[id];
  if (!want) continue;
  const path = join(dir, file);
  const image = (await readFile(path)).toString("base64");
  const body = await readWithRetry(image);
  if (!body.ok) {
    misses.push(`${file}: the reader failed (${body.error})`);
    console.log(file, "FAILED", body.error);
    continue;
  }
  const r = body.reading;
  neurons += body.neurons ?? 0;
  model = body.model;
  const words = wordsFromBlocks((await ocr.recognize(path, {}, { blocks: true, text: false })).data.blocks);

  const score = (field, ok, empty, note) => {
    const t = tally[field];
    if (ok) t.right++;
    else if (empty) t.empty++;
    else {
      t.wrong++;
      misses.push(`${file}: ${note}`);
    }
  };
  score("Service", norm(r.service).includes(want.service), !r.service, `denied service read as "${r.service}"`);
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

  if (r.deadlineQuote) {
    const m = findQuote(r.deadlineQuote, words);
    const exact = !!m && m.score >= FOUND && m.exact;
    if (deadlineRight) {
      second.correct++;
      if (exact) second.confirmed++;
    } else {
      second.wrong++;
      if (!exact) second.caught++;
    }
  }
  if (r.appealPhone) {
    const p = findPhone(r.appealPhone, words);
    const ok = !!p && !p.fax;
    if (phoneRight) {
      second.correct++;
      if (ok) second.confirmed++;
    } else {
      second.wrong++;
      if (!ok) second.caught++;
    }
  }

  const outcome = decide(want.answers, r).outcome;
  if (outcome === want.outcome) resultsRight++;
  else misses.push(`${file}: next step would be ${outcome} without fixes (should be ${want.outcome})`);
  console.log(file.padEnd(16), outcome === want.outcome ? "ok  " : "MISS", outcome.padEnd(14), `${body.neurons?.toFixed(1)} neurons`, `${body.ms} ms`, `${words.length} OCR words`);
}
await ocr.terminate();

const run = {
  measuredOn: new Date().toISOString().slice(0, 10),
  images: label,
  model: model.replace("@cf/", ""),
  photos: files.length,
  fields: Object.entries(tally).map(([name, t]) => ({ name, ...t })),
  results: { right: resultsRight, total: files.length },
  secondReader: second,
  misses,
};
const previous = JSON.parse(await readFile("public/accuracy.json", "utf8").catch(() => "null"));
const runs = (previous?.runs ?? (previous ? [previous] : [])).filter((x) => x.images !== label);
await writeFile("public/accuracy.json", JSON.stringify({ runs: [...runs, run] }, null, 2) + "\n");
console.log(`\nright next step: ${resultsRight}/${files.length}  ·  ${neurons.toFixed(0)} neurons used  ·  saved "${label}" in public/accuracy.json`);
console.log(`second reader: confirmed ${second.confirmed}/${second.correct} right values, caught ${second.caught}/${second.wrong} wrong ones`);
for (const m of misses) console.log(" -", m);
