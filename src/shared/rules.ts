// The routing rules from prep/ROUTING.md, checked in order; the first match wins.
// The AI never decides: it reads the letter, the user checks it, and this function picks the next step.
import { APPEAL_TYPE, FIX_TYPE, type Answers, type Category, type Decision, type Outcome, type PlanType } from "./types";

/** Plans rule 1 sends to "call your plan". The form uses this too, so these users see it before any letter is read. */
export const GUARD_PLANS: readonly PlanType[] = ["medicare", "medicaid", "not_sure"];

/** Each rule's test for these answers, in order: decide() takes the first that's true, and the result screen shows them. */
export function explain(answers: Answers, reading: { category: Category }): [boolean, boolean, boolean, boolean, boolean] {
  const fixType = FIX_TYPE.includes(reading.category);
  return [
    // 1. Medicare and Medicaid have their own appeal systems; v1 doesn't model them.
    GUARD_PLANS.includes(answers.plan),
    // 2. Healthcare.gov: an expedited appeal when the standard timeline could seriously harm you. Only before the care.
    !answers.careHappened && answers.doctorSaysHarm === "yes",
    // 3. The office can send or correct what's missing. "Don't know" counts as not resubmitted.
    fixType && answers.officeResubmitted !== "yes",
    // 4. Decided on the merits, or the office already tried the fix.
    APPEAL_TYPE.includes(reading.category) || fixType,
    // 5. No clear reason: don't guess one.
    true,
  ];
}

const OUTCOMES: Outcome[] = ["guard_plan", "urgent", "fix", "appeal", "guard_unclear"];

export function decide(answers: Answers, reading: { category: Category; deadlineQuote: string | null }): Decision {
  const base = { askDoctor: answers.doctorSaysHarm === "not_asked", noDeadline: !reading.deadlineQuote?.trim() };
  const i = explain(answers, reading).indexOf(true);
  return { ...base, outcome: OUTCOMES[i]!, rule: (i + 1) as Decision["rule"] };
}
