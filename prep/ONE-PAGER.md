# AppealPath: one-page description (draft)

*Turn this into the one-page PDF on Sun Nov 8. Replace every `[[…]]` with measured numbers; delete any line you can't back up.*

---

**AppealPath: from a confusing insurance denial to the right next step**
Prototype. Not medical or legal advice. DSH Hacks V2, AI × Healthcare. Noah [last name], solo.

**The problem.** When a health plan denies care, the letter is full of codes, policy names and fine print. People don't know whether to call their doctor's office, file an appeal, or ask for an urgent review, and deadlines pass while the care waits. A denial is a barrier to care the doctor already ordered.

**Who it's for.** Patients and caregivers on job-based or Marketplace plans who just got a denial letter.

**How it works.**
1. Take a photo of the letter and answer 5 questions (plan type, whether the care has happened, whether your doctor says waiting could seriously harm you, whether the office already resubmitted, and your state).
2. An AI vision model (Gemma 4 on Cloudflare Workers AI) reads the letter into fields: what was denied, why, the deadline, and who to call. It copies text word for word.
3. Before any next step, the user checks the two fields that matter most, the deadline and the reason, shown next to what the letter says. In testing, the model rated itself 100% sure on every field, including a quote it got wrong, so its self-reported confidence isn't used as a safety check. The app never calculates a deadline.
4. Fixed rules, each linked to Healthcare.gov or the Arkansas Insurance Department, pick one of three next steps: **Fix & resubmit**, **Appeal**, or **Urgent review today**. Medicare, Medicaid and unclear reasons get "call the number on your letter" instead of a guess.
5. The result gives a phone script or a printable appeal letter, filled from a fixed template.

**What makes it different.** The AI's job is reading, not deciding. Every next step can be traced to a rule and a source, and the app asks the user rather than guessing.

**How well it works.** Tested on 12 fictional letters (3 layouts) plus 2 hard photos:
- Fields read correctly: [[x]] / [[y]]
- Fields sent to the user to check instead of guessed: [[x]]
- Correct next step after checking: [[x]] / 14
- Known misses: [[list them]]

These letters are cleaner than real mail, so real-world accuracy will be lower.

**What it won't do.** Contact insurers, file anything, predict whether an appeal will win, diagnose, give legal advice, or store photos or answers.

**Built with.** Cloudflare Workers (free plan), Workers AI (Gemma 4, with Llama 4 Scout as backup), [[front-end choice]]. Routing sources: Healthcare.gov internal appeals and external review pages, Arkansas Insurance Department, U.S. Department of Labor (EBSA). AI coding tools were used during the build, as DSH allows.

**Data.** No real patient data. All test letters are fictional, made-up insurers and people, watermarked as samples.

**Try it:** [[workers.dev URL]] · **Code:** [[GitHub URL]] · **Demo video:** [[link]]
