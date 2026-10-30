# How well AppealPath reads a denial letter: evaluation

Everything measured so far, how it was measured, and what it doesn't show. Every letter is fictional, written for this project; no real patient data was used. Last updated Oct 29, 2026.

## 1. The question

AppealPath's AI copies facts from a photo of a denial letter, and fixed rules turn those facts plus five answers into one next step. So the questions are:

1. **Does it pick the right next step?** (fix and resubmit, appeal, urgent review today, or call your plan)
2. **Does it copy the facts a person acts on correctly?** The service denied, the kind of reason, the deadline and the phone number to call.
3. **When the AI is wrong, does anything notice?** The model's own confidence score, and the second reader (Tesseract OCR running in the browser).

## 2. What was tested

| Part | Version |
|---|---|
| Reader | Gemma 4 26B (`@cf/google/gemma-4-26b-a4b-it`) on Cloudflare Workers AI, with the instructions and JSON schema in `src/read.ts` as of commit `79021a8` |
| Second reader | Tesseract.js 7 (English, LSTM), with the matching in `src/shared/match.ts` as of commit `9245184` |
| Rules | `decide()` in `src/shared/rules.ts`, five rules checked in order |

## 3. Test set

**18 fictional letters** (`test-letters/letters.html`), with an answer key for each (`test-letters/answer-key.json`, readable in `test-letters/ANSWER-KEY.md`):

- **L01–L12, the development set.** Written first. The reading instructions were adjusted after early runs on them, so their numbers are a best case.
- **L13–L18, the held-out set.** Written after `src/read.ts` and `src/shared/match.ts` last changed, and never used to change either. They add six new insurers and layouts and new traps:
  - 1-800 numbers and area codes other than 479
  - a fax number in its own table row
  - a separate 24-hour urgent line
  - a nurse line and a language-help line, which are the wrong numbers to pick
  - the first "experimental" denial
  - a statement where one of two lines was denied
- **Built-in traps across the set:** phone and fax numbers printed side by side, a letter with no deadline (L10), a Medicare letter (L09), a letter with no clear reason (L12), and statements where only one line was denied (L11, L17).

Each letter was tested in two image conditions:

- **Clean:** a 1224×1584 render of the printed page (`scripts/render-letters.sh`).
- **Simulated phone photo:** the same page tilted 5–8°, turned 1.5–3.5°, blurred 0.5–0.8 px, shadowed, on a dark table and saved as a heavily compressed JPEG (`scripts/phone-like.sh`). Two extra images are harder: L02-blurry (1.8 px blur) and L08-angled (18° tilt).

These are not real phone photos. That test is planned (section 8).

## 4. Method

`scripts/measure.mjs` sends each image once through the running app (`/api/read`), runs the rules with that letter's five answers from the answer key, and runs the second reader on the same image. Each field is scored against the answer key:

- **Right / left empty / wrong:**
  - The service counts as right if the expected words appear.
  - The deadline must match the printed sentence after spacing and punctuation are normalized. A longer quote counts as wrong even if it contains the right sentence.
  - The phone must match every digit; a leading 1 is ignored.
  - **"Kind of reason" scores the category** (for example, out of network), which decides the next step. It doesn't score the reason quote.
- **Right next step:** the rules' result with no fixes from the user, compared with the expected result.
- **Second reader:** for the deadline and the phone, *confirmed* means a right value it found on the image; *flagged* means a wrong value it warned about.
- **Not scored yet:** the reason quote, the urgent-appeals phone, the second reader's check of the reason, and the rest of the appeal-letter details.

The held-out letters are saved as their own run, and every reading from those runs is kept in `test-letters/runs/`. The development runs before that saved only totals.

## 5. Results

| Images | Right next step | Service | Kind of reason | Deadline | Phone | Second reader: confirmed | Second reader: flagged |
|---|---|---|---|---|---|---|---|
| Development, clean (12) | **12 / 12** | 12 / 12 | 11 / 11 | 12 / 12 | 10 / 12 | 21 of 21 right values | 2 of 2 wrong values |
| Development, simulated phone (14) | **14 / 14** | 13 / 14 (1 left empty) | 12 / 13 | 13 / 14 (1 left empty) | 12 / 14 | 22 of 24 | 2 of 2 |
| Held-out, clean (6) | **6 / 6** | 6 / 6 | 6 / 6 | 5 / 6 | 6 / 6 | 10 of 11 | 0 of 1 |
| Held-out, simulated phone (6) | **6 / 6** | 6 / 6 | 6 / 6 | 6 / 6 | 6 / 6 | 10 of 12 | none to flag |

