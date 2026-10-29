// Free help on the "call your plan" result: each plan type goes to the office that really handles it.
import { describe, expect, it } from "vitest";
import { helpFor } from "../src/client/help";
import { STRINGS } from "../src/client/i18n";
import type { Answers } from "../src/shared/types";

const answers = (plan: Answers["plan"], state: string): Answers => ({ plan, state, careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no" });
const hrefs = (plan: Answers["plan"], state: string) => helpFor(answers(plan, state), "guard_plan", STRINGS.en).map((h) => h.href);

describe("help for plans AppealPath doesn't cover", () => {
  it("sends Arkansas Medicaid to DHS, not the insurance department", () => {
    expect(hrefs("medicaid", "AR")).toEqual(["https://humanservices.arkansas.gov/contact-us/file-an-appeal/"]);
  });
  it("sends Medicaid elsewhere to the state Medicaid agency list", () => {
    expect(hrefs("medicaid", "MO")).toEqual(["https://www.medicaid.gov/about-us/where-can-people-get-help-medicaid-chip"]);
  });
  it("sends Medicare to SHIIP in Arkansas and to the state SHIP elsewhere", () => {
    expect(helpFor(answers("medicare", "AR"), "guard_plan", STRINGS.en)[0]?.who).toBe("Arkansas SHIIP");
    expect(helpFor(answers("medicare", "MO"), "guard_plan", STRINGS.en)[0]?.who).toMatch(/SHIP/);
  });
  it("sends 'not sure' to the insurance department's consumer help", () => {
    expect(hrefs("not_sure", "AR")).toEqual(["https://insurance.arkansas.gov/consumer-assistance/consumer-services/"]);
  });
});
