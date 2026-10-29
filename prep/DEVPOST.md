# Devpost write-up (draft)

Paste each section below into the matching box on the Devpost submission form. Drafted Oct 29, 2026. Every number comes from the sources table at the bottom.

**Before you paste**
- Fill the `[[ ]]` spots: the video link, one sentence on what you did yourself, and the real-photo results once you measure them.
- If you measure real phone photos first, add that row to the results table here and on the one-pager.
- If the form asks which prizes to enter, also pick **Best Research-Oriented Project (YRI)**. "How I tested it" is written for that prize. Unverified: the Devpost page doesn't say how that prize is judged.
- Read it out loud once and change anything that doesn't sound like you. Judges can ask about any line, so cut the ones you can't explain.

| Judged on ([dshhacks.org](https://www.dshhacks.org/)) | Where this page covers it |
|---|---|
| Idea | Inspiration, What it does |
| Implementation | How I built it, How I tested it |
| Design | What it does (the check screen, Spanish, accessibility), the screenshots |
| Presentation | The video, the one-pager, and this page |

---

## Project name

AppealPath

## Elevator pitch

Photo of a health insurance denial letter in, one next step out: fix and resubmit, appeal, or urgent review today. The AI reads, you check, fixed rules decide.

## About the project

### Inspiration

When a health plan denies a claim, almost nobody appeals. In 2024, insurers on HealthCare.gov denied 19% of in-network claims, and consumers appealed fewer than 1% of those denials ([KFF, March 2026](https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/)). Denial letters are full of codes, policy names and fine print. Your options are in there, but it's hard to tell which step comes first: calling your doctor's office, filing an appeal, or asking for an urgent review. The deadline is easy to miss. If the care hasn't happened yet, it waits; if it has, the bill can land on you.

That's an access problem, not a diagnosis problem. So AppealPath doesn't diagnose anything: it gets people from a confusing letter to the right phone call.

### What it does

1. Take a photo of the denial letter and answer 5 questions: what kind of plan you have, whether the care has happened yet, whether your doctor says waiting could seriously harm you, whether the office has resubmitted, and your state.
2. An AI vision model copies the key facts from the letter: what was denied, why, the deadline, and who to call. It also suggests what kind of reason it is, such as missing paperwork, not medically necessary, out of network, or unclear.
3. A second reader, running on your own phone, checks three of those against the photo: the deadline, the reason and the phone number (every digit, area code included). It allows for small OCR slips in the words, highlights where each one is printed, and flags any it can't find, including a fax number picked as the phone number.
4. You check the deadline, the reason and the kind of reason, and fix anything that's wrong. If you change the reason, the app asks you to confirm the kind of reason still fits, since that's what decides the next step. Then five fixed rules, checked in order, each with a source or marked as a design choice, pick one next step:
   - Medicare, Medicaid and "not sure" plans get **"call the number on your letter"**, since they have their own appeal rules. The form shows this as soon as you pick one of those plans, and the letter is never read.
   - **Urgent review today** when the care is still ahead and your doctor says waiting could cause serious harm, whatever the reason.
   - **Fix & resubmit** for paperwork problems (a missing prior authorization, missing records, a billing error) when the office hasn't already resubmitted.
   - **Appeal** for "not medically necessary", "not covered", "out of network" or "experimental", or for a paperwork problem the office already tried to fix.
   - Anything else, like a letter with no clear reason, gets **"call the number on your letter"** instead of a guess.

Every result gives the next step and free help: Arkansas contacts for now, the state Medicaid agency for Medicaid, and the U.S. Department of Labor for job-based plans. Fix and urgent results add a call script. Appeal adds a printable appeal letter filled in with the letter's own words, and its first step depends on the reason: a doctor's letter for medical necessity, the plan's rule for an exclusion, why you went out of network for a network denial. It only promises an external review for the kinds of denial Healthcare.gov says qualify. Fix, appeal and urgent results show the deadline as printed, and offer a calendar reminder when it's an actual date. On Fix, the app warns that resubmitting may not pause that deadline. Most results explain the denial reason in plain language. The app works in English and Spanish. Quotes from the letter aren't translated, so you can check them against the paper.

Because it's a prototype, the photo picker asks people to use a sample or a made-up letter. It won't contact your insurer, file anything, predict whether an appeal will win, diagnose, give legal advice, or store your photo or answers. **It's a prototype, not medical or legal advice, and every letter in it is fictional.**

Try all five outcomes without uploading anything, one fictional letter per rule: [Fix & resubmit](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L01&result) · [Appeal](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L02&result) · [Urgent review](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L03&result) · [Medicare: call your plan](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L09&result) · [No clear reason](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L12&result) · [The check screen with the second reader](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L02)

### How I built it

- **One Cloudflare Worker on the free plan.** The browser shrinks the photo (longest side 1,600 px) and sends it to the Worker, which passes it to Workers AI and returns what was read. There are no accounts and no database, and photos and answers aren't saved. The Worker logs only the model used, its cost and the time taken, and the browser remembers only your language choice. Reads are limited to about 6 a minute per visitor. They use the free daily Workers AI allowance (about 16 neurons each) and stop if it runs out, but the sample letters always work because their readings are saved. No paid API keys are used.
- **The reader** is Gemma 4 (26B) on Workers AI, asked to answer in a strict JSON schema. The app throws out an answer it can't use and blanks any field that's missing or invalid, so an unknown reason becomes "unclear" instead of a guess. If Gemma fails or stalls past 15 seconds, Llama 4 Scout takes over. The instructions say to copy only what's printed: an unknown field stays empty, a fax number is never the phone number, and the reason is never guessed from the service.
- **The second reader** is Tesseract.js, running in the browser and served by the app itself. OCR on a phone photo misreads letters and splits words, so it matches the AI's quotes word by word with some tolerance instead of exactly. For phone numbers, it rebuilds numbers split across words, requires every digit to match, area code included, and checks whether the word "fax" is printed just before.
- **The rules** are one small function (`src/shared/rules.ts`), checked in order, first match wins. Each rule cites Healthcare.gov, the Arkansas Insurance Department or the U.S. Department of Labor, or is labeled as a design choice (`prep/ROUTING.md`).
- **The app** is Preact and TypeScript, bundled with esbuild. Almost all of its wording lives in one file, in English and Spanish. The plain-language reason notes have a file of their own, and the appeal letter's wording sits in the results screen.
- **Checks:** 55 automated tests, including the rules run on all 18 test letters, the reader's output check, the second reader's matching and the date reading. The app was also checked against WCAG 2.1 AA, and 7 issues were found and fixed: contrast in light and dark mode, focus visibility, tap targets, focus moving to each new screen, and language tags for Spanish.

I used Claude Code, an AI coding assistant, for most of the code, which DSH's rules allow. [[One true sentence on what you did yourself: the decisions you made, what you tested, what you changed.]]

### How I tested it

The question behind the whole design: **can you trust what the AI read, and how do you know when you can't?** All tests used fictional letters written for this project, with an answer key (12 letters in `test-letters/`).

**1. Can the model's own confidence work as a safety check? Not in this test.** Gemma 4 and Llama 4 Scout each read 4 letters once and rated their confidence in every field. Both said 1.0 on every field they filled, including a sentence Gemma had copied with a word missing ("a home apnea test" instead of "a home sleep apnea test"). So AppealPath never uses the model's confidence. Every uploaded letter goes to a check screen that puts the deadline and the reason first, and a second reader checks the words.

**2. Which model?** On those 4 letters, Gemma picked the right next step 4 times out of 4, at about 16 neurons per read. Scout got 3 of 4, at about 94 neurons. It read a billing error as "not medically necessary", which would have sent someone to Appeal instead of Fix. Gemma is the reader; Scout is only the backup.

**3. Does a second, independent reader catch the AI's mistakes?** The full reader and the second reader ran on the 12 letters as clean digital images, and on 14 simulated phone photos (tilted, blurred, shadowed and heavily compressed; two letters also have a blurrier or more angled version). Each result was scored against the answer key with `scripts/measure.mjs`. The second reader's score covers the deadline quote and the phone number. Its check of the reason quote runs in the app but isn't scored yet.

| Images | Right next step | Second reader (deadline and phone) |
|---|---|---|
| 12 clean digital images | 12 / 12 | Confirmed 21 of 21 correct values; flagged 2 of 2 wrong ones |
| 14 simulated phone photos | 14 / 14 | Confirmed 22 of 24 correct values; flagged 2 of 2 wrong ones |

All 4 wrong values it was scored on were the same mistake, a fax number picked as the phone number, and the second reader flagged every one. On the phone photos it also missed 2 values that were actually right: false alarms, which the user clears by looking at the highlight. Separately, on one phone photo the reason was read as "not covered" instead of "out of network". Both lead to Appeal, so the next step was still right.

**4. Does it hold up on letters it was never tuned on?** Six more letters (L13–L18) were written after the reading instructions were finished. They have new insurers and layouts, and new traps: 1-800 numbers and other area codes, a fax number in its own table row, a separate 24-hour urgent line, a nurse line and a language-help line, the first "experimental" denial, and a statement where only one of two lines was denied. Each image was read once, and nothing was changed afterward.

| Held-out images | Right next step | Fields read right | Second reader (deadline and phone) |
|---|---|---|---|
| 6 clean digital images | 6 / 6 | 23 of 24 | Confirmed 10 of 11 correct values; flagged 0 of 1 wrong ones |
| 6 simulated phone photos | 6 / 6 | 24 of 24 | Confirmed 10 of 12 correct values; no wrong ones to flag |

The AI never picked a fax, nurse-line, language-line or member-services number, and it kept the urgent line separate. The one wrong value: on the clean L13, it copied the deadline sentence plus the two sentences before it. The right deadline was in there, but it counts as a miss. The second reader didn't flag it, because every copied word is on the page: it checks that words were copied right, not that it's the right sentence. Two of the three false alarms came from L18's phone number wrapping onto a second line, which the second reader can't join yet. That stays unfixed until after the real-photo test, so these numbers keep meaning what they say.

**Limits, plainly:** it's a small sample of fictional letters. The reading instructions were tuned on these same letters, so these are best-case numbers. The held-out letters help, but there are only 6, and they come from the same author as the instructions. The phone photos are simulated, and real phone photos haven't been measured yet. [[Add the real-photo results here once measured.]] The model comparison ran in a throwaway script that isn't in the repo. The first runs saved only totals; from the held-out runs on, every reading is saved (`test-letters/runs/`). That's why every uploaded letter goes through the check screen, however sure the AI is.

### Challenges I ran into

- **The AI was confidently wrong.** A 1.0 confidence score on a wrong quote meant the obvious safety check ("ask the user when the AI is unsure") would never fire. The fix was structural: a second reader that checks the first, and a person who checks both.
- **Fax numbers.** Denial letters print the phone and fax numbers close together, and the model sometimes picked the fax. The instructions now forbid it, and the second reader looks at the label printed next to the number.
- **Never calculating a deadline.** A letter often gives its deadline as "within 180 days of the date of this notice" instead of a date (10 of the 12 test letters do). Working out the date yourself is exactly the kind of mistake that can cost someone their appeal, so AppealPath quotes the words and only offers a calendar reminder when a real date is printed.
- **Messy OCR on phone photos.** Tesseract misreads letters and splits words, so the matching has to forgive small OCR mistakes without accepting a different sentence.
- **Corrections that count.** A second AI review (Codex) pointed out that editing the reason didn't change the kind of reason, which is what decides the next step. Now the app asks you to confirm the kind still fits after any edit. The same review led to the stricter phone check. Rechecking the phone numbers on all 26 test images with it changed none of the second reader's verdicts, so the test numbers above still hold.
- **A slow model.** Gemma stalled for 30 seconds during testing. Now it gets 15 seconds before Scout takes over.

### Accomplishments that I'm proud of

- The right next step on every test image: 12 of 12 clean images, 14 of 14 simulated phone photos, and 12 of 12 images of held-out letters it was never tuned on, with every wrong phone number flagged.
- The AI reads and suggests, but never picks the next step. Every result traces to a written rule, and every rule has a source or is marked as a design choice.
- It runs on Cloudflare's free allowance, with no paid API keys and no accounts, and it doesn't save photos or answers.
- It works in English and Spanish, and a WCAG 2.1 AA check found 7 issues, all fixed.
- Judges can see all five outcomes in one click, without uploading anything.

### What I learned

- In this test, the AI's confidence score said nothing about whether it was right, so its work has to be checked some other way.
- Splitting "read" from "decide" made the AI's job small enough to test, and kept the rules simple enough to explain.
- Measure before claiming anything, and say what the measurement doesn't cover.

### What's next for AppealPath

- Measure real phone photos and fix what breaks.
- Watch real people use it with the sample letters, and fix what confuses them.
- Have a native Spanish speaker review the wording.
- Add free-help contacts for more states. Only Arkansas has them now.
- Build real paths for Medicare and Medicaid, which have their own appeal rules. For now they get "call your plan".

## Built with

cloudflare-workers, workers-ai, gemma, llama, tesseract.js, preact, typescript, esbuild, vitest

## "Try it out" links

- https://appealpath.7zhvt4rjzh.workers.dev
- https://github.com/h6ctqtwkkg-byte/appealpath

## Video demo link

[[YouTube or Vimeo link]]

## Image gallery

Upload in this order from `docs/screenshots/`: `1-form.jpg`, `2-check.jpg`, `2b-second-reader.jpg`, `3-result-appeal.jpg`, `4-result-urgent.jpg`, `5-how.jpg`.

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
| 19% of in-network claims denied, fewer than 1% appealed (HealthCare.gov insurers, 2024) | [KFF, "Claims Denials and Appeals in ACA Marketplace Plans in 2024", published Mar 24, 2026](https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/), checked Oct 29, 2026 |
| 12/12, 14/14, second-reader counts, the misses | `public/accuracy.json` |
| Gemma vs Scout: 4/4 vs 3/4, about 16 vs 94 neurons, confidence 1.0, the missing word | `prep/READER-TEST.md` |
| 55 tests | `npm test`, Oct 29, 2026 |
| 10 of 12 test letters give a relative deadline | `test-letters/ANSWER-KEY.md` |
| Which rules win in which order | `src/shared/rules.ts` |
| What each result includes | `src/client/Result.tsx` |
| What's saved and logged | `src/worker.ts`, `saveLang` in `src/client/i18n.ts` |
| Second reader scored on deadline and phone only | `scripts/measure.mjs` |
| Held-out results: 6/6 and 6/6, fields, second-reader counts, the L13 and L18 details | `public/accuracy.json`, `test-letters/runs/2026-10-29-*.json` |
| WCAG 2.1 AA, 7 issues | `prep/ACCESSIBILITY.md` |
| Rules and their sources | `prep/ROUTING.md`, `src/shared/rules.ts` |
| 1,600 px, 15-second timeout, about 6 reads a minute | `src/client/image.ts`, `src/read.ts`, `wrangler.jsonc` |
| AI tools allowed | [Devpost rules](https://dsh-hacks-v2.devpost.com/rules): "We allow the use of AI in your submission." |
| Judged on idea, implementation, design and presentation | [dshhacks.org](https://www.dshhacks.org/) |