The kind of reason isn't scored on L09, the Medicare letter, because rule 1 answers before the reason matters. Source: `public/accuracy.json`, also shown on the app's "How it decides" page.

## 6. Every miss

| Image | What happened | Did anything catch it? | Effect on the next step |
|---|---|---|---|
| L04 clean, L04 phone, L07 clean, L02-blurry | Picked the fax number as the number to call | The second reader flagged all four | None, but the user would have called a fax line |
| L11 phone | Read "out of network" as "not covered" | No: the second reader checks words, not categories | None: both lead to Appeal |
| L13 clean (held out) | Copied the deadline sentence plus the two sentences before it | No: every copied word is on the page | None: the right deadline was inside the quote |
| Development phone images | Left the service empty once and the deadline empty once, for the user to fill in | Shown as missing on the check screen | None |

**False alarms** (the second reader warned about a right value): 2 on the development phone images, and 3 on the held-out images: L18's phone number on both images, and the L14 deadline on the phone image. The L18 ones happen because its phone number wraps onto a second line, which the matcher doesn't join yet. The fax number on sample L04 wraps the same way, so the second reader says it "couldn't find" that number instead of calling it a fax. It still warns. This stays unfixed until after the real-photo test, so the numbers above keep describing the code that's running.

## 7. Two smaller findings

**The model's confidence is no safety check.** In a first test on 4 development letters (`prep/READER-TEST.md`), Gemma 4 and Llama 4 Scout each rated their confidence in every field. Both said 1.0 on every field they filled, including a sentence Gemma had copied with a word missing ("a home apnea test" for "a home sleep apnea test"). AppealPath never uses the model's confidence. Every upload goes to a check screen, and the second reader checks the words.

**Which model.** On those 4 letters, Gemma picked the right next step 4 times out of 4 at about 16 neurons per read. Scout got 3 of 4 at about 94, reading a billing error as "not medically necessary", which would have sent someone to Appeal instead of Fix. This was one read per letter in a throwaway script that isn't in the repo, so treat it as a pilot, not a result.

**Reads vary from run to run.** Each image above was read once. On L04, both measured runs and the reading saved for the sample picked the fax number; one later live read picked the right number. A second run of the whole set would show how much the totals move.

## 8. Limits

- **Small and synthetic.** 18 letters, all written by the same person who wrote the reading instructions. Real denial letters are longer, messier and more varied.
- **Simulated photos.** No real phone photo has been measured yet.
- **One read per image**, so no error bars.
- **Development numbers are a best case**, because the instructions were tuned on those letters. The held-out set is the fairer number, but it's only 6 letters.
- **Routing is only as good as the rules.** The rules cite Healthcare.gov, the Arkansas Insurance Department and the U.S. Department of Labor, or are labeled design choices (`prep/ROUTING.md`). No lawyer or patient advocate has reviewed them.

**Planned next, before the matcher changes:** print all 18 letters, take 20 real phone photos (steps in `test-letters/ANSWER-KEY.md`), run them once with `node scripts/measure.mjs photos "phone photos"`, and publish every result, misses included.

## 9. Reproduce it

```bash
npm install
npm run dev                                   # the app on :8792, using your Cloudflare account's Workers AI
bash scripts/render-letters.sh                # clean renders → test-letters/renders/
bash scripts/phone-like.sh                    # simulated phone photos → test-letters/phone-like/
node scripts/measure.mjs test-letters/renders "clean digital images of the printed pages, not phone photos"
node scripts/measure.mjs test-letters/phone-like "simulated phone-like images: tilted, slightly blurred, shadowed and heavily compressed"
npm test                                      # includes the rules run on all 18 answer keys
```

A full run of the 38 images uses about 550 neurons of the free 10,000 a day. Results can differ a little from the tables, because reads vary.
