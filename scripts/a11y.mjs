// Automated WCAG 2.1 AA check with axe-core on every screen, including the newer ones (the stop before unconfirmed
// values, the rule trace, Listen and Send, the doctor note, the rules explorer, a multi-page sample), in light and dark
// mode and in Spanish. Uses the sample letters, so no AI is called. A tool finds only some problems; a person with a
// screen reader is still the real test (prep/VOICEOVER-CHECK.md).
//   node scripts/a11y.mjs   (dev server on :8792)   APP_URL=…
import { chromium } from "playwright-core";

const BASE = process.env.APP_URL ?? "http://localhost:8792";
const tap = (name) => (p) => p.getByRole("button", { name }).click();
const SCREENS = [
  ["first screen", "/"],
  ["check screen, fax sample", "/?sample=L04", { ocr: true }],
  ["stop before unconfirmed values", "/?sample=L04", { ocr: true, act: tap("Looks right, show my next step") }],
  ["three-page sample", "/?sample=G01", { ocr: true }],
  ["result: appeal, trace, doctor note", "/?sample=L02&result"],
  ["result: external review", "/?sample=G01&result"],
  ["result: urgent", "/?sample=L03&result"],
  ["result: call your plan", "/?sample=L09&result"],
  ["how it decides, with the explorer", "/#how"],
];

const browser = await chromium.launch({ channel: "chrome" });
let total = 0;
for (const scheme of ["light", "dark"]) {
  for (const lang of ["en", "es"]) {
    if (scheme === "dark" && lang === "es") continue;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    await context.addInitScript((l) => localStorage.setItem("appealpath.lang", l), lang);
    const page = await context.newPage();
    for (const [name, path, opts = {}] of SCREENS) {
      if (lang === "es" && opts.act) continue; // the stop is reached by an English button name
      await page.goto(BASE + path);
      await page.waitForSelector("main h1");
      await page.waitForTimeout(1200);
      if (opts.ocr) await page.waitForFunction(() => /finished|terminad/i.test(document.body.innerText), null, { timeout: 90_000 });
      if (opts.act) {
        await opts.act(page);
        await page.waitForTimeout(400);
      }
      await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
      const result = await page.evaluate(() => window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } }));
      total += result.violations.length;
      console.log(`${result.violations.length ? "✗" : "✓"} ${scheme}/${lang} · ${name}: ${result.violations.length} problems, ${result.passes.length} rules passed`);
      for (const v of result.violations) console.log(`    ${v.impact} ${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
    }
    await context.close();
  }
}
await browser.close();
console.log(total ? `\n${total} problems found` : "\nNo problems found by axe on any screen.");
process.exitCode = total ? 1 : 0;
