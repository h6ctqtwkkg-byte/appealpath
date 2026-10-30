// The rule trace the result screen shows, and the phone numbers that get a warning instead of a call link.
import { describe, expect, it } from "vitest";
import { payPerCall } from "../src/shared/phones";
import { decide, explain } from "../src/shared/rules";
import type { Answers } from "../src/shared/types";

const job = (over: Partial<Answers> = {}): Answers => ({ plan: "job", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no", state: "AR", ...over });

describe("explain", () => {
  it("lists every rule's test in order, and decide() takes the first that's true", () => {
    const urgentPaperwork = job({ careHappened: false, doctorSaysHarm: "yes" });
    expect(explain(urgentPaperwork, { category: "prior_auth_missing" })).toEqual([false, true, true, true, true]);
    expect(decide(urgentPaperwork, { category: "prior_auth_missing", deadlineQuote: null }).rule).toBe(2);
    expect(explain(job({ plan: "medicaid" }), { category: "unclear" })[0]).toBe(true);
    expect(explain(job(), { category: "unclear" })).toEqual([false, false, false, false, true]);
  });

  it("agrees with decide() for every plan, answer and kind of reason", () => {
    const categories = ["prior_auth_missing", "missing_info", "billing_error", "not_medically_necessary", "not_covered", "out_of_network", "experimental", "unclear"] as const;
    for (const plan of ["job", "marketplace", "medicare", "medicaid", "not_sure"] as const)
      for (const careHappened of [true, false])
        for (const doctorSaysHarm of ["yes", "no", "not_asked"] as const)
          for (const officeResubmitted of ["yes", "no", "dont_know"] as const)
            for (const category of categories) {
              const answers = job({ plan, careHappened, doctorSaysHarm, officeResubmitted });
              expect(decide(answers, { category, deadlineQuote: "x" }).rule).toBe(explain(answers, { category }).indexOf(true) + 1);
            }
  });
});

describe("payPerCall", () => {
  it("flags 900 numbers and 976 exchanges, with or without a leading 1", () => {
    expect(payPerCall("1-900-555-0199")).toBe(true);
    expect(payPerCall("(900) 555-0199")).toBe(true);
    expect(payPerCall("(479) 976-1234")).toBe(true);
  });
  it("still flags one with an extension printed after it", () => {
    expect(payPerCall("1-900-555-0199 ext. 2")).toBe(true);
  });
  it("leaves ordinary and toll-free numbers alone", () => {
    expect(payPerCall("(479) 555-0177")).toBe(false);
    expect(payPerCall("1-800-555-0123")).toBe(false);
    expect(payPerCall(null)).toBe(false);
  });
});
