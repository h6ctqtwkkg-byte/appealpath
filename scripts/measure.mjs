// Reads every test image in a folder through a running dev server, scores it against test-letters/answer-key.json,
// runs the rules, and writes public/accuracy.json for the "How it decides" page. Run `npm run dev` first.
//   node scripts/measure.mjs <folder> "<what the images are>" [http://127.0.0.1:8792]
// Files are matched to letters by name: L02.jpg and L02-blurry.jpg both score as L02.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";

// The same rules the app runs, bundled on the fly so this script needs no TypeScript loader.
const bundled = await esbuild.build({ entryPoints: ["src/shared/rules.ts"], bundle: true, format: "esm", write: false });
const { decide } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);

const [dir, label, base = "http://127.0.0.1:8792"] = process.argv.slice(2);
if (!dir || !label) {
  console.error('usage: node scripts/measure.mjs <folder> "<what the images are>" [base url]');
  process.exit(1);
}
const key = JSON.parse(await readFile("test-letters/answer-key.json", "utf8")).letters;
const files = (await readdir(dir)).filter((f) => /^L\d\d.*\.(jpe?g|png)$/i.test(f)).sort();

const norm = (s) => (s ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().replace(/^"|"$/g, "").toLowerCase();
const digits = (s) => (s ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const tally = { Service: { right: 0, empty: 0, wrong: 0 }, Reason: { right: 0, empty: 0, wrong: 0 }, Deadline: { right: 0, empty: 0, wrong: 0 }, Phone: { right: 0, empty: 0, wrong: 0 } };
const misses = [];
let resultsRight = 0;
let neurons = 0;
let model = "";

for (const file of files) {
  const id = file.slice(0, 3).toUpperCase();
  const want = key[id];
  if (!want) continue;
  const image = (await readFile(join(dir, file))).toString("base64");
  const res = await fetch(`${base}/api/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
  const body = await res.json();
  if (!body.ok) {
    misses.push(`${file}: the reader failed (${body.error})`);
    console.log(file, "FAILED", body.error);
    continue;
  }
  const r = body.reading;
  neurons += body.neurons ?? 0;
  model = body.model;

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
  score(
    "Deadline",
    want.deadline === null ? r.deadlineQuote === null : norm(r.deadlineQuote) === norm(want.deadline),
    want.deadline !== null && r.deadlineQuote === null,
    want.deadline === null ? `made up a deadline that isn't printed: "${r.deadlineQuote}"` : `deadline read as "${r.deadlineQuote}"`,
  );
  score("Phone", want.phones.includes(digits(r.appealPhone)), !r.appealPhone, `picked ${r.appealPhone} as the phone number, which isn't the letter's number to call`);

  const outcome = decide(want.answers, r).outcome;
  if (outcome === want.outcome) resultsRight++;
  else misses.push(`${file}: next step would be ${outcome} without fixes (should be ${want.outcome})`);
  console.log(file.padEnd(16), outcome === want.outcome ? "ok  " : "MISS", outcome.padEnd(14), `${body.neurons?.toFixed(1)} neurons`, `${body.ms} ms`);
}

const accuracy = {
  measuredOn: new Date().toISOString().slice(0, 10),
  images: label,
  model: model.replace("@cf/", ""),
  photos: files.length,
  fields: Object.entries(tally).map(([name, t]) => ({ name, ...t })),
  results: { right: resultsRight, total: files.length },
  misses,
};
await writeFile("public/accuracy.json", JSON.stringify(accuracy, null, 2) + "\n");
console.log(`\nright next step: ${resultsRight}/${files.length}  ·  ${neurons.toFixed(0)} neurons used  ·  wrote public/accuracy.json`);
for (const m of misses) console.log(" -", m);
