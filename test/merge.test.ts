// Joining the readings of a letter's pages.
import { describe, expect, it } from "vitest";
import { mergeReadings } from "../src/shared/merge";
import { EMPTY_READING, type Reading } from "../src/shared/types";

const page = (over: Partial<Reading>): Reading => ({ ...EMPTY_READING, isDenial: false, ...over });

describe("mergeReadings", () => {
  it("takes each fact from the first page that has it", () => {
    const m = mergeReadings([
      page({ isDenial: true, service: "MRI", reasonQuote: "Not medically necessary.", category: "not_medically_necessary", appealPhone: "(479) 555-0201" }),
      page({ appealPhone: "1-866-444-3272", deadlineQuote: "You have four months to ask for an external review." }),
    ]);
    expect(m.service).toBe("MRI");
    expect(m.appealPhone).toBe("(479) 555-0201");
    expect(m.deadlineQuote).toBe("You have four months to ask for an external review.");
    expect(m.isDenial).toBe(true);
  });

  it("keeps the reason and its kind from the same page", () => {
    const m = mergeReadings([
      page({ reasonQuote: "See the back of this page.", category: "unclear" }),
      page({ reasonQuote: "The service is experimental.", category: "experimental" }),
    ]);
    expect(m.category).toBe("experimental");
    expect(m.reasonQuote).toBe("The service is experimental.");
  });

  it("joins the denied services without repeats, and leaves one page alone", () => {
    expect(mergeReadings([page({ deniedServices: ["MRI"] }), page({ deniedServices: ["MRI of the knee", "X-ray"] })]).deniedServices).toEqual(["MRI of the knee", "X-ray"]);
    const one = page({ service: "MRI" });
    expect(mergeReadings([one])).toBe(one);
  });
});
