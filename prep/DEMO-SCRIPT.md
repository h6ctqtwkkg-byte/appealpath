# AppealPath demo video script

**Length:** about 2:00. DSH hasn't published a limit (still asked on Discord); if they set one shorter, cut the "How it decides" section first.
**Recording:** phone screen recording (or Chrome's phone view at phone width), plus your voice. Show your hands holding the printed letter for the first shot only.
**Rule:** every letter on screen is one of the fictional samples, and you say so out loud.

| Time | On screen | You say |
|---|---|---|
| 0:00–0:12 | The printed L01 letter in your hand, then the AppealPath form | "When insurance denies care, you get a letter like this: codes, policy numbers, and a deadline buried at the bottom. Most people don't know if they should call their doctor, file an appeal, or panic. AppealPath tells you the next step. All the letters here are fake ones I wrote; no real patient data." |
| 0:12–0:35 | **Letter A (L01):** snap the photo, answer the 5 questions (job plan; not yet; no; no; Arkansas), tap Read my letter → **Fix & resubmit** | "This MRI was denied because the doctor's office never sent the prior authorization. That's not a no on the care; it's missing paperwork. So the next step is to ask the office to send it, and here's exactly what to say on the phone." |
| 0:35–0:58 | **Letter B (L02):** sample-letter button → **Appeal**, with the deadline box and the appeal letter preview | "Physical therapy, denied as not medically necessary. That's an appeal. The deadline, April 19th, is copied word for word from the letter. AppealPath never calculates a deadline on its own. And here's an appeal letter you can print and sign." |
| 0:58–1:18 | **Letter C (L03):** inpatient rehab after a stroke; answers include "my doctor says waiting could seriously harm" → **Urgent review today** | "A rehab stay after a stroke. The care hasn't happened, and the doctor says waiting could cause harm. That changes everything: you can ask for an expedited appeal today, and Healthcare.gov says you can request an outside review at the same time." |
| 1:18–1:38 | **Back on letter B's check screen:** the ✓ "Matches your photo" lines, then tap **Show me** so the deadline lights up on the photo | "Here's the part I care most about. In my testing, the AI said it was 100% sure about a sentence it had copied wrong. So a second reader runs right on your phone, finds the AI's exact words on the photo, and shows you where they're printed. When it can't find them, or the AI grabbed a fax number instead of a phone number, it tells you." |
| 1:38–1:52 | The How it decides page: rules table, then the two accuracy tables | "Fixed rules, with a source for each, pick the next step, not the AI. On 12 clean and 14 phone-like test letters it got every next step right, and the second reader caught every wrong phone number. These are fake letters, so it's a best case, and that's why you always check." |
| 1:52–2:00 | The form again, with the prototype banner in view | "AppealPath is a prototype, not medical or legal advice, and it doesn't save your photo. It's built to get people from a confusing letter to the right phone call." |

## Before recording

- [ ] All three demo letters give the right result on the live URL (not just locally).
- [ ] The free AI quota isn't used up today; if it is, use the sample-letter buttons and say "sample, read ahead of time".
- [ ] Phone on Do Not Disturb; notifications off.
- [ ] Screen recording shows taps.
- [ ] Say the accuracy numbers you actually measured, including misses. Don't round up. If you measured real phone photos, use those.

## Questions judges might ask (have one-line answers ready)

- **"What does the AI actually do?"** It reads the letter into fields and copies text word for word; fixed rules pick the next step.
- **"What if it reads the deadline wrong?"** A second reader on the device has to find the same words on the photo, and the user always checks the deadline before seeing a result. It never calculates a deadline.
- **"How do you know the rules are right?"** Each rule links to Healthcare.gov or the Arkansas Insurance Department; the ones that are my own design decisions are labeled that way.
- **"Why not Medicare and Medicaid?"** Different appeal systems. v1 sends those to the number on the letter and free counseling instead of guessing.
- **"Privacy?"** The photo is read and thrown away; nothing is stored.
- **"Did you use real letters?"** No. 12 fictional letters, watermarked as samples, plus simulated phone photos of them.
- **"Why Spanish?"** A confusing insurance letter is even harder in a second language. The letter quotes stay in English because that's what's printed, and the appeal letter stays in English because the plan reads it. (If you cite a number for Spanish speakers in your area, take it from Census data and say so; it isn't checked here.)
