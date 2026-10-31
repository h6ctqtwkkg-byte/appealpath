# AppealPath: notes for Claude Code

AppealPath is Noah's solo entry in DSH Hacks V2 (AI × Healthcare, problem statement B "Faster care"). A photo of a health-insurance denial letter goes in, the AI (Gemma 4 on Workers AI) copies the facts, a second reader (Tesseract in the browser) checks them against the photo, the user confirms, and five fixed rules (`src/shared/rules.ts`) pick one next step. One Cloudflare Worker on the free plan, with a static Preact app. It shares a Cloudflare account, and so the free 10,000 Workers AI neurons a day, with SnapList. Status and results: `README.md`, `EVALUATION.md`. Write-up: `prep/DEVPOST.md`.

## Rules

- It's a prototype, never medical or legal advice. Results route people (who to contact, by when). They never diagnose or predict an outcome.
- Fictional letters only. No real patient data, ever, including in tests and photos.
- Never fabricate results, testimonials or claims. Every number in the write-up has a source in its sources table, and anything unverified says so.
- Held-out letters L13–L18 must never be used to tune `src/read.ts` or `src/shared/match.ts`. If either changes, say so wherever the held-out numbers appear.
- Say the second reader *warns* about a value. Never say it "catches" one, and never say "the AI didn't choose": the kind of reason the user confirms feeds the rules.
- Never put secrets in the repo, `wrangler.jsonc`, client code or logs.
- Deploy with `npm run deploy` (typecheck, tests, build, then `wrangler deploy`).
- Ask before system-level installs, and before anything outward-facing that wasn't asked for.

## Commands

| Task | Command |
|---|---|
| Local dev on :8792 (real Workers AI, so reads spend the shared allowance) | `npm run dev` |
| Typecheck and tests | `npm run check` |
| Deploy | `npm run deploy` |
| Measure a folder of images (dev server running) | `node scripts/measure.mjs <folder> "<label>"` |
| Repeat a run without touching the published numbers | `REPEAT=n node scripts/measure.mjs …` |
| No-AI baseline, injection test, repeat summary | `node scripts/baseline.mjs` · `node scripts/injection.mjs` · `node scripts/repeats-summary.mjs` |
| Gallery slides, demo video | `node scripts/gallery.mjs` · `node scripts/demo/record.mjs` |
