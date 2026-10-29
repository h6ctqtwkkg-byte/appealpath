// Builds the Spanish review sheet: every piece of fixed app text, English next to Spanish, with a blank column for the
// reviewer's notes. Read straight from src/client/i18n.ts and reasons.ts, so the sheet always matches the app.
//   node scripts/spanish-sheet.mjs   → prep/spanish-review.html and prep/spanish-review.pdf
// Text that changes with the letter shows its blanks as [1], [2]…; the appeal step shows one row per reason.
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import * as esbuild from "esbuild";

const bundled = await esbuild.build({
  stdin: {
    contents: 'export { STRINGS } from "./src/client/i18n.ts"; export { REASON_INFO } from "./src/client/reasons.ts"; export { CATEGORIES } from "./src/shared/types.ts";',
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  write: false,
  jsx: "automatic",
  jsxImportSource: "preact",
});
const { STRINGS, REASON_INFO, CATEGORIES } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);

const rows = [];
const blanks = (n) => Array.from({ length: n }, (_, i) => `[${i + 1}]`);
function walk(en, es, path) {
  if (typeof en === "string") {
    if (en || es) rows.push([path, en, es ?? "(missing)"]);
  } else if (typeof en === "function") {
    if (path.endsWith("appeal.step1")) {
      for (const c of CATEGORIES) rows.push([`${path} (${c})`, en(c, "[service]"), es(c, "[service]")]);
    } else {
      rows.push([path, String(en(...blanks(en.length))), String(es(...blanks(en.length)))]);
    }
  } else if (en && typeof en === "object") {
    for (const k of Object.keys(en)) walk(en[k], es?.[k], path ? `${path}.${k}` : k);
  }
}
walk(STRINGS.en, STRINGS.es, "");
for (const c of CATEGORIES) {
  for (const part of ["means", "helps"]) rows.push([`reason notes.${c}.${part}`, REASON_INFO.en[c][part], REASON_INFO.es[c][part]]);
}
rows.push(["skip link (main.tsx)", "Skip to content", "Ir al contenido"]);
// Most important first, so a reviewer who stops early has covered the advice people act on.
const ORDER = ["result", "help", "reason notes", "reason", "calendar", "check", "second", "categories", "form", "banner", "header", "steps", "stepsLabel", "footer", "quoteFrom", "reviewNote", "reading", "errors", "skip link (main.tsx)", "how"];
const rank = (where) => {
  const i = ORDER.findIndex((o) => where === o || where.startsWith(`${o}.`) || where.startsWith(`${o} `));
  return i < 0 ? ORDER.length : i;
};
rows.sort((a, b) => rank(a[0]) - rank(b[0]));
// The same English and Spanish in several places is reviewed once; its row lists every place.
const merged = [];
for (const [where, en, es] of rows) {
  const seen = merged.find((m) => m[1] === en && m[2] === es);
  if (seen) seen[0] += `, ${where}`;
  else merged.push([where, en, es]);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const same = merged.filter(([, en, es]) => en === es).length;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>AppealPath: Spanish review sheet</title>
<style>
  @page { size: letter landscape; margin: 0.4in 0.45in 0.45in; }
  body { font: 9pt/1.3 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1a2332; margin: 0; }
  h1 { font-size: 16pt; margin: 0 0 4px; color: #1f3f6e; }
  .intro { margin: 0 0 10px; }
  .intro li { margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #bbb; padding: 3px 5px; vertical-align: top; text-align: left; word-wrap: break-word; }
  th { background: #eef1f6; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .04em; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  td.n { width: 3%; color: #666; font-size: 8pt; }
  td.where { width: 11%; font: 7pt/1.25 Menlo, monospace; color: #555; }
  td.en { width: 32%; }
  td.es { width: 32%; }
  td.notes { width: 22%; }
  tr.same td.es { color: #777; }
</style>
</head>
<body>
<h1>AppealPath: Spanish review sheet</h1>
<ul class="intro">
  <li>Every piece of fixed text in the app, English on the left and Spanish on the right (${merged.length} rows; text used in more than one place appears once). The Spanish was written with AI help and proofread once, but no native speaker has checked it yet.</li>
  <li>Please mark anything that sounds wrong, stiff, too formal, or unclear for someone stressed about a medical bill. Suggest better wording in the Notes column. The app speaks to the reader as <em>usted</em>.</li>
  <li>[1], [2]… and [service] are blanks the app fills from the letter. Words copied from a letter always stay in English on purpose. ${same} rows are the same in both languages (for example, names of English-only forms), shown in gray.</li>
  <li><strong>Rows go from most to least important:</strong> first the results, free help and reason notes that people act on, then the check screen and the first screen, and last the "How it decides" page. Stop wherever you run out of time; even the first few pages help.</li>
  <li>The "Where" column only helps Noah find the line in the code. You can ignore it.</li>
</ul>
<table>
<colgroup><col style="width:3%"><col style="width:11%"><col style="width:32%"><col style="width:32%"><col style="width:22%"></colgroup>
<thead><tr><th>#</th><th>Where</th><th>English</th><th>Español</th><th>Notes</th></tr></thead>
<tbody>
${merged.map(([where, en, es], i) => `<tr${en === es ? ' class="same"' : ""}><td class="n">${i + 1}</td><td class="where">${esc(where)}</td><td class="en">${esc(en)}</td><td class="es" lang="es">${esc(es)}</td><td class="notes"></td></tr>`).join("\n")}
</tbody>
</table>
</body>
</html>
`;
await writeFile("prep/spanish-review.html", html);
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
execFileSync(chrome, ["--headless=new", "--no-pdf-header-footer", `--print-to-pdf=${process.cwd()}/prep/spanish-review.pdf`, `file://${process.cwd()}/prep/spanish-review.html`], { stdio: "ignore" });
console.log(`prep/spanish-review.html and .pdf: ${merged.length} rows (${rows.length} before merging repeats), ${same} the same in both languages`);
