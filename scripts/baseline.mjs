// A reader with no AI, to test whether the AI earns its place: Tesseract OCR on the same images, then keyword rules for
// the kind of reason, the first appeal sentence for the deadline, and the first non-fax phone number in an appeal
// sentence. It runs the same rules and is scored like scripts/measure.mjs. The rules below were written once, before
// the first run, and not changed after seeing results, so it isn't tuned to the letters any more than it has to be.
// It needs no dev server and spends no neurons.
//   node scripts/baseline.mjs   → test-letters/runs/baseline.json and a table
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as esbuild from "esbuild";
import { createWorker } from "tesseract.js";

const bundled = await esbuild.build({
  stdin: { contents: 'export { decide } from "./src/shared/rules.ts";', resolveDir: process.cwd() },
  bundle: true,
  format: "esm",
  write: false,
});
const { decide } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);

// First match wins, checked in this order. "Medically necessary" comes last because appeal instructions often
// mention it even when the denial is for something else.
const KEYWORDS = [
  ["experimental", /experimental|investigational/i],
  ["prior_auth_missing", /prior auth|pre-?authori[sz]ation|prior approval|precertification|pre-?certif/i],
  ["billing_error", /billing error|coding error|incorrect(ly)? (code|coded|billed)|wrong (code|procedure code)|duplicate claim/i],
  ["missing_info", /medical records|missing information|additional information|records (were|was) not|did not receive/i],
  ["out_of_network", /out[- ]of[- ]network|not in (your|the) (plan'?s )?network|non-?participating/i],
  ["not_covered", /not covered|excluded|exclusion|not a covered/i],
  ["not_medically_necessary", /medically necessary|medical necessity/i],
];
const PHONE = /(?:\b1[-\s.]?)?\(?\b\d{3}\)?[-\s.]?\d{3}[-\s.]\d{4}\b/g;

export function baselineRead(text) {
  const flat = text.replace(/-\n/g, "").replace(/\s+/g, " ").trim();
  const sentences = flat.split(/(?<=[.!?])\s+/);
  const category = KEYWORDS.find(([, re]) => re.test(flat))?.[0] ?? "unclear";
  const deadlineQuote =
    sentences.find((s) => /appeal/i.test(s) && (/\b\d+\s+(calendar\s+)?days\b/i.test(s) || /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i.test(s))) ?? null;
  const phones = [];
  for (const m of flat.matchAll(PHONE)) {
    const before = flat.slice(Math.max(0, m.index - 30), m.index);
    const sentence = sentences.find((s) => s.includes(m[0])) ?? "";
    phones.push({ phone: m[0], fax: /fax/i.test(before), appeal: /appeal/i.test(sentence) });
  }
  const pick = phones.find((p) => !p.fax && p.appeal) ?? phones.find((p) => !p.fax) ?? null;
  return { category, deadlineQuote, appealPhone: pick?.phone ?? null };
}

const norm = (s) => (s ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().replace(/^"|"$/g, "").toLowerCase();
const digits = (s) => (s ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

const key = JSON.parse(await readFile("test-letters/answer-key.json", "utf8")).letters;
const ocr = await createWorker("eng", 1, { langPath: "node_modules/@tesseract.js-data/eng/4.0.0_best_int", gzip: true, cacheMethod: "none" });
const cases = [];
for (const [dir, condition] of [["test-letters/renders", "clean"], ["test-letters/phone-like", "phone"]]) {
  for (const file of (await readdir(dir)).filter((f) => /^L\d\d.*\.jpe?g$/i.test(f)).sort()) {
    const id = file.slice(0, 3).toUpperCase();
    const want = key[id];
    if (!want) continue;
    const { data } = await ocr.recognize(join(dir, file));
    const r = baselineRead(data.text);
    const outcome = decide(want.answers, r).outcome;
    cases.push({
      file,
      letter: id,
      condition,
      heldOut: !!want.heldOut,
      reading: r,
      reason: want.category ? r.category === want.category : null,
      deadline: want.deadline === null ? r.deadlineQuote === null : norm(r.deadlineQuote) === norm(want.deadline),
      phone: want.phones.includes(digits(r.appealPhone)),
      step: outcome === want.outcome,
      outcome,
      expected: want.outcome,
    });
    console.log(file.padEnd(16), condition.padEnd(6), outcome === want.outcome ? "ok  " : "MISS", outcome.padEnd(14), r.category);
  }
}
await ocr.terminate();

const sum = (rows, f) => {
  const scored = rows.filter((c) => c[f] !== null);
  return `${scored.filter((c) => c[f]).length}/${scored.length}`;
};
const groups = [
  ["Development, clean", (c) => !c.heldOut && c.condition === "clean"],
  ["Development, simulated phone", (c) => !c.heldOut && c.condition === "phone"],
  ["Held-out, clean", (c) => c.heldOut && c.condition === "clean"],
  ["Held-out, simulated phone", (c) => c.heldOut && c.condition === "phone"],
];
const table = groups.map(([name, f]) => {
  const rows = cases.filter(f);
  return { images: name, n: rows.length, step: sum(rows, "step"), reason: sum(rows, "reason"), deadline: sum(rows, "deadline"), phone: sum(rows, "phone") };
});
console.table(table);
await writeFile("test-letters/runs/baseline.json", JSON.stringify({ measuredOn: new Date().toISOString().slice(0, 10), about: "No-AI baseline (scripts/baseline.mjs), one run", table, cases }, null, 2) + "\n");
