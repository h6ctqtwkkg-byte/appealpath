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
| 1:18–1:35 | **Letter L10:** the "Check what we read" screen showing "We didn't find a deadline on your letter" | "Here's the part I care most about. Before any next step, it makes me check the deadline and the reason, because in my testing the AI said it was 100% sure about a sentence it had copied wrong. And when a letter has no deadline, like this one, it says so instead of making one up. A wrong deadline is worse than no deadline." |
| 1:35–1:52 | The "How it decides" page: rules table, then the accuracy table | "The AI only reads the letter. Fixed rules, with a source for each one, pick the next step. I tested it on 12 fake letters and two hard photos. Here's what it got right, and what it sent back to me to check." *(Say the real numbers.)* |
| 1:52–2:00 | The form again, with the prototype banner in view | "AppealPath is a prototype, not medical or legal advice, and it doesn't save your photo. It's built to get people from a confusing letter to the right phone call." |

## Before recording

- [ ] All three demo letters give the right result on the live URL (not just locally).
- [ ] The free AI quota isn't used up today; if it is, use the sample-letter buttons and say "sample, read ahead of time".
- [ ] Phone on Do Not Disturb; notifications off.
- [ ] Screen recording shows taps.
- [ ] Say the accuracy numbers you actually measured on Nov 7, including misses. Don't round up.

## Questions judges might ask (have one-line answers ready)

- **"What does the AI actually do?"** It reads the letter into fields and copies text word for word; fixed rules pick the next step.
- **"What if it reads the deadline wrong?"** Anything it isn't sure of, or can't find word for word, goes to the user to check. It never calculates a deadline.
- **"How do you know the rules are right?"** Each rule links to Healthcare.gov or the Arkansas Insurance Department; the ones that are my own design decisions are labeled that way.
- **"Why not Medicare and Medicaid?"** Different appeal systems. v1 sends those to the number on the letter and free counseling instead of guessing.
- **"Privacy?"** The photo is read and thrown away; nothing is stored.
- **"Did you use real letters?"** No. 12 fictional letters I wrote, watermarked as samples.
