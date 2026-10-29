# Devpost write-up (draft)

Paste each section below into the matching box on the Devpost submission form. Drafted Oct 29, 2026. Every number comes from the sources table at the bottom.

**Before you paste**
- Fill the two `[[ ]]` spots: the video link, and one sentence on what you did yourself.
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

Photo of a health insurance denial letter in, one next step out: fix and resubmit, appeal, or urgent review today. The AI copies the letter; fixed rules decide.

## About the project

### Inspiration

When a health plan denies care, almost nobody fights it. In 2024, insurers on HealthCare.gov denied 19% of in-network claims, and consumers appealed fewer than 1% of those denials ([KFF, March 2026](https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/)). The letters are full of codes, policy names and fine print. They don't tell you whether to call your doctor's office, file an appeal, or ask for an urgent review, and the deadline is easy to miss. Meanwhile the care your doctor ordered just waits.

That's an access problem, not a diagnosis problem. So AppealPath doesn't diagnose anything: it gets people from a confusing letter to the right phone call.

### What it does

1. Take a photo of the denial letter and answer 5 questions: what kind of plan you have, whether the care has happened yet, whether your doctor says waiting could seriously harm you, whether the office has resubmitted, and your state.
2. An AI vision model copies the key facts word for word: what was denied, why, the deadline, and who to call.
3. A second reader, running on your own phone, looks for those exact words on the photo. It highlights where each one is printed and flags anything it can't find, including a fax number picked as the phone number.
4. You check the deadline and the reason. Then five fixed rules, each with a source or marked as a design choice, pick one next step:
   - **Fix & resubmit** for paperwork problems: a missing prior authorization, missing records, a billing error.
   - **Appeal** for "not medically necessary", "not covered" or "out of network".
   - **Urgent review today** when the care is still ahead and your doctor says waiting could cause serious harm.
   - Medicare, Medicaid, "not sure", and letters with no clear reason get **"call the number on your letter"** instead of a guess.

Each result comes with a call script, a printable appeal letter filled in with the letter's own words, a plain-language note on what the denial reason means, free help (Arkansas contacts for now, plus the U.S. Department of Labor for job-based plans), and a calendar reminder when the letter prints a date. The app works in English and Spanish, and the letter's own words always stay exactly as printed.

It won't contact your insurer, file anything, predict whether an appeal will win, diagnose, give legal advice, or store your photo or answers. **It's a prototype, not medical or legal advice, and every letter in it is fictional.**

