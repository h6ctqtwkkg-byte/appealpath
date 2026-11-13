// Builds the "Code PDF" DSH asks for: every source file in the repo at HEAD, with line numbers, grouped by part, and a
// cover page saying what's in it and what isn't. Images, the fictional test letters, run results and docs are left out.
//   node scripts/code-pdf.mjs                    → submission/AppealPath-code.pdf
//   node scripts/code-pdf.mjs <out.pdf>
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { chromium } from "playwright-core";

const OUT = process.argv[2] ?? "submission/AppealPath-code.pdf";
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 << 20 });

// Each part lists its files in reading order; any file that matches a part's pattern but isn't listed goes at the end of it.
const PARTS = [
  ["The Worker", "Receives the shrunk photo, sends it to Workers AI, and cleans up what comes back.", /^src\/[^/]+\.ts$/, ["src/worker.ts", "src/read.ts"]],
  ["Shared logic", "The six rules, deadline wording, the second reader's matching, and joining pages. Used by the Worker, the app and the tests.", /^src\/shared\//,
    ["src/shared/types.ts", "src/shared/rules.ts", "src/shared/dates.ts", "src/shared/match.ts", "src/shared/merge.ts", "src/shared/phones.ts", "src/shared/services.ts"]],
  ["The app", "Preact screens, the second reader (Tesseract.js), Listen and Send, and every word in English and Spanish.", /^src\/client\/.*\.tsx?$|^public\/(index\.html|styles\.css)$/,
    ["src/client/main.tsx", "src/client/Form.tsx", "src/client/Check.tsx", "src/client/checks.ts", "src/client/Result.tsx", "src/client/Trace.tsx", "src/client/How.tsx",
      "src/client/ui.tsx", "src/client/ocr.ts", "src/client/image.ts", "src/client/speak.ts", "src/client/reasons.ts", "src/client/help.ts", "src/client/samples.ts",
      "src/client/states.ts", "src/client/i18n.ts", "public/index.html", "public/styles.css"]],
  ["Tests", "Run with npm test (vitest).", /^test\//, ["test/rules.test.ts", "test/dates.test.ts", "test/match.test.ts", "test/merge.test.ts", "test/read.test.ts", "test/safety.test.ts"]],
  ["Evaluation and build scripts", "How every number in the write-up was measured, and how the gallery, video and letters were made.", /^scripts\/.*\.(mjs|sh|html)$/,
    ["scripts/measure.mjs", "scripts/repeats-summary.mjs", "scripts/baseline.mjs", "scripts/injection.mjs", "scripts/gov-letters.mjs", "scripts/a11y.mjs", "scripts/build-client.mjs"]],
  ["Configuration", "", /^(package\.json|wrangler\.jsonc|tsconfig\.json|src\/client\/tsconfig\.json)$/, ["package.json", "wrangler.jsonc", "tsconfig.json"]],
];

const tracked = git("ls-files").split("\n").filter(Boolean);
const taken = new Set();
const parts = PARTS.map(([title, note, pattern, order]) => {
  const files = tracked.filter((f) => pattern.test(f) && !taken.has(f));
  files.sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999) || a.localeCompare(b));
  files.forEach((f) => taken.add(f));
  return { title, note, files: files.map((path) => ({ path, text: git("show", `HEAD:${path}`) })) };
});

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const lines = (text) => text.replace(/\n$/, "").split("\n");
const total = parts.flatMap((p) => p.files).reduce((n, f) => n + lines(f.text).length, 0);
const date = git("log", "-1", "--format=%cs").trim();
const id = (path) => "f-" + path.replace(/[^a-z0-9]/gi, "-");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AppealPath source code</title><style>
  @page { size: Letter; margin: 0.55in 0.5in 0.6in; }
  body { font: 10pt/1.4 -apple-system, "Helvetica Neue", Arial, sans-serif; color: #1a1a1a; margin: 0; }
  h1 { font-size: 26pt; margin: 1.2in 0 0.1in; }
  .cover p, .cover li { font-size: 11pt; max-width: 6.4in; }
  .cover dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 16px; font-size: 11pt; margin: 0.3in 0; }
  .cover dt { color: #555; }
  a { color: #0b5cad; text-decoration: none; }
  .toc { break-before: page; }
  .toc h2, .part > h2 { font-size: 16pt; margin: 0 0 4px; }
  .toc ol { padding-left: 1.2em; }
  .toc ul { list-style: none; padding: 0; columns: 2; font: 8.5pt/1.5 ui-monospace, Menlo, monospace; }
  .toc ul span { color: #777; }
  .part { break-before: page; }
  .part > p { color: #555; margin: 0 0 14px; }
  h3 { font: 600 10pt ui-monospace, Menlo, monospace; background: #eef1f5; padding: 5px 8px; margin: 16px 0 0; break-after: avoid; border-radius: 3px; }
  h3 span { float: right; font-weight: 400; color: #666; }
  pre { margin: 0; font: 7.3pt/1.32 ui-monospace, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
  pre div { display: grid; grid-template-columns: 3.2em 1fr; }
  pre div::before { content: attr(data-n); color: #999; text-align: right; padding-right: 0.8em; }
</style></head><body>
<section class="cover">
  <h1>AppealPath: source code</h1>
  <p>A photo of a health-insurance denial letter goes in. An AI copies the facts, a second reader on the phone checks them against the photo, the person confirms, and six fixed rules pick one next step. Built solo for DSH Hacks V2 (AI × Healthcare, problem statement B, Faster care). A prototype, not medical or legal advice; every letter in it is fictional.</p>
  <dl>
    <dt>Live app</dt><dd><a href="https://appealpath.7zhvt4rjzh.workers.dev">appealpath.7zhvt4rjzh.workers.dev</a></dd>
    <dt>Repository</dt><dd><a href="https://github.com/h6ctqtwkkg-byte/appealpath">github.com/h6ctqtwkkg-byte/appealpath</a></dd>
    <dt>This PDF</dt><dd>the main branch as of ${date} · ${parts.flatMap((p) => p.files).length} files · ${total.toLocaleString("en-US")} lines</dd>
  </dl>
  <p><b>What's here:</b> every source file: the Worker, the shared rules, the app, the tests, and the scripts that produced every measured number.</p>
  <p><b>Left out:</b> images, the fictional test letters and their answer key, saved run results, generated files and the docs. All of it is in the repository.</p>
  <p><b>How it was written:</b> most of the code was written with Claude Code, an AI coding assistant, and reviewed with Codex; DSH's rules allow AI. The decisions, the testing and the write-up are described in the Devpost entry and <code>EVALUATION.md</code>.</p>
</section>
<section class="toc"><h2>Contents</h2><ol>${parts.map((p) => `<li><b>${esc(p.title)}</b><ul>${p.files
  .map((f) => `<li><a href="#${id(f.path)}">${esc(f.path)}</a> <span>${lines(f.text).length}</span></li>`).join("")}</ul></li>`).join("")}</ol></section>
${parts.map((p, i) => `<section class="part"><h2>${i + 1}. ${esc(p.title)}</h2><p>${esc(p.note)}</p>${p.files.map((f) =>
  `<h3 id="${id(f.path)}">${esc(f.path)}<span>${lines(f.text).length} lines</span></h3><pre>${lines(f.text)
    .map((l, n) => `<div data-n="${n + 1}">${esc(l) || " "}</div>`).join("")}</pre>`).join("")}</section>`).join("\n")}
</body></html>`;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await mkdir(dirname(OUT), { recursive: true });
await page.pdf({
  path: OUT, format: "Letter", printBackground: true, outline: true, tagged: true, displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="font: 7pt -apple-system, Arial, sans-serif; color: #888; width: 100%; padding: 0 0.5in; display: flex; justify-content: space-between">
    <span>AppealPath · source code, ${date}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log(`${OUT}: ${parts.flatMap((p) => p.files).length} files, ${total} lines, ${date}`);
