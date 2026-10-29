// The second reader's matching, on hand-made OCR output (word boxes laid out like a scanned line).
import { describe, expect, it } from "vitest";
import { FOUND, findPhone, findQuote, same, tokens, type Word } from "../src/shared/match";

/** Lays words out left to right; each new string in `lines` is a new OCR line. */
function page(...lines: string[]): Word[] {
  return lines.flatMap((text, line) =>
    text.split(" ").map((w, i) => ({ text: w, line, bbox: { x0: i * 50, y0: line * 20, x1: i * 50 + 45, y1: line * 20 + 15 } })),
  );
}

describe("tokens and same", () => {
  it("drops punctuation and case", () => {
    expect(tokens('"You have 180 days," it said.')).toEqual(["you", "have", "180", "days", "it", "said"]);
  });
  it("forgives one OCR slip in a long word but not in numbers or short words", () => {
    expect(same("authorization", "authorizaticn")).toBe(true);
    expect(same("2027", "2021")).toBe(false);
    expect(same("by", "be")).toBe(false);
  });
});

describe("findQuote", () => {
  const letter = page(
    "How to appeal Your appeal must be received by",
    "April 19, 2027. Send a written appeal to the address below.",
  );

  it("finds a quote that wraps across lines and boxes each line", () => {
    const m = findQuote("Your appeal must be received by April 19, 2027.", letter);
    expect(m?.score).toBe(1);
    expect(m?.exact).toBe(true);
    expect(m?.boxes).toHaveLength(2);
  });

  it("survives a misread word", () => {
    const noisy = page("Your appeal must be recieved by April 19, 2027.");
    expect(findQuote("Your appeal must be received by April 19, 2027.", noisy)!.score).toBeGreaterThanOrEqual(FOUND);
  });

  it("catches a quote with a wrong date", () => {
    expect(findQuote("Your appeal must be received by April 29, 2027.", letter)!.score).toBeLessThan(1);
  });

  it("doesn't confirm a sentence that isn't on the page", () => {
    const m = findQuote("You have 180 days from the date you receive this notice to file an appeal.", letter);
    expect(m === null || m.score < FOUND).toBe(true);
  });

  it("catches the dropped word from the reader test (L10)", () => {
    const l10 = page("Under our criteria (SLP-3), a home sleep apnea test is the covered first step.");
    const m = findQuote("Under our criteria (SLP-3), a home apnea test is the covered first step.", l10)!;
    expect(m.score).toBe(1);
    expect(m.exact).toBe(false); // every quoted word is there, but the photo has one more: "sleep"
    expect(findQuote("Under our criteria (SLP-3), a home sleep apnea test is the covered first step.", l10)!.exact).toBe(true);
  });
});

describe("findPhone", () => {
  const letter = page("Member Services (479) 555-0177", "PO Box 0002, or fax it to (479) 555-0178. For help, call (479) 555-0177.");

  it("finds a number split across words", () => {
    expect(findPhone("(479) 555-0177", letter)?.boxes.length).toBe(2);
  });
  it("flags a fax number", () => {
    expect(findPhone("(479) 555-0178", letter)?.fax).toBe(true);
    expect(findPhone("(479) 555-0177", letter)?.fax).toBe(false);
  });
  it("returns null for a number that isn't there", () => {
    expect(findPhone("(479) 555-0199", letter)).toBeNull();
  });
  it("doesn't confirm a number with the wrong area code", () => {
    expect(findPhone("(501) 555-0177", letter)).toBeNull();
  });
  it("ignores a leading 1", () => {
    expect(findPhone("1-479-555-0177", letter)?.fax).toBe(false);
  });
});