Try all five outcomes without uploading anything, one fictional letter per rule: [Fix & resubmit](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L01&result) · [Appeal](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L02&result) · [Urgent review](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L03&result) · [Medicare: call your plan](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L09&result) · [No clear reason](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L12&result) · [The check screen with the second reader](https://appealpath.7zhvt4rjzh.workers.dev/?sample=L02)

### How I built it

- **One Cloudflare Worker on the free plan.** The browser shrinks the photo (longest side 1,600 px) and sends it to the Worker, which passes it to Workers AI and returns what was read. There are no accounts and no database, and nothing is stored. Reads are limited to about 6 a minute per visitor, and no paid API keys are used.
- **The reader** is Gemma 4 (26B) on Workers AI, held to a strict JSON schema, so every answer has the same fields or is rejected. If Gemma fails or stalls past 15 seconds, Llama 4 Scout takes over. The instructions say to copy only what's printed: an unknown field stays empty, a fax number is never the phone number, and the reason is never guessed from the service.
- **The second reader** is Tesseract.js, running in the browser and served by the app itself. OCR on a phone photo misreads letters and splits words, so it matches the AI's quotes word by word with some tolerance instead of exactly. For phone numbers, it rebuilds numbers split across words and checks whether the word "fax" is printed just before.
- **The rules** are one small function (`src/shared/rules.ts`), checked in order, first match wins. Each rule cites Healthcare.gov, the Arkansas Insurance Department or the U.S. Department of Labor, or is labeled as a design choice (`prep/ROUTING.md`).
- **The app** is Preact and TypeScript, bundled with esbuild. All of its wording lives in one file, in English and Spanish.
- **Checks:** 43 automated tests, including the rules run on all 12 test letters, the reader's output check, the second reader's matching and the date reading. The app was also checked against WCAG 2.1 AA, and 7 issues were found and fixed: contrast in light and dark mode, focus visibility, tap targets, focus moving to each new screen, and language tags for Spanish.

I used Claude Code, an AI coding assistant, for most of the code, which DSH's rules allow. [[One true sentence on what you did yourself: the decisions you made, what you tested, what you changed.]]

### How I tested it

The question behind the whole design: **can you trust what the AI read, and how do you know when you can't?** All tests used fictional letters written for this project, with an answer key (12 letters in `test-letters/`).

**1. Can the model's own confidence work as a safety check? No.** Gemma 4 and Llama 4 Scout each read 4 letters and rated their confidence in every field. Both said 1.0 on every field they filled, including a sentence Gemma had copied with a word missing ("a home apnea test" instead of "a home sleep apnea test"). So AppealPath never uses the model's confidence. The user always checks the deadline and the reason, and a second reader checks the words.

**2. Which model?** On those 4 letters, Gemma picked the right next step 4 times out of 4, at about 16 neurons per read. Scout got 3 of 4, at about 94 neurons. It read a billing error as "not medically necessary", which would have sent someone to Appeal instead of Fix. Gemma is the reader; Scout is only the backup.

**3. Does a second, independent reader catch the AI's mistakes?** The full reader and the second reader ran on the 12 letters as clean digital images, and on 14 simulated phone photos (tilted, blurred, shadowed and heavily compressed; two letters also have a blurrier or more angled version). Each result was scored against the answer key with `scripts/measure.mjs`.

| Images | Right next step | Second reader |
|---|---|---|
| 12 clean digital images | 12 / 12 | Confirmed 21 of 21 correct values; flagged 2 of 2 wrong ones |
| 14 simulated phone photos | 14 / 14 | Confirmed 22 of 24 correct values; flagged 2 of 2 wrong ones |

The AI's wrong values were all the same mistake, a fax number picked as the phone number, and the second reader flagged every one. On the phone photos it also missed 2 values that were actually right: false alarms, which the user clears by looking at the highlight. On one phone photo, the reason was read as "not covered" instead of "out of network". Both lead to Appeal, so the next step was still right.

**Limits, plainly:** it's a small sample of fictional letters. The reading instructions were tuned on these same letters, so these are best-case numbers. The phone photos are simulated, and real phone photos haven't been measured yet. That's why the check screen is always shown, however sure the AI is.

### Challenges I ran into

- **The AI was confidently wrong.** A 1.0 confidence score on a wrong quote meant the obvious safety check ("ask the user when the AI is unsure") would never fire. The fix was structural: a second reader that checks the first, and a person who checks both.
- **Fax numbers.** Denial letters print the phone and fax numbers close together, and the model sometimes picked the fax. The instructions now forbid it, and the second reader looks at the label printed next to the number.
- **Never calculating a deadline.** A letter often gives its deadline as "within 180 days of the date of this notice" instead of a date (7 of the 12 test letters do). Working out the date yourself is exactly the kind of mistake that can cost someone their appeal, so AppealPath quotes the words and only offers a calendar reminder when a real date is printed.
- **Messy OCR on phone photos.** Tesseract misreads letters and splits words, so the matching has to forgive small OCR mistakes without accepting a different sentence.
- **A slow model.** Gemma stalled for 30 seconds during testing. Now it gets 15 seconds before Scout takes over.

### Accomplishments that I'm proud of

- The right next step on every test image: 12 of 12 clean images and 14 of 14 simulated phone photos, with every wrong phone number flagged.
- An AI that reads but never decides. Every result traces to a written rule, and every rule has a source or is marked as a design choice.
- It costs nothing to run: no paid API keys, no accounts, nothing stored.
- It works in English and Spanish, and a WCAG 2.1 AA check found 7 issues, all fixed.
- Judges can see all five outcomes in one click, without uploading anything.

### What I learned

- An AI's confidence score isn't a safety signal. You have to check its work some other way.
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
| 43 tests | `npm test`, Oct 29, 2026 |
| 7 of 12 test letters give a relative deadline | `test-letters/ANSWER-KEY.md` |
| WCAG 2.1 AA, 7 issues | `prep/ACCESSIBILITY.md` |
| Rules and their sources | `prep/ROUTING.md`, `src/shared/rules.ts` |
| 1,600 px, 15-second timeout, about 6 reads a minute | `src/client/image.ts`, `src/read.ts`, `wrangler.jsonc` |
| AI tools allowed | [Devpost rules](https://dsh-hacks-v2.devpost.com/rules): "We allow the use of AI in your submission." |
| Judged on idea, implementation, design and presentation | [dshhacks.org](https://www.dshhacks.org/) |
