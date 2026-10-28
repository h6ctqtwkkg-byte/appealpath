# AppealPath

A photo of a health insurance denial letter in, one next step out: **Fix & resubmit**, **Appeal**, or **Urgent review today**. Medicare, Medicaid and unclear letters get "call the number on your letter". Prototype, not medical or legal advice. Built for DSH Hacks V2 (AI × Healthcare); submissions close **Nov 14, 2026, 11:45 PM PST**.

**How it works:** the browser shrinks the photo. One Cloudflare Worker sends it to Workers AI (Gemma 4, with Llama 4 Scout as backup), which copies what's printed. The user checks the deadline and the reason, and fixed rules (`src/shared/rules.ts`) pick the next step. Nothing is stored.

## Run it

| Task | Command |
|---|---|
| Local dev (builds the app, then `wrangler dev` on :8792) | `npm run dev` |
| Rebuild the app on change | `npm run dev:watch` |
| Typecheck (Worker + app) | `npm run typecheck` |
| Tests (rules on all 12 answer-key letters, reader output checks) | `npm test` |
| Re-capture the 3 sample readings (dev server running; about 45 neurons) | `node scripts/capture-samples.mjs` |
| Deploy to workers.dev (typecheck, tests, build, then `wrangler deploy`) | `npm run deploy` |
| Measure accuracy on a folder of images (dev server running; about 14 neurons each) | `node scripts/measure.mjs photos "phone photos"` |

Local dev uses real Workers AI on your account, so reads count against the free 10,000 neurons a day, which SnapList shares.

## What's here

| Path | What it is |
|---|---|
| `src/shared/rules.ts` | The 5 routing rules, in order (source for each in `prep/ROUTING.md`) |
| `src/read.ts` | The letter reader: schema, instructions, Gemma then Scout, strict output check |
| `src/worker.ts` | `POST /api/read`; everything else is static files in `public/` |
| `src/client/` | The Preact app: form, check screen, results, How it decides |
| `public/samples/` | The 3 demo letters and their readings, captured ahead of time from the real model |
| `public/accuracy.json` | Written by `scripts/measure.mjs`; shown on the How it decides page |
| `test-letters/` | 12 fictional letters (PDF), the answer key (Markdown + JSON), and renders (git-ignored) |
| `prep/` | Routing sources, screen wording, demo script, one-pager draft, reader test |

## Status (Oct 28, 2026)

- **Built and working locally:** all three screens, all five results, the printable appeal letter, typed entry, sample letters, How it decides, the error messages, phone widths down to 320px, and light and dark mode.
- **Measured:** the right next step on **12 of 12** letters with no fixes (clean digital images, not phone photos). Known miss: on 2 letters it picked the fax number as the phone. The reader instructions were tuned on these same letters, so treat this as a best case.
- **Live (deployed Oct 28):** https://appealpath.7zhvt4rjzh.workers.dev (`npm run deploy`). Reads are limited to about 6 a minute per visitor so a public link can't drain the shared free neurons.
- **Not done:** pushing to GitHub (the local git repo has its first commit), phone-photo measurement, the demo video, the one-page PDF.

## Still to do (Noah)

- [ ] Post the DSH questions on Discord (video limit, zip requirement, the stale Nov 8 date, prize delivery for minors).
- [ ] Print `test-letters/letters.pdf`, take the 14 photos into `photos/`, then run `node scripts/measure.mjs photos "phone photos"`.
- [ ] Check whether 1-800-852-5494 is a voice line or TTY (the app only shows the 501 number).
- [ ] Try the live link on your phone, then set up a public GitHub repo (DSH needs a repo or a code PDF).
- [ ] Record the demo (`prep/DEMO-SCRIPT.md`) and fill in the one-pager numbers (`prep/ONE-PAGER.md`).

## Rules for this project

- Synthetic letters only; no real patient data. Every page says "Prototype. Not medical or legal advice."
- The AI reads; fixed rules decide; the user checks the deadline and reason before any result. The deadline is never calculated.
- Free tools only. No secrets in code or config.
