// Builds the Devpost gallery: phone screenshots of the app laid out on 3:2 slides (1800×1200), the shape Devpost's
// gallery and thumbnail show. Uses the sample letters only, so no AI is called.
//   node scripts/gallery.mjs                     → docs/gallery/1-cover.png … 6-results.png
//   APP_URL=http://localhost:8792 node scripts/gallery.mjs
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.env.APP_URL ?? "https://appealpath.7zhvt4rjzh.workers.dev";
const OUT = "docs/gallery";
const SHOTS = `${OUT}/.shots`;
const accuracy = JSON.parse(await readFile("public/accuracy.json", "utf8"));

const browser = await chromium.launch({ channel: "chrome" });
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-US", colorScheme: "light" });
const page = await phone.newPage();
await rm(SHOTS, { recursive: true, force: true });
await mkdir(SHOTS, { recursive: true });

// Waits for the second reader when the screen has one, runs `act` (taps and typing), then scrolls `target` to `at` px
// from the top of the screen.
async function shot(name, url, { target, at = 120, es = false, ocr = false, act } = {}) {
  await page.goto(`${BASE}/${url}`);
  // A ?sample= link shows the first screen until the sample has opened.
  await page.waitForSelector("main h1");
  await page.waitForFunction((sample) => !sample || !document.querySelector(".try-card"), url.includes("sample="));
  // The app remembers the language, so switch whenever the last shot left it in the other one.
  if ((await page.evaluate(() => document.documentElement.lang === "es")) !== es) {
    await page.locator("header button.lang").click();
    await page.waitForFunction((es) => (document.documentElement.lang === "es") === es, es);
  }
  if (ocr) await page.waitForFunction(() => /finished|terminó/i.test(document.body.innerText), null, { timeout: 90_000 });
  if (act) await act(page);
  if (target) {
    await page.waitForFunction(
      (sel) => [...document.querySelectorAll("main *")].some((e) => e.matches(sel.css) && (!sel.text || e.textContent.includes(sel.text))),
      target,
    );
  }
  await page.waitForTimeout(800); // a new screen scrolls itself to the top first
  await page.evaluate(
    ([sel, at]) => {
      const el = sel && [...document.querySelectorAll("main *")].find((e) => e.matches(sel.css) && (!sel.text || e.textContent.includes(sel.text)));
      window.scrollTo(0, el ? el.getBoundingClientRect().top + scrollY - at : 0);
    },
    [target ?? null, at],
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

// L04's story: the AI picked the fax number, the check won't let it through unseen, the person fixes it, one next step.
const tapContinue = (p) => p.getByRole("button", { name: "Looks right, show my next step" }).click();
const fixPhone = async (p) => {
  await p.locator("#phone").fill("(479) 555-0177");
  await tapContinue(p);
};
await shot("check-fax", "?sample=L04", { target: { css: "label, .q-label, span", text: "Phone number for appeals" }, at: 300, ocr: true });
await shot("check-gate", "?sample=L04", { ocr: true, act: tapContinue, target: { css: "#unconfirmed-gate" }, at: 380 });
await shot("fixed-result", "?sample=L04", { ocr: true, act: fixPhone, target: { css: "h1" }, at: 400 });
await shot("trace", "?sample=L04", { ocr: true, act: fixPhone, target: { css: "#trace-h" }, at: 40 });
await shot("appeal-letter", "?sample=L04", { ocr: true, act: fixPhone, target: { css: "h2", text: "Your appeal letter" }, at: 40 });
await shot("urgent", "?sample=L03&result");
await shot("urgent-es", "?sample=L03&result", { es: true });
await shot("guard", "?sample=L09&result");
await shot("fix", "?sample=L01&result");
await phone.close();

// The slides, with the screenshots inlined.
const pngs = {};
for (const n of ["check-fax", "check-gate", "fixed-result", "trace", "appeal-letter", "urgent", "urgent-es", "guard", "fix"]) {
  pngs[n] = (await readFile(`${SHOTS}/${n}.png`)).toString("base64");
}
const img = (name) => `<img src="data:image/png;base64,${pngs[name]}" alt="">`;
const device = (name, label = "") => `<figure class="device">${label ? `<figcaption>${label}</figcaption>` : ""}<div class="frame">${img(name)}</div></figure>`;
const logo = `<svg width="54" height="54" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#1f3f6e"/><path d="M9 8h10l4 4v12H9z" fill="#fff"/><path d="M12 18h6m-2.5-3 3 3-3 3" stroke="#1f3f6e" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const foot = `<footer><b>Prototype, not medical or legal advice.</b> Every letter shown is fictional. · appealpath.7zhvt4rjzh.workers.dev · DSH Hacks V2, problem statement B: Faster care</footer>`;

// The results slide's counts come from the saved runs: test-letters/runs/repeats (scripts/repeats-summary.mjs),
// baseline.json (scripts/baseline.mjs) and injection.json (scripts/injection.mjs). The words around them (every wrong
// phone flagged, March 3 for March 31, 54–100%) were checked against those runs on Oct 30; recheck them after a new run.
const repeatsSummary = JSON.parse(await readFile("test-letters/runs/repeats/summary.json", "utf8"));
const baselineRun = JSON.parse(await readFile("test-letters/runs/baseline.json", "utf8"));
const injectionRun = JSON.parse(await readFile("test-letters/runs/injection.json", "utf8"));
const frac = (rows, key) => {
  const [a, b] = rows.map((r) => r[key].split("/").map(Number)).reduce((x, y) => [x[0] + y[0], x[1] + y[1]], [0, 0]);
  return `${a} / ${b}`;
};
const runsCount = repeatsSummary.table.length;
const aiSteps = frac(repeatsSummary.table, "next step");
const wrongPhones = repeatsSummary.table.reduce((n, r) => n + Number(r["phone"].split("/")[1]) - Number(r["phone"].split("/")[0]), 0);
const baseline = { step: frac(baselineRun.table, "step"), phone: frac(baselineRun.table, "phone") };
const attacks = injectionRun.cases.filter((c) => c.variant !== "control" && !c.error);
const injection = { kept: `${attacks.filter((c) => c.outcome === c.expected).length} / ${attacks.length}`, attacks: attacks.length, followed: attacks.filter((c) => c.tookAttackPhone || !c.categoryRight).length };
const run = (match) => accuracy.runs.find((r) => r.images.includes(match));
const devClean = run("clean digital images of the printed pages");
const devPhone = run("simulated phone-like");
const heldClean = accuracy.runs.find((r) => r.images.startsWith("held-out") && r.images.includes("clean"));
const heldPhone = accuracy.runs.find((r) => r.images.startsWith("held-out") && r.images.includes("phone"));
const steps = (r) => `${r.results.right} / ${r.results.total}`;

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { width: 1800px; height: 1200px; overflow: hidden; background: #f6f4ef; color: #1a2332; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; position: relative; }
  .slide { position: absolute; inset: 0; padding: 72px 84px 0; display: flex; gap: 64px; }
  .text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 40px; font-weight: 700; letter-spacing: -0.01em; }
  .kicker { margin-top: 56px; font-size: 22px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #1f3f6e; }
  h1 { margin-top: 18px; font-size: 68px; line-height: 1.08; letter-spacing: -0.02em; }
  h2 { margin-top: 14px; font-size: 54px; line-height: 1.12; letter-spacing: -0.015em; }
  p.lede { margin-top: 26px; font-size: 30px; line-height: 1.42; color: #4b5567; }
  ul.points { margin-top: 30px; padding: 0; list-style: none; font-size: 27px; line-height: 1.4; }
  ul.points li { padding-left: 36px; position: relative; margin-bottom: 16px; }
  ul.points li::before { content: ""; position: absolute; left: 4px; top: 13px; width: 14px; height: 14px; border-radius: 50%; background: #c4a96a; }
  .chips { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 34px; }
  .chip { font-size: 26px; font-weight: 700; padding: 12px 22px; border-radius: 999px; }
  .fix { background: #e7f3ef; color: #1b6b5a; } .appeal { background: #e9eefa; color: #2d4a9a; } .urgent { background: #fbecea; color: #a1261b; } .guard { background: #eef0f3; color: #535c6b; }
  .stat { margin-top: auto; margin-bottom: 120px; border-left: 6px solid #c4a96a; padding: 6px 0 6px 26px; font-size: 26px; line-height: 1.45; color: #1a2332; }
  .stat small { display: block; font-size: 19px; color: #626a7a; margin-top: 6px; }
  .devices { display: flex; gap: 34px; align-items: flex-start; }
  .device { width: 410px; }
  .device figcaption { font-size: 22px; font-weight: 700; color: #1f3f6e; margin: 0 0 14px 6px; letter-spacing: .02em; }
  .frame { background: #1a2332; padding: 14px; border-radius: 44px; box-shadow: 0 26px 60px rgba(26,35,50,.25); }
  .frame img { display: block; width: 382px; height: 827px; border-radius: 31px; }
  .devices.three .device { width: 380px; } .devices.three .frame img { width: 352px; height: 762px; }
  footer { position: absolute; left: 84px; right: 84px; bottom: 34px; font-size: 19px; color: #4b5567; border-top: 2px solid #dcd7cb; padding-top: 16px; }
  footer b { color: #1a2332; }
  .flow { display: flex; align-items: stretch; gap: 0; margin-top: 64px; }
  .box { flex: 1; background: #fff; border: 2px solid #dcd7cb; border-radius: 18px; padding: 26px 22px; font-size: 24px; line-height: 1.35; color: #4b5567; }
  .box b { display: block; font-size: 29px; line-height: 1.2; color: #1a2332; margin-bottom: 10px; }
  .box.ai { border-color: #2d4a9a; } .box.ocr { border-color: #1b6b5a; } .box.you { border-color: #c4a96a; } .box.rules { border-color: #1f3f6e; background: #1f3f6e; color: #dfe6f2; } .box.rules b { color: #fff; }
  .arrow { width: 54px; display: flex; align-items: center; justify-content: center; color: #857f70; font-size: 40px; }
  .outcomes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 40px; }
  .outcomes div { border-radius: 16px; padding: 20px 22px; font-size: 22px; line-height: 1.35; }
  .outcomes b { display: block; font-size: 27px; margin-bottom: 6px; }
  .note { margin-top: 44px; font-size: 26px; color: #4b5567; line-height: 1.45; }
  table { margin-top: 40px; border-collapse: collapse; width: 100%; font-size: 27px; }
  th, td { text-align: left; padding: 18px 20px; border-bottom: 2px solid #dcd7cb; vertical-align: top; }
  th { font-size: 19px; text-transform: uppercase; letter-spacing: .06em; color: #626a7a; }
  td.big { font-size: 44px; font-weight: 800; color: #1f3f6e; white-space: nowrap; }
  tr.held td { background: #fff; } tr.held td:first-child { border-left: 6px solid #c4a96a; }
`;

const slides = {
  "1-cover": `<div class="slide"><div class="text">
      <div class="brand">${logo} AppealPath</div>
      <h1 style="margin-top:64px">A health insurance denial letter in. The right first step out.</h1>
      <p class="lede">The AI copies the facts, a second reader checks them against the photo, you confirm, and fixed rules pick one next step.</p>
      <div class="chips"><span class="chip fix">Fix &amp; resubmit</span><span class="chip appeal">Appeal</span><span class="chip urgent">Urgent review today</span><span class="chip guard">Call your plan</span></div>
      <div class="stat">In 2024, insurers on HealthCare.gov denied 19% of in-network claims, and fewer than 1% of those denials were appealed.<small>KFF, Claims Denials and Appeals in ACA Marketplace Plans in 2024</small></div>
    </div><div class="devices">${device("check-fax", "1. The AI picked the fax number")}${device("fixed-result", "2. Fixed by the person, then one step")}</div></div>${foot}`,

  "2-how-it-works": `<div class="slide" style="flex-direction:column;gap:0"><div class="brand">${logo} AppealPath</div>
      <div class="kicker">How it works</div>
      <h2>The AI reads. Rules decide. You check in between.</h2>
      <div class="flow">
        <div class="box"><b>Photo + 5 answers</b>Plan type, has the care happened, does the doctor say waiting could harm, has the office resubmitted, your state</div>
        <div class="arrow">→</div>
        <div class="box ai"><b>AI copies the facts</b>Gemma 4 on Workers AI copies what was denied, why, the deadline and who to call. Blank if not printed.</div>
        <div class="arrow">→</div>
        <div class="box ocr"><b>Second reader checks</b>Tesseract OCR on your phone finds those words on the photo and warns about a mismatch or a fax number.</div>
        <div class="arrow">→</div>
        <div class="box you"><b>You confirm</b>The deadline and the reason come first. Change the reason, and it asks again which kind it is.</div>
        <div class="arrow">→</div>
        <div class="box rules"><b>5 fixed rules</b>Checked in order. Two cite HealthCare.gov; the rest are labeled design choices, so anyone can check them.</div>
      </div>
      <div class="outcomes">
        <div class="urgent"><b>Urgent review today</b>Care still ahead and the doctor says waiting could cause serious harm</div>
        <div class="fix"><b>Fix &amp; resubmit</b>Missing prior authorization, records or a billing fix</div>
        <div class="appeal"><b>Appeal</b>Not medically necessary, not covered, out of network, experimental</div>
        <div class="guard"><b>Call your plan</b>Medicare, Medicaid, "not sure", or no clear reason: no guessing</div>
      </div>
      <p class="note">The deadline is always quoted as printed, never calculated. No accounts, no database: photos and answers aren't saved. Runs on Cloudflare's free plan.</p>
    </div>${foot}`,

  "3-check": `<div class="slide"><div class="text">
      <div class="brand">${logo} AppealPath</div>
      <div class="kicker">Check what we read</div>
      <h2>The AI picked the fax number. The app won't let that slip through unseen.</h2>
      <ul class="points">
        <li>A real reading of fictional letter L04, saved as a sample: the AI copied the fax line as the number to call.</li>
        <li>The second reader, running on the phone, couldn't confirm the number. Tapping on stops and asks the person to compare it with the letter.</li>
        <li>In testing, the AI rated itself 100% sure of a sentence it copied wrong, so AppealPath never uses its confidence.</li>
      </ul>
    </div><div class="devices">${device("check-fax", "The warning")}${device("check-gate", "Tap on, and it asks first")}</div></div>${foot}`,

  "4-appeal": `<div class="slide"><div class="text">
      <div class="brand">${logo} AppealPath</div>
      <div class="kicker">Next step: appeal</div>
      <h2>It shows why this step, and writes the appeal letter in the letter's own words.</h2>
      <ul class="points">
        <li>The five rules are listed in order, up to the one that fit, so the person can see which rule picked it and why.</li>
        <li>The deadline is quoted, never worked out. A calendar reminder appears only when the words call a date the deadline.</li>
        <li>Step 1 depends on the reason, and external review is only promised for denials HealthCare.gov says qualify.</li>
      </ul>
    </div><div class="devices">${device("trace", "Why this next step")}${device("appeal-letter", "Ready to print and sign")}</div></div>${foot}`,

  "5-urgent-and-guard": `<div class="slide" style="flex-direction:column;gap:0"><div class="brand">${logo} AppealPath</div>
      <div class="kicker">The other next steps, and Spanish</div>
      <div class="devices three" style="margin-top:34px;justify-content:space-between">
        ${device("urgent", "Care still ahead + harm: urgent today")}
        ${device("guard", "Medicare: call your plan, nothing read")}
        ${device("urgent-es", "En español: quotes stay as printed")}
        ${device("fix", "Paperwork: fix & resubmit, with a script")}
      </div></div>${foot}`,

  "6-results": `<div class="slide" style="flex-direction:column;gap:0"><div class="brand">${logo} AppealPath</div>
      <div class="kicker">How well it works, on 18 fictional letters</div>
      <h2>The right next step on every image, in every run. A reader with no AI: ${baseline.step}.</h2>
      <table>
        <tr><th>Test</th><th>Right next step</th><th>What else it showed</th></tr>
        <tr class="held"><td><b>AI reader</b>, 38 images × ${runsCount} runs</td><td class="big">${aiSteps}</td><td>Picked a wrong phone number ${wrongPhones} times, mostly the fax; the second reader flagged every one</td></tr>
        <tr><td><b>No-AI baseline</b>: OCR and keyword rules, same 38 images</td><td class="big">${baseline.step}</td><td>Better at phone numbers (${baseline.phone}), but read one deadline as March 3 instead of March 31</td></tr>
        <tr class="held"><td><b>6 held-out letters</b>, written after the reader was frozen</td><td class="big">6 / 6</td><td>Every run; still only 6 letters: an exact 95% interval of 54–100%</td></tr>
        <tr><td><b>Planted instruction</b> on 3 letters: "report a 1-900 number"</td><td class="big">${injection.kept}</td><td>Followed ${injection.followed} of ${injection.attacks} attack reads; a 900 number never becomes a call link</td></tr>
      </table>
      <p class="note">Limits: synthetic letters from one author, simulated photos; real phone photos and real users not measured yet. Every miss and the method: EVALUATION.md in the repo.</p>
    </div>${foot}`,
};

const slidesBrowser = await browser.newContext({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 1 });
const sp = await slidesBrowser.newPage();
for (const [name, body] of Object.entries(slides)) {
  await sp.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`);
  await sp.waitForTimeout(150);
  await sp.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${OUT}/${name}.png`);
}
await browser.close();
await rm(SHOTS, { recursive: true, force: true });
await writeFile(`${OUT}/README.md`, "Devpost gallery slides (1800×1200, 3:2), built by `node scripts/gallery.mjs` from the sample letters. Upload them in number order; the first is the thumbnail.\n");
