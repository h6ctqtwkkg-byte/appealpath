// The routing rules from prep/ROUTING.md, checked in order; the first match wins.
// The AI never decides: it reads the letter, the user checks it, and this function picks the next step.
import { APPEAL_TYPE, FIX_TYPE, type Answers, type Category, type Decision } from "./types";

export function decide(answers: Answers, reading: { category: Category; deadlineQuote: string | null }): Decision {
  const base = { askDoctor: answers.doctorSaysHarm === "not_asked", noDeadline: !reading.deadlineQuote?.trim() };

  // 1. Medicare and Medicaid have their own appeal systems; v1 doesn't model them.
  if (answers.plan === "medicare" || answers.plan === "medicaid" || answers.plan === "not_sure") {
    return { ...base, outcome: "guard_plan", rule: 1 };
  }
  // 2. Healthcare.gov: an expedited appeal when the standard timeline could seriously harm you. Only before the care.
  if (!answers.careHappened && answers.doctorSaysHarm === "yes") {
    return { ...base, outcome: "urgent", rule: 2 };
  }
  const fixType = FIX_TYPE.includes(reading.category);
  // 3. The office can send or correct what's missing. "Don't know" counts as not resubmitted.
  if (fixType && answers.officeResubmitted !== "yes") {
    return { ...base, outcome: "fix", rule: 3 };
  }
  // 4. Decided on the merits, or the office already tried the fix.
  if (APPEAL_TYPE.includes(reading.category) || fixType) {
    return { ...base, outcome: "appeal", rule: 4 };
  }
  // 5. No clear reason: don't guess one.
  return { ...base, outcome: "guard_unclear", rule: 5 };
}
