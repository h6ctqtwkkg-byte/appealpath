# AppealPath routing rules, with sources

Checked live on Oct 28, 2026. Each rule says whether it comes from an official source or is a design decision of ours. The app quotes the deadline printed on the letter and never calculates one.

## The 5 questions

1. **What kind of plan is it?** Through a job · Marketplace · Medicare · Medicaid · Not sure
2. **Has the care already happened?** Yes · No, it's still scheduled or needed
3. **Has your doctor said waiting could seriously harm your health?** Yes · No · I haven't asked
4. **Has your doctor's office already resubmitted or sent more information?** Yes · No · Don't know
5. **What state do you live in?**

The AI reads these from the photo: service denied, denial reason (word for word), reason category, deadline (word for word, or none), appeal phone, expedited phone, address or fax for appeals, letter date, member name, and reference or claim number.

**Reason categories:**
- **Fix-type:** prior authorization missing; missing paperwork or records; billing or coding error
- **Appeal-type:** not medically necessary; not covered or excluded; out of network; experimental or investigational
- **Unclear:** anything else

## Rules (checked in this order; the first match wins)

| # | If… | Result | Where it comes from |
|---|---|---|---|
| 1 | Plan is Medicare, Medicaid or not sure | **Guard:** this prototype covers job and Marketplace plans; call the number on your letter | Design decision. Medicare and Medicaid run separate appeal systems that v1 doesn't model. The form shows this as soon as one of these plans is picked, before any letter is read. |
| 2 | Care hasn't happened **and** the doctor says waiting could seriously harm your health | **Urgent review today** | [Healthcare.gov, internal appeals](https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/): you can ask for an expedited appeal if the standard timeline would seriously jeopardize your life or health or your ability to regain maximum function, and in urgent cases you can request external review at the same time as the internal appeal. |
| 3 | Fix-type reason **and** the office hasn't resubmitted (or "Don't know") | **Fix & resubmit** | Design decision. These denials are about something the provider sends or corrects, and the letters themselves say the provider may submit or resubmit. |
| 4 | Appeal-type reason, **or** fix-type and the office already resubmitted | **Appeal** | [Healthcare.gov, internal appeals](https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/): file within 180 days of receiving the denial notice. |
| 5 | Unclear reason | **Guard:** call and ask why it was denied and what the deadline is | Design decision. |

"I haven't asked" on question 3 counts as **No**. The result then adds: *If you think waiting could harm your health, ask your doctor today.*

## Timelines you may show (as published facts, never as the user's personal deadline)

From [Healthcare.gov, internal appeals](https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/) and [external review](https://www.healthcare.gov/appeal-insurance-company-decision/external-review/):

- **Internal appeal:** file within 180 days of receiving the denial notice.
- **Plan's decision on a standard appeal:** within 30 days for care you haven't received, 60 days for care you already received.
- **External review** (after a final internal denial): request it within 4 months of receiving the final decision. A standard review is decided within 45 days; an expedited one within 72 hours or less. The plan must accept the reviewer's decision.

Use these only when the letter prints no deadline, worded as: *"Healthcare.gov says… Call [phone] to confirm yours."*

## Free-help directory (verified Oct 28, 2026)

| Who | Contact | Source | Use it for |
|---|---|---|---|
| Arkansas Insurance Department, Consumer Services | 501-371-2640 · 1-800-852-5494 | [Consumer Services](https://insurance.arkansas.gov/consumer-assistance/consumer-services/), [Contact AID](https://insurance.arkansas.gov/contact/) | Help with job or Marketplace denials in Arkansas |
| Arkansas Insurance Department, External Review | insurance.externalreview@arkansas.gov · fax 501-371-2734 (forms on the page, including a physician certification for expedited review) | [External Review](https://insurance.arkansas.gov/consumer-assistance/consumer-services/external-review/) | After a final internal denial; urgent cases |
| Arkansas SHIIP (free Medicare counseling) | 501-371-2782 · 800-224-6330 | [Contact AID](https://insurance.arkansas.gov/contact/) | Guard card for Medicare |
| U.S. Dept. of Labor, EBSA | (866) 444-3272 | [Ask EBSA](https://beta.dol.gov/about/agencies/ebsa/ask-ebsa) | Job-based plans, especially self-funded ones |
| Outside Arkansas | Your state's Department of Insurance or Consumer Assistance Program, via the directory Healthcare.gov links to | [Healthcare.gov, external review](https://www.healthcare.gov/appeal-insurance-company-decision/external-review/) | L04-type cases (Missouri member) |

## Open questions (unverified)

- **1-800-852-5494:** the Consumer Services page calls it toll-free, but the Contact page lists the same number as TTY. The same mismatch applies to SHIIP's 800-224-6330. Call or check before demo day, or show only the 501 numbers.
- **Self-funded job plans:** the Arkansas external review page has a FAQ about "Medicare, Medicaid or self-funded health plans", but the answer didn't load. Assumption until confirmed: Arkansas's state review covers fully insured plans, and self-funded plans go through a federal process, which is why EBSA is listed. Most people don't know which kind of plan they have, so the Appeal result should say "Ask HR whether your plan is self-funded" rather than guess.
- **The direct URL of the state directory Healthcare.gov links to** wasn't checked.
