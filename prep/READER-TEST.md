# Reader test: Gemma 4 vs Llama 4 Scout (Oct 28, 2026)

**What ran:** 4 test letters (L02 form, L05 statement, L10 no-deadline letter, L11 three-line statement), each read once by each model through Workers AI on your account, using a throwaway local harness. The harness lives in the scratchpad and is not part of AppealPath.

**Big caveat:** the images were **clean digital renders** of the letters (1224×1584 JPEG), not phone photos, so this is a best case. Rerun with your phone photos once they're printed and taken, especially L02-blurry and L08-angled.

## Results

| | Gemma 4 (`@cf/google/gemma-4-26b-a4b-it`) | Llama 4 Scout (`@cf/meta/llama-4-scout-17b-16e-instruct`) |
|---|---|---|
| **Cost per read** | **about 16 neurons** (15.6–17.2) | about 94 neurons (91.7–97.0) |
| **Reads per day on the free 10,000** | about 600, shared with SnapList | about 100 |
| **Time per read** | 4.8–9.8 s | 7.9–9.2 s |
| **Reason category** (decides the result) | **4/4 right** | 3/4. L05 billing error read as "not medically necessary", which **would have sent the user to Appeal instead of Fix**. (L11 "not covered" vs "out of network" lands on Appeal either way.) |
| **Deadline** | 4/4 right, **including no deadline on L10** (it didn't invent one) | 4/4 right, including L10 |
| **Main denied service** | 4/4 right | 4/4 right |
| **Reason copied word for word** | 3/4. On L10 it dropped a word ("a home apnea test" instead of "a home sleep apnea test") | 4/4 |
| **List of denied services** | 3/4. On L11 it listed the **paid** chest X-ray as denied (the main denied service was still right) | 4/4 |
| **Phone, reference #, letter date** | All right | Missed reference # and letter date on L11, and letter date on L05 |
| **Self-reported confidence** | **1.0 on every field it filled**, including the wrong quote | Same: 1.0 on everything it filled |

Total used: about 446 neurons, under 5% of today's free allowance.

## What this changes

1. **Use Gemma 4.** It got every routing decision right for a sixth of Scout's cost, and Scout made the only routing error. Keep Scout as the backup for a failed or invalid answer, as SnapList does, not as a second opinion.
2. **Don't use the model's confidence as the safety gate.** Both models said 1.0 on everything, including a wrong quote. The build plan's "confirm anything under 0.7" rule won't catch anything, so the "Check what we read" screen is now **always shown**, with the deadline and reason first. SCREEN-COPY.md, ONE-PAGER.md and DEMO-SCRIPT.md are updated to match.
3. **Don't trust the full list of denied services.** Use `service_denied` for routing. Only ask "which one?" when the letter clearly lists more than one denied line, and show the list for the user to confirm.
4. **Stretch goal (Saturday evening, only if on schedule): a second reader.** Run free in-browser OCR (Tesseract.js) on the same photo and check that the deadline and reason quotes appear in its text. Disagreement highlights the field. That would be a real signal for "the AI might be wrong", which self-reported confidence isn't. Not tested yet.
5. **The free allowance is fine for judging,** but it's shared with SnapList. About 600 reads/day only holds if SnapList isn't busy the same day. The sample-letter replay (no AI call) is what guarantees judges always see it work.

## Technical notes for build day

- Request shape that worked: OpenAI-style `messages` with an `image_url` data URL, `response_format: { type: "json_schema", json_schema: { name, schema, strict: true } }`, `chat_template_kwargs: { enable_thinking: false }`, `max_completion_tokens: 1200`, `temperature: 0`.
- Gemma reported only about 541 prompt tokens for a full-page image, so it appears to shrink images a lot. Clean text still read fine; small print on phone photos is the open question.
- Workers AI returned `usage.neurons` in the response, so the app can log the real cost per read.
- Schema used: `plan_name, member_name, letter_date, reference_number, denied_services[], service_denied, reason_quote, reason_category (enum), deadline_quote, appeal_phone, expedited_phone`, each as `{ value, confidence }` (the confidence turned out not to be useful).
