# AppealPath demo video script

The video is made by `node scripts/demo/record.mjs`. It records the live app in a phone frame, with captions and a computer voice, and writes `demo/AppealPath-demo.mp4` and the same video with no sound, `demo/AppealPath-demo-silent.mp4`. The `demo/` folder isn't in git. The lines are in `scripts/demo/narration.json`; change them there and re-run the script to move the captions too.

**Your voice is better than the computer's.** Open `demo/AppealPath-demo-silent.mp4` in iMovie or QuickTime and record over it, scene by scene. Each scene's line is on screen, so read it or say it in your own words. Keep each scene about as long as its line.

**Optional, and worth it:** film 10–15 seconds of yourself at the start saying why you built it (only what's true for you), and a few seconds of your phone taking a photo of a printed letter. Send me the clips and I'll cut them into the start.

**Length:** 3:12 for this take. DSH hasn't published a limit (still asked on Discord). An old update said 3–5 minutes; if that's confirmed, your on-camera intro and a slower read get it there.
**Rule:** every letter on screen is fictional, and the video says so.

Only one of the three "2 ·" lines plays, depending on what the live read found, and "The mistake that matters" plays only when the live read didn't already show a fax mistake: **2 · Check it against the photo** played in this take.

| Starts at | Scene | Line |
|---|---|---|
| 0:00 | AppealPath | In 2024, insurers on HealthCare.gov denied nearly one in five in-network claims, and fewer than one in a hundred of those denials were appealed. But a denial doesn't always need an appeal. Sometimes the doctor's office just fixes the paperwork. Sometimes you need an urgent review today. AppealPath reads the letter, checks its own work, and points to the right first step. Every letter in this video is fictional. |
| 0:26 | 1 · Your letter | Here's a simulated phone photo of a fictional denial letter. I add the photo and answer five quick questions: a Marketplace plan, the care already happened, and I live in Missouri. |
| 0:40 | 2 · Check what we read | The AI reads the letter live and copies what's printed: what was denied, why, the deadline, and who to call. Then a second reader, running on the phone, checks the deadline, the reason and the phone number against the photo. |
| not in this take | 2 · Fix what's wrong | And it caught a real mistake: the AI picked the fax number as the phone number. In testing, the AI even said it was one hundred percent sure of a sentence it had copied wrong, so AppealPath never trusts its confidence. I check the number against the letter and fix it before going on. |
| not in this take | 2 · Fix what's missing | On this photo the AI couldn't find the deadline, and it won't make one up. So I type it exactly as it's printed on the letter, and AppealPath uses my words. |
| 0:53 | 2 · Check it against the photo | Show me opens the whole letter with those words highlighted, so checking takes a second. AppealPath never trusts the AI's own confidence: in testing, it said it was one hundred percent sure of a sentence it had copied wrong. |
| 1:07 | 3 · Appeal | The cardiology visit was denied as out of network, so the next step is an appeal. The deadline is quoted from the letter, never calculated. The app shows why: each rule, in order, up to the one that fit. And there's an appeal letter filled in from the letter's own words. |
| 1:23 | The mistake that matters | In testing, the AI's most dangerous mistake was picking the fax number as the number to call. This built-in sample is a real reading where it did that. The second reader warns about the number, and if I tap on anyway, the app stops and asks me to compare it with the letter first. |
| 1:40 | Sample letters | The other samples, also read ahead of time, show the other next steps. This MRI was denied because the office never sent the prior authorization. That's paperwork, so the next step is fix and resubmit, with a script for the call. |
| 1:54 | Care still ahead | This rehab stay was denied as not medically necessary, a reason that usually leads to an appeal. But the care is still ahead and the doctor says waiting could cause harm, so the rules move it to an urgent review today. |
| 2:07 | No guessing | Medicare and Medicaid have their own appeal rules, so AppealPath says so the moment you pick one, and doesn't read the letter. A letter with no clear reason gets: call and ask, instead of a guess. |
| 2:20 | How it decides | Fixed rules pick the next step, each with a source or labeled a design choice. On eighteen fictional test letters, including six written after the reader was frozen, it chose the right step on every image, and the second reader flagged every fax-number mistake. These are fictional letters and simulated photos, so that's a best case. |
| 2:39 | En español | It also works in Spanish, and the letter's own words aren't translated, so you can check them against the paper. |
| 2:46 | AppealPath | AppealPath is a prototype, not medical or legal advice, and it doesn't save your photo or answers. It helps people find the right first step after a denial, before the deadline passes. |

## Questions judges might ask (have one-line answers ready)

- **"Your 100% is a homemade benchmark."** True, and the write-up says so: every route matched the answer key on 38 images of 18 fictional letters I wrote, and some readings still had wrong values, like the fax numbers. That's why the check screen exists. Real photos and real users are the next test.
- **"Five rules is just a form."** The rules are simple on purpose, so anyone can check them. The hard part is reading a letter you've never seen, checking the AI's work against the photo, and making sure the person sees what wasn't confirmed. A no-AI baseline got the next step right on 33 of 38 images, the AI on 38 of 38.
- **"You leave out Medicare and Medicaid."** Yes, on purpose: they run their own appeal systems, and a wrong answer there is worse than none. They get "call your plan" right away, plus how to ask for a fast appeal if waiting could harm them.
- **"Could a letter trick the AI?"** I tested it: a planted instruction asking for a different reason and a 1-900 number, readable and in faint tiny print, on three letters. Results are in EVALUATION.md. Either way, a 900 number never becomes a tap-to-call link, and anything the photo didn't confirm is flagged on the result.

- **"What does the AI actually do?"** It reads the letter into fields, copying the text, and suggests the kind of reason; the user can change any of it, and fixed rules pick the next step.
- **"What if it reads the deadline wrong?"** A second reader on the device looks for the same words on the photo, and every uploaded letter goes through the check screen before a result. It never calculates a deadline.
- **"How do you know the rules are right?"** Each rule links to Healthcare.gov or the Arkansas Insurance Department; the ones that are my own design decisions are labeled that way.
- **"Why not Medicare and Medicaid?"** Different appeal systems. v1 sends those to the number on the letter and free counseling instead of guessing.
- **"Privacy?"** The photo is read and thrown away. Photos and answers aren't saved; the server logs only cost and timing, and the browser remembers the language choice.
- **"Did you use real letters?"** No. 18 fictional letters, watermarked as samples, with an answer key, plus simulated phone photos of them. Six were written after the reader was frozen, as a held-out test.
- **"Is the AI even needed?"** It does the part rules can't: finding the right sentence and the right phone number on a letter it has never seen, among fax, nurse and member-services numbers. The rules do the part the AI shouldn't: deciding.
- **"Why should I trust the samples?"** Their readings are real model output saved ahead of time, so they work even when the free AI allowance runs out. **Read it live with the AI** sends any sample through the real reader.
- **"Why Spanish?"** A confusing insurance letter is even harder in a second language. The letter quotes stay in English because that's what's printed, and the appeal letter stays in English because the plan reads it. (If you cite a number for Spanish speakers in your area, take it from Census data and say so; it isn't checked here.)
