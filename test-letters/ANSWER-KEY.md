# AppealPath test set: answer key

12 fictional denial letters (`letters.pdf`, one per page) and the result AppealPath should give for each. Every insurer, person, provider, ID, code and phone number is made up. The phone numbers use 555-0100 to 555-0199, the range reserved for fiction. Each page carries a "SAMPLE · NOT A REAL LETTER" watermark and a footer saying so.

Use the set twice: on Nov 2 to compare the AI readers, and on Sat Nov 7 (5–7 PM) to measure the finished app. The results go on the "How it decides" page, including the misses.

## Routing rules these answers assume (checked in order)

| Rule | If… | Result |
|---|---|---|
| 1 | Plan is Medicare, Medicaid or "not sure" | **Guard:** this prototype covers job and Marketplace plans; call the number on your letter |
| 2 | Care hasn't happened yet **and** the doctor says waiting could seriously harm your health | **Urgent review today** |
| 3 | Reason is fix-type (prior auth missing, missing paperwork, billing/coding error) **and** the office hasn't resubmitted | **Fix & resubmit** |
| 4 | Reason is appeal-type (not medically necessary, not covered, out of network, experimental), **or** fix-type and the office already resubmitted | **Appeal** |
| 5 | Reason unclear | **Guard:** call and ask why it was denied and what your deadline is |

## Table 1: what the app should read from each letter

| Letter | Layout | Plan, as printed | Service denied | Reason category | Deadline, as printed (quote exactly) | Appeal phone |
|---|---|---|---|---|---|---|
| L01 | Letter | Sample Health Plan, employer group | MRI of the lumbar spine, scheduled Nov 20, 2026 | Prior auth missing | "You have 180 days from the date you receive this notice to file an appeal." | (479) 555-0143 |
| L02 | Form | Example Silver 2026 (Marketplace plan) | Physical therapy, 12 visits, Aug 4 – Sep 25, 2026 | Not medically necessary | "Your appeal must be received by April 19, 2027." | (479) 555-0177 |
| L03 | Letter | Sample Health Plan, employer group | Inpatient rehab admission after stroke, expected Nov 16, 2026 | Not medically necessary (lower level of care) | "You may appeal this decision within 180 days of the date you receive this notice." | (479) 555-0143; urgent (479) 555-0144 |
| L04 | Form | Example Bronze 2026 (Marketplace plan) | Cardiology follow-up visit, Sep 30, 2026 | Out of network | "You have 180 days from the date you receive this notice to ask for an appeal." | (479) 555-0177 |
| L05 | EOB | Sample Health Plan, employer group | Laboratory blood panel, Sep 18, 2026 | Billing/coding error | "You may file an appeal within 180 days of the date of this statement." | (479) 555-0142 |
| L06 | Letter | Sample Health Plan, employer group | Outpatient knee arthroscopy, Aug 28, 2026 | Missing records | "You may file an appeal within 180 days after you receive this notice." | (479) 555-0143 |
| L07 | Form | Example Gold 2026 (Marketplace plan) | Prescription hearing aids (pair) | Not covered (excluded) | "Your appeal must be received within 180 days of the date of this notice." | (479) 555-0177 |
| L08 | Letter | Sample Health Plan, employer group | Gallbladder removal, scheduled Nov 23, 2026 | Prior auth missing | "You have 180 days from the date you receive this notice to file an appeal." | (479) 555-0143; urgent (479) 555-0144 |
| L09 | Form | Sample Senior Advantage (Medicare Advantage plan) | Skilled nursing stay after Oct 25, 2026 | Not used: the guard fires first | "If you want to appeal, you must ask within 65 days of the date of this notice." | (479) 555-0188 |
| L10 | Letter | Sample Health Plan, employer group | In-lab sleep study, requested Dec 3, 2026 | Not medically necessary | **None printed.** The app must return no deadline, not "180 days". | (479) 555-0142 |
| L11 | EOB, 3 lines | Sample Health Plan, employer group | Ground ambulance, Oct 2, 2026 (the only denied line; the ER visit and X-ray were paid) | Out of network | "You may file an appeal within 180 days of receiving this statement." | (479) 555-0142 |
| L12 | EOB | Sample Health Plan, employer group | Office visit, Sep 9, 2026 | Unclear ("Claim denied. See plan documents.") | "You may file an appeal within 180 days of the date of this statement." | (479) 555-0142 |

## Table 2: test answers and expected result

