// The 12 fictional test letters from test-letters/ANSWER-KEY.md (Tables 1 and 2), through the rules.
import { describe, expect, it } from "vitest";
import { decide } from "../src/shared/rules";
import type { Answers, Category, Outcome } from "../src/shared/types";

type Case = [letter: string, category: Category, deadline: string | null, answers: Answers, outcome: Outcome, rule: number];

const a = (plan: Answers["plan"], careHappened: boolean, doctorSaysHarm: Answers["doctorSaysHarm"], officeResubmitted: Answers["officeResubmitted"], state = "AR"): Answers => ({
  plan,
  careHappened,
  doctorSaysHarm,
  officeResubmitted,
  state,
});

const D180 = "You have 180 days from the date you receive this notice to file an appeal.";

const CASES: Case[] = [
  ["L01", "prior_auth_missing", D180, a("job", false, "no", "no"), "fix", 3],
  ["L02", "not_medically_necessary", "Your appeal must be received by April 19, 2027.", a("marketplace", true, "no", "no"), "appeal", 4],
  ["L03", "not_medically_necessary", "You may appeal this decision within 180 days of the date you receive this notice.", a("job", false, "yes", "no"), "urgent", 2],
  ["L04", "out_of_network", "You have 180 days from the date you receive this notice to ask for an appeal.", a("marketplace", true, "no", "no", "MO"), "appeal", 4],
  ["L05", "billing_error", "You may file an appeal within 180 days of the date of this statement.", a("job", true, "no", "no"), "fix", 3],
  ["L06", "missing_info", "You may file an appeal within 180 days after you receive this notice.", a("job", true, "no", "yes"), "appeal", 4],
  ["L07", "not_covered", "Your appeal must be received within 180 days of the date of this notice.", a("marketplace", false, "no", "no"), "appeal", 4],
  ["L08", "prior_auth_missing", D180, a("job", false, "yes", "no"), "urgent", 2],
  ["L09", "not_medically_necessary", "If you want to appeal, you must ask within 65 days of the date of this notice.", a("medicare", false, "no", "no"), "guard_plan", 1],
  ["L10", "not_medically_necessary", null, a("job", false, "not_asked", "no"), "appeal", 4],
  ["L11", "out_of_network", "You may file an appeal within 180 days of receiving this statement.", a("job", true, "yes", "no"), "appeal", 4],
  ["L12", "unclear", "You may file an appeal within 180 days of the date of this statement.", a("job", true, "no", "dont_know"), "guard_unclear", 5],
];

describe("answer key", () => {
  it.each(CASES)("%s → %s", (_letter, category, deadline, answers, outcome, rule) => {
    const d = decide(answers, { category, deadlineQuote: deadline });
    expect(d.outcome).toBe(outcome);
    expect(d.rule).toBe(rule);
  });

  it("totals match the key: 2 fix, 6 appeal, 2 urgent, 2 guard", () => {
    const counts: Record<string, number> = {};
    for (const [, category, deadline, answers] of CASES) {
      const { outcome } = decide(answers, { category, deadlineQuote: deadline });
      counts[outcome] = (counts[outcome] ?? 0) + 1;
    }
    expect(counts).toEqual({ fix: 2, appeal: 6, urgent: 2, guard_plan: 1, guard_unclear: 1 });
  });
});

describe("edges", () => {
  it("flags a missing deadline instead of filling one in (L10)", () => {
    expect(decide(a("job", false, "no", "no"), { category: "not_medically_necessary", deadlineQuote: null }).noDeadline).toBe(true);
    expect(decide(a("job", false, "no", "no"), { category: "not_medically_necessary", deadlineQuote: "  " }).noDeadline).toBe(true);
  });

  it("adds the ask-your-doctor note when the user hasn't asked", () => {
    expect(decide(a("job", false, "not_asked", "no"), { category: "not_covered", deadlineQuote: D180 }).askDoctor).toBe(true);
    expect(decide(a("job", false, "no", "no"), { category: "not_covered", deadlineQuote: D180 }).askDoctor).toBe(false);
  });

  it("never treats 'not asked' as urgent", () => {
    expect(decide(a("job", false, "not_asked", "no"), { category: "prior_auth_missing", deadlineQuote: D180 }).outcome).toBe("fix");
  });

  it("guards every Medicare, Medicaid and not-sure plan, even when urgent", () => {
    for (const plan of ["medicare", "medicaid", "not_sure"] as const) {
      expect(decide(a(plan, false, "yes", "no"), { category: "prior_auth_missing", deadlineQuote: D180 }).outcome).toBe("guard_plan");
    }
  });

  it("urgent beats an unclear reason, because the care is still ahead", () => {
    expect(decide(a("job", false, "yes", "no"), { category: "unclear", deadlineQuote: null }).outcome).toBe("urgent");
  });

  it("an experimental denial is an appeal", () => {
    expect(decide(a("marketplace", false, "no", "no"), { category: "experimental", deadlineQuote: D180 }).outcome).toBe("appeal");
  });
});
