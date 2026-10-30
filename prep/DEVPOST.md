# Devpost write-up (draft)

Paste each section below into the matching box on the Devpost submission form. Redrafted Oct 29, 2026, shorter, after a second judging review. Every number comes from the sources table at the bottom.

**Before you paste**
- Fill the `[[ ]]` spots: the video link, one sentence on what you did yourself, and the real-photo results once you measure them.
- If you measure real phone photos first, add that row to the results table here, on the one-pager and in `EVALUATION.md`.
- If the form asks which prizes to enter, also pick **Best Research-Oriented Project (YRI)**. `EVALUATION.md` is written for that prize. Unverified: the Devpost page doesn't say how that prize is judged.
- Read it out loud once and change anything that doesn't sound like you. Judges can ask about any line, so cut the ones you can't explain.

| Judged on ([dshhacks.org](https://www.dshhacks.org/)) | Where this page covers it |
|---|---|
| Idea: does it address the problem statement and theme? | Inspiration (problem statement B, Faster care) |
| Implementation: does it work, and how hard was it? | Try it, How I built it, How I tested it, `EVALUATION.md` |
| Design: thought put into UX | What it does (the check screen, Spanish, accessibility), the gallery |
| Presentation: is the problem clearly defined and addressed? | The video, the one-pager, and this page |

---

## Project name

AppealPath

## Elevator pitch

Denied by your health plan? AppealPath reads the letter, checks the AI's work against your photo, and fixed rules pick the first step: fix the paperwork, appeal, or urgent review.

## About the project

### Inspiration

When a health plan denies care, the first step isn't always an appeal. In 2024, insurers on HealthCare.gov denied 19% of in-network claims, and consumers appealed fewer than 1% of those denials. Of the reasons insurers reported, only 5% were a lack of medical necessity. 25% were administrative, 9% were a missing prior authorization or referral, and 36% were "other", outside the reporting categories ([KFF](https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/)).

So the same kind of letter can call for different first steps: the doctor's office fixes and resubmits the paperwork, you file an appeal, or, when care is still ahead and waiting could cause harm, you ask for an urgent review today. They run on different clocks. A plan has up to 30 days to decide an appeal for care you haven't had yet, and urgent cases can ask for an external review at the same time ([HealthCare.gov](https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/)). The letter has the answer, buried in codes and fine print, along with a deadline that's easy to miss.

AppealPath is for DSH's problem statement B, **Faster care**: it helps people find the first step that gets a denial looked at again, before the deadline passes. It doesn't diagnose anything.

### What it does

1. **Photo and 5 questions.** You take a photo of the letter and answer five questions: your kind of plan, whether the care has happened, whether your doctor says waiting could seriously harm you, whether the office has resubmitted, and your state.
2. **The AI copies the facts.** An AI vision model copies what was denied, why, the deadline and who to call, and suggests the kind of reason.
3. **A second reader checks it.** OCR running on your own phone looks for the deadline, the reason and the phone number on the photo. It highlights where each is printed and warns about any it can't find, including a fax number picked as the number to call.
4. **You confirm, then rules decide.** You check and fix what was read. Five fixed rules, checked in this order, pick one next step:
   1. **Call your plan:** Medicare, Medicaid and "not sure" plans have their own appeal rules, so AppealPath says so as soon as you pick one, and reads nothing.
   2. **Urgent review today:** the care is still ahead and your doctor says waiting could cause serious harm.
   3. **Fix & resubmit:** a paperwork problem the office hasn't already tried to fix.
   4. **Appeal:** not medically necessary, not covered, out of network or experimental, or paperwork the office already resubmitted.
   5. **Call and ask:** a letter with no clear reason gets "call and ask why" instead of a guess.

Every result says what to do and where to get free help. Fix, appeal and urgent results give the deadline exactly as printed, with a calendar reminder only when a real date is printed. Fix and urgent results include a call script. Appeal includes a printable appeal letter filled in from the letter's own words. It works in English and Spanish, and it never translates the words quoted from your letter.

It won't contact your insurer, file anything, predict whether an appeal will win, give legal advice, or save your photo or answers. **It's a prototype, not medical or legal advice, and every letter in it is fictional.**

**Try it without uploading anything:** [the AI picks a fax number and the check warns about it](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L04) · [Fix & resubmit](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L01&result) · [Appeal](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L02&result) · [Urgent review](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L03&result) · [Medicare](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L09&result) · [No clear reason](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L12&result). The samples show readings saved ahead of time; **Read it live with the AI** on any sample sends it through the real reader.

### How I built it

- **One Cloudflare Worker on the free plan.** The browser shrinks the photo and sends it to the Worker, which passes it to Workers AI. There are no accounts and no database, nothing is saved, and the Worker logs only the model, its cost and the time taken. No paid API keys.
- **The reader** is Gemma 4 (26B), told to answer in a strict JSON schema and to copy only what's printed. Missing or invalid fields come back empty instead of guessed. If Gemma fails or stalls for 15 seconds, Llama 4 Scout takes over.
- **The second reader** is Tesseract.js in the browser. OCR on a phone photo misreads letters, so it matches the AI's quotes word by word with some tolerance, and phone numbers digit by digit, including the area code. It looks for the word "fax" printed just before a number.
- **The rules** are one small function (`src/shared/rules.ts`). Each rule cites Healthcare.gov, the Arkansas Insurance Department or the U.S. Department of Labor, or is labeled a design choice (`prep/ROUTING.md`).
- **The app** is Preact and TypeScript. It has 66 automated tests and was checked against WCAG 2.1 AA, which found 7 issues, all fixed.

I used Claude Code, an AI coding assistant, for most of the code, which DSH's rules allow, and Codex (another AI) for outside reviews. [[One true sentence on what you did yourself: the decisions you made, what you tested, what you changed.]]

### How I tested it

The question behind the design: **can you trust what the AI read, and how do you know when you can't?** I wrote 18 fictional letters with an answer key. Six of them (L13–L18) were written after the reading instructions were frozen and were never used to change them. Each letter was read as a clean image and as a simulated phone photo (tilted, blurred, shadowed, compressed).

| Images | Right next step | Wrong values the second reader flagged |
|---|---|---|
| 12 development letters, clean | 12 / 12 | 2 of 2 |
| 12 development letters as 14 simulated phone photos | 14 / 14 | 2 of 2 |
| **6 held-out letters, clean and simulated phone** | **6 / 6 on both** | 0 of 1 |

What I found:
- **The AI's confidence is useless as a safety check.** In a first test, two models rated themselves 1.0 on every field, including a sentence copied with a word missing. So every upload goes to the check screen, and a second reader checks the words.
- **The dangerous mistake was the fax number.** The AI picked the fax as the number to call 4 times, and the second reader flagged all 4. On the held-out letters, with nurse, language-help and member-services numbers to pick from, it never picked a wrong number.
- **The second reader checks words, not meaning.** On held-out L13, the AI copied the deadline plus two extra sentences, and the second reader passed it, since every word is on the page.

**Limits:** 18 synthetic letters from one author, simulated photos, one read per image. [[Add the real-photo results here once measured.]] Every miss, the method and how to rerun it are in [`EVALUATION.md`](https://github.com/h6ctqtwkkg-byte/appealpath/blob/main/EVALUATION.md).

### Challenges I ran into

- **Confidently wrong AI.** "Ask the user when the AI is unsure" never fires if it's always sure. The fix was structural: a second reader checks the first, and a person checks both.
- **Never calculating a deadline.** Most letters say "within 180 days of the date of this notice" (10 of the first 12). Working out that date is the kind of mistake that can cost someone their appeal, so AppealPath quotes the words. A review also caught that "within 180 days of November 1" would have put the reminder on November 1, the day the count starts. Now a date goes on the calendar only when the words right before it call it the deadline ("by", "no later than") and the sentence doesn't count days.
- **Corrections that count.** If you edit the reason, the app asks you to confirm the kind of reason still fits, since that's what picks the next step.

### Accomplishments that I'm proud of

- The right next step on every test image, including the held-out letters it was never tuned on, with every fax-number mistake flagged.
- The AI reads and suggests, but never decides. Every result traces to a written rule.
- It runs free, saves nothing, works in English and Spanish, and lets judges see the check warn about a real AI mistake in one tap.

### What I learned

- An AI's confidence score told me nothing about whether it was right, so its work has to be checked some other way.
- Splitting "read" from "decide" made the AI's job small enough to test, and the rules simple enough to explain.
- Measure before claiming, and say what the measurement doesn't cover.

### What's next for AppealPath

- Measure real phone photos, publish the misses, then fix them.
- Watch real people use it, and have a native Spanish speaker review the wording.
- Add free-help contacts for more states (only Arkansas has them now), and real paths for Medicare and Medicaid.

## Built with

cloudflare-workers, workers-ai, gemma, llama, tesseract.js, preact, typescript, esbuild, vitest

## "Try it out" links

- https://appealpath.7zhvt4rjzh.workers.dev
- https://github.com/h6ctqtwkkg-byte/appealpath

## Video demo link

[[YouTube or Vimeo link]]

## Image gallery

Upload these from `docs/gallery/` in this order. They're 3:2, the shape Devpost shows, and the first one becomes the thumbnail: `1-cover.png`, `2-how-it-works.png`, `3-check.png`, `4-appeal.png`, `5-urgent-and-guard.png`, `6-results.png`.

## Files to attach

- `prep/AppealPath-one-pager.pdf`, re-rendered after the video link is added (steps in `prep/ONE-PAGER.md`).
- A zip of the code, made right before submitting. An old DSH update asked for one, and nothing has said it's no longer needed:

```bash
git -C /Users/nbrew/AppealPath archive --format=zip -o AppealPath-source.zip HEAD
```

---

## Sources for every number

| Claim | Source |
|---|---|
| 19% of in-network claims denied, fewer than 1% appealed; shares of reported reasons: "other" 36%, administrative 25%, prior authorization or referral 9%, medical necessity 5% (HealthCare.gov insurers, 2024) | [KFF, "Claims Denials and Appeals in ACA Marketplace Plans in 2024", Mar 24, 2026](https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/), checked Oct 29, 2026 |
| Up to 30 days to decide an appeal for care not yet received; urgent cases can request external review at the same time | [HealthCare.gov, internal appeals](https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/), checked Oct 29, 2026 |
| Problem statement B, Faster care: "a platform that gets patients care sooner" | [dshhacks.org](https://www.dshhacks.org/), checked Oct 29, 2026 |
| 12/12, 14/14, 6/6, second-reader counts, every miss | `public/accuracy.json`, `test-letters/runs/`, `EVALUATION.md` |
| The fax mistake on 4 images; no wrong number on the held-out letters | `public/accuracy.json` misses |
| Confidence 1.0, the missing word | `prep/READER-TEST.md` |
| 66 tests | `npm test`, Oct 29, 2026 |
| 10 of the first 12 letters give a relative deadline | `test-letters/ANSWER-KEY.md` |
| The calendar fix for "within 180 days of November 1" | `src/shared/dates.ts`, `test/dates.test.ts` |
| Which rules win in which order | `src/shared/rules.ts` |
| What's saved and logged | `src/worker.ts`, `saveLang` in `src/client/i18n.ts` |
| WCAG 2.1 AA, 7 issues | `prep/ACCESSIBILITY.md` |
| AI tools allowed | [Devpost rules](https://dsh-hacks-v2.devpost.com/rules): "We allow the use of AI in your submission." |