| Letter | Plan type | Care already happened? | Doctor says waiting could seriously harm? | Office already resubmitted? | State | Expected result | Rule | What it tests |
|---|---|---|---|---|---|---|---|---|
| L01 | Job | No | No | No | AR | **Fix & resubmit** | 3 | Demo A. Reads the reason, not the appeal paragraph below it. |
| L02 | Marketplace | Yes | No | No | AR | **Appeal** | 4 | Demo B. Deadline is printed as a date, so quote it word for word. |
| L03 | Job | No | Yes | No | AR | **Urgent review today** | 2 | Demo C. |
| L04 | Marketplace | Yes | No | No | MO | **Appeal** | 4 | Member outside Arkansas: help links fall back to the general ones. |
| L05 | Job | Yes | No | No | AR | **Fix & resubmit** | 3 | EOB layout; billing error. |
| L06 | Job | Yes | No | Yes | AR | **Appeal** | 4 | Fix-type reason, but the office already resubmitted. |
| L07 | Marketplace | No | No | No | AR | **Appeal** | 4 | Excluded benefit. The result must not guess the odds of winning. |
| L08 | Job | No | Yes | No | AR | **Urgent review today** | 2 | Urgent beats Fix even though the reason is prior auth. |
| L09 | Medicare | No | No | No | AR | **Guard (call the number on your letter)** | 1 | A Medicare-style letter never gets a verdict. |
| L10 | Job | No | Not asked | No | AR | **Appeal**, with the no-deadline note | 4 | The deadline comes back empty; the result shows Healthcare.gov's 180-day rule with "call to confirm". |
| L11 | Job | Yes | Yes | No | AR | **Appeal** | 4 | Urgent only applies before care happens. Finds the one denied line of three. |
| L12 | Job | Yes | No | Don't know | AR | **Guard (call and ask why, and what the deadline is)** | 5 | Vague reason; "Don't know" doesn't break anything. |

Totals: Fix & resubmit 2, Appeal 6, Urgent 2, Guard 2.

## Taking the photos

1. Print `letters.pdf` single-sided on plain white letter paper.
2. Lay each page flat on a dark table in daylight. Hold the phone straight above it with the whole page in frame and the flash off. Save them as `L01.jpg` … `L12.jpg`.
3. Take two extra, harder photos:
   - **`L02-blurry.jpg`**: hold the phone about 6 inches away so the page is soft but mostly readable. This is the demo's "asks instead of guessing" moment.
   - **`L08-angled.jpg`**: tilt the phone about 30° and let your hand's shadow cover the bottom third.
4. Never photograph anything with your own real information on it.

For the hard photos, the right outcome is the same result as the clean photo after the user checks. The deadline and reason always go to the "Check what we read" screen (the model's own confidence turned out to be useless; see `../prep/READER-TEST.md`). What you're scoring is whether the values shown there are right, or left empty, rather than confidently wrong. **A wrong value is a fail; an empty field the user fills in is not.**

## Scoring sheet (fill in on Nov 7)

Mark each cell ✓ (right), ✗ (wrong and not flagged) or **?** (sent to the confirm step).

| Photo | Service | Reason category | Deadline | Phone | Final result |
|---|---|---|---|---|---|
| L01 | | | | | |
| L02 | | | | | |
| L02-blurry | | | | | |
| L03 | | | | | |
| L04 | | | | | |
| L05 | | | | | |
| L06 | | | | | |
| L07 | | | | | |
| L08 | | | | | |
| L08-angled | | | | | |
| L09 | | | | | |
| L10 | | | | | |
| L11 | | | | | |
| L12 | | | | | |
| **Totals** | /14 | /14 | /14 | /14 | /14 |

## Decisions baked into this set (change them if you disagree)

- **"Don't know"** for "office already resubmitted" counts as **No**, so the result tells you to call the office and check.
- **"Not asked"** for "doctor says waiting could harm" counts as **No**. The result should add a line: if you think waiting could harm your health, ask your doctor today.
- **Fix-type reasons:** prior auth missing, missing paperwork or records, billing/coding error. **Appeal-type:** not medically necessary, not covered or excluded, out of network, experimental. Anything else is **unclear**.
- **The AI never fills in a deadline that isn't printed** (L10 checks this).

## Changes from the build plan, and limits

- **Not in this set:** an "experimental" denial. Its slot went to L08 (urgent beats fix) and L11 (urgent doesn't apply after care). Add an L13 if you want one.
- **"Two services in one letter"** became L11: three lines on one statement, only one of them denied.
- **These letters are cleaner than real mail.** They were written as tidy, printed text, so accuracy on them is a best case. Say so on the "How it decides" page.
- The L09 letter states a 65-day Medicare Advantage appeal window. That's part of the fiction and wasn't checked against Medicare rules. AppealPath never uses it, because rule 1 fires first.
