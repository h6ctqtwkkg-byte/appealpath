// normalize() is the only thing between a model answer and the screen, so it has to be strict.
import { describe, expect, it } from "vitest";
import { normalize } from "../src/read";

const answer = (over: Record<string, unknown> = {}) => ({
  observations: "A denial letter.",
  is_denial: true,
  plan_name: "Sample Health Plan",
  member_name: "Jordan Sample",
  member_id: "SHP-000-4417",
  letter_date: "October 19, 2026",
  reference_number: "UM-26-104417",
  provider: "Dr. Morgan Lee",
  denied_services: ["MRI of the lumbar spine"],
  service_denied: "MRI of the lumbar spine",
  reason_quote: "Prior authorization was not received.",
  reason_category: "prior_auth_missing",
  deadline_quote: "You have 180 days from the date you receive this notice to file an appeal.",
  appeal_phone: "(479) 555-0143",
  expedited_phone: "(479) 555-0144",
  appeal_address: "PO Box 0001, Example City, AR 00000",
  ...over,
});

describe("normalize", () => {
  it("accepts a JSON string or an object", () => {
    expect(normalize(JSON.stringify(answer()))?.service).toBe("MRI of the lumbar spine");
    expect(normalize(answer())?.category).toBe("prior_auth_missing");
  });

  it("rejects anything that isn't an answer", () => {
    expect(normalize("not json")).toBeNull();
    expect(normalize(null)).toBeNull();
    expect(normalize([])).toBeNull();
    expect(normalize({ service_denied: "x" })).toBeNull();
  });

  it("keeps a missing deadline missing", () => {
    expect(normalize(answer({ deadline_quote: null }))?.deadlineQuote).toBeNull();
    expect(normalize(answer({ deadline_quote: "  " }))?.deadlineQuote).toBeNull();
    expect(normalize(answer({ deadline_quote: "Not printed" }))?.deadlineQuote).toBeNull();
  });

  it("turns an unknown category into unclear", () => {
    expect(normalize(answer({ reason_category: "made_up" }))?.category).toBe("unclear");
  });

  it("falls back to the first denied service and keeps the main one in the list", () => {
    expect(normalize(answer({ service_denied: null, denied_services: ["Ground ambulance"] }))?.service).toBe("Ground ambulance");
    expect(normalize(answer({ denied_services: [] }))?.deniedServices).toEqual(["MRI of the lumbar spine"]);
  });

  it("collapses whitespace and caps long text", () => {
    expect(normalize(answer({ reason_quote: "  Prior\n authorization   missing. " }))?.reasonQuote).toBe("Prior authorization missing.");
    expect(normalize(answer({ reason_quote: "x".repeat(5000) }))?.reasonQuote?.length).toBe(600);
  });
});
