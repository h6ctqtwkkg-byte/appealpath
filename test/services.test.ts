import { describe, expect, it } from "vitest";
import { distinctServices } from "../src/shared/services";

describe("distinctServices", () => {
  it("treats a short name and its full line as one service, keeping the fuller wording (L02)", () => {
    expect(distinctServices(["Physical therapy", "Physical therapy, 12 visits, August 4 to September 25, 2026"])).toEqual([
      "Physical therapy, 12 visits, August 4 to September 25, 2026",
    ]);
  });
  it("keeps genuinely different services (L11)", () => {
    expect(distinctServices(["Ground ambulance transport", "X-ray, chest"])).toEqual(["Ground ambulance transport", "X-ray, chest"]);
  });
  it("ignores case, punctuation and blanks", () => {
    expect(distinctServices(["MRI of the lumbar spine", "mri of the lumbar spine.", "  "])).toEqual(["MRI of the lumbar spine"]);
  });
});
