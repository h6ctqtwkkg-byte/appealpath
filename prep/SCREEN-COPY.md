# AppealPath screen wording

Every word on every screen, written before the build so the 48 hours go to building. `[brackets]` are filled from the letter or the answers. If a field is empty, leave its line out; never fill it in with something made up.

## On every screen

- **Banner (top, always visible):** Prototype. Not medical or legal advice. If this is a medical emergency, call 911.
- **Footer:** AppealPath doesn't contact your insurer or file anything for you. We don't save your photo or your answers. · How it decides

---

## 1. The form

**Headline:** Got a health insurance denial? Find your next step.

**Subhead:** Take a photo of the letter and answer 5 questions. You'll get one next step, who to call, and the deadline printed on your letter.

**Photo**
- Label: Photo of your letter
- Button: Take or choose a photo
- Hint: Lay it flat with the whole page in frame. We read it, then throw the photo away.
- After choosing: Change photo

**Questions**
1. What kind of plan is it?
   Through a job · Marketplace (Healthcare.gov or your state's) · Medicare · Medicaid · Not sure
2. Has the care already happened?
   Yes · No, it's still scheduled or needed
3. Has your doctor said waiting could seriously harm your health?
   Yes · No · I haven't asked
4. Has your doctor's office already resubmitted or sent more information?
   Yes · No · Don't know
5. What state do you live in? (dropdown, Arkansas first)

**Main button:** Read my letter

**Below the button:**
- No photo? Enter the details by hand
- Try a sample letter (opens L01, L02, L03)

**While reading:** Reading your letter… this usually takes about 10 seconds.

---

## 2. Check what we read

**Always shown** before any result, with the deadline and the reason at the top. The reader test (READER-TEST.md) showed Gemma rates itself 1.0 on everything, including a quote it got wrong, so its confidence score can't decide whether to ask. Highlight a field when the model left it empty, or, if you build the OCR cross-check (stretch goal), when the two reads disagree.

**Headline:** Check what we read

**Subhead:** Check the deadline and the reason against your letter. Fix anything that's wrong; we won't guess.

Each field shows its label, the value in an editable box, and **From your letter:** "[exact text]".

| Field label | If not found |
|---|---|
| What was denied | We couldn't find this. What care or service was denied? |
| Why it was denied | We couldn't find a clear reason. You can type it, or choose "Not sure". |
| Your appeal deadline | We didn't find a deadline on your letter. (No box: we never ask you to make one up.) |
| Phone number for appeals | We couldn't find one. Check the back of your insurance card. |
| Reference or claim number | Not found. That's OK. |

Reason picker (shown if the reason is unclear): Prior authorization missing · Missing paperwork or records · Billing or coding mistake · Not medically necessary · Not covered by my plan · Out of network · Experimental · Not sure

**Button:** Looks right, show my next step

---

## 3. Results

Every result has, in order: the headline, one sentence on why, the steps, the **facts card**, and the footer.

**Facts card (same on every result):**
- Denied: [service]
- Reason, as written: "[reason quote]"
- In plain words: [plain-language rewording] *(drop this line if behind schedule; keep the quote)*
- Your appeal deadline, as printed: "[deadline quote]", **or** No deadline was printed on your letter.
- Call: [appeal phone]
- Reference: [reference number]

### Fix & resubmit

**Headline:** Next step: ask your doctor's office to fix and resubmit

**Why:** Your plan didn't turn down the care itself. Something the office sends is missing: [plain reason].

**Steps**
1. Call [provider, or "your doctor's office"] and read this:
   > Hi, I'm calling about [service] for [member name]. My insurance denied it because "[reason quote]". Can you send the [prior authorization request / missing records / corrected claim]? The reference number is [reference].
2. Ask them to tell you when it's been sent.
3. If it's denied again, come back. Your next step will be an appeal.

**Keep this:** If you end up appealing, your deadline as printed is "[deadline quote]".

### Appeal

**Headline:** Next step: file an appeal

**Why:** You have the right to ask your plan to look at this again.

**Deadline box (big):** Your deadline, as printed on your letter: "[deadline quote]"
**No-deadline version:** We didn't find a deadline on your letter. Healthcare.gov says internal appeals must be filed within 180 days of receiving the denial notice. Call [appeal phone] to confirm yours.

**Steps**
1. Ask your doctor for a letter explaining why you need [service].
2. Send the appeal below, with that letter, to [appeal address or fax from the letter].
3. Keep copies. Write down the date and the name of everyone you talk to.
4. If the plan still says no, you can ask for an independent external review. Healthcare.gov says to request it within 4 months of the final decision.

**Job plans only:** Ask HR whether your plan is "self-funded". It changes who handles an outside review.

**Button:** Print my appeal letter

**Appeal letter (fixed template; only the brackets are filled in):**
> [Today's date]
>
> [Plan name], Appeals
> [Appeals address from letter]
>
> Re: Appeal of denial for [member name], Member ID [member ID], Reference [reference]
>
> I am requesting an internal appeal of your decision dated [letter date] to deny [service]. Your letter gives this reason: "[reason quote]".
>
> I disagree with this decision. ______________________________ (in your own words: what your doctor said, and why you need this care)
>
> I have attached: ☐ a letter from my doctor ☐ medical records ☐ other: __________
>
> Please review this decision and send me your answer in writing.
>
> Sincerely,
> [member name]
> Phone: __________

### Urgent review today

**Headline:** Next step: ask for an urgent review today

**Why:** The care hasn't happened yet and your doctor says waiting could seriously harm your health, so you can ask for a fast (expedited) appeal now. You can also ask for an outside review at the same time.

**Steps**
1. Today, call [expedited phone, or appeal phone] and say:
   > I'm requesting an expedited appeal for [service] for [member name]. My doctor says waiting could seriously harm my health. The reference number is [reference].
2. Ask your doctor's office to tell the plan, in writing, that waiting could seriously harm your health.
   *(Arkansas:)* The Arkansas Insurance Department has a form for this: Physician Certification of Expedited External Review.
3. Get free help: Arkansas Insurance Department Consumer Services, 501-371-2640.

**Red line, always shown:** If this is a medical emergency, call 911. Don't wait on insurance.

### Guard: plan type

**Headline:** This prototype covers job and Marketplace plans

**Why:** Medicare and Medicaid have their own appeal rules, and we don't want to guess.

**Steps**
1. Call the number on your letter, [appeal phone], and ask: "Why exactly was this denied, and what's my deadline to appeal?"
2. *(Medicare, Arkansas:)* Free Medicare counseling: SHIIP, 501-371-2782.

### Guard: unclear reason

**Headline:** We couldn't tell why it was denied

**Why:** Your letter doesn't give a clear reason, so we won't guess one.

**Steps**
1. Call [appeal phone] and ask two questions:
   - Why exactly was this denied?
   - What's my deadline to appeal?
2. Write down the date, who you talked to, and what they said.
3. Come back and enter the reason by hand to get your next step.

---

## 4. Errors and edge cases

| Situation | Message |
|---|---|
| AI busy or out of free quota | Our letter reader is busy right now. You can enter the details by hand, or try a sample letter. |
| Photo unreadable | We couldn't read this photo. Try again in good light with the whole page in frame, or enter the details by hand. |
| Not a denial letter | This doesn't look like an insurance denial. If it is, enter the details by hand. |
| Several denied services | This letter lists more than one denied service. Which one do you want help with? (list them) |
| Not in Arkansas | Free-help links show your state's Department of Insurance instead of Arkansas contacts. |
| Sample letter used | Sample letter: read ahead of time, no AI used just now. |

---

## 5. How it decides (page)

**Headline:** How AppealPath decides

1. **The AI reads; the rules decide.** An AI model reads your letter: what was denied, why, the deadline, and who to call. It copies text word for word. Fixed rules, not the AI, pick your next step from what it read and your 5 answers.
2. **You check before it decides.** You always check the deadline and the reason against your letter before you get a next step. AI readers can sound sure and still be wrong: in our tests, the model said it was 100% sure about a sentence it had copied with a word missing.
3. **It never makes up a deadline.** It shows the one printed on your letter. If there isn't one, it says so.
4. **The rules** *(table from ROUTING.md, with sources).*
5. **How well it works:** We tested it on 12 fictional letters and 2 hard photos. *(Results table: fields read correctly, fields sent to "check what we read", results correct, including the misses.)* These test letters are cleaner than real mail, so real-world accuracy will be lower.
6. **What it won't do:** contact your insurer, file anything, predict whether you'll win, give medical or legal advice, or save your photo.
7. **Limits:** v1 covers job and Marketplace plans only. Medicare and Medicaid get "call the number on your letter".
8. **Sources:** Healthcare.gov (internal appeals, external review), Arkansas Insurance Department, U.S. Department of Labor (EBSA).
