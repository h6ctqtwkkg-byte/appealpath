// The sample letters judges open: each needs a saved reading (scripts/capture-samples.mjs reads the sample's image to
// make one), and that reading has to lead to the next step the answer key expects, or the samples would show something
// the tests never checked.
import { describe, expect, it } from "vitest";
import { JUDGE_SAMPLE, SAMPLES } from "../src/client/samples";
import { decide } from "../src/shared/rules";
import type { Reading } from "../src/shared/types";
import readings from "../public/samples/readings.json" with { type: "json" };
import answerKey from "../test-letters/answer-key.json" with { type: "json" };

const saved = readings as unknown as Record<string, { reading: Reading }>;
const key = answerKey.letters as Record<string, { outcome: string; phones: string[] }>;

describe("sample letters", () => {
  for (const s of SAMPLES) {
    it(`${s.id} has a saved reading that gives the expected next step`, () => {
      expect(saved[s.id]).toBeDefined();
      expect(decide(s.answers, saved[s.id]!.reading).outcome).toBe(key[s.id]!.outcome);
    });
  }

  it("the judge's sample really has the AI's fax mistake for the check to catch", () => {
    const phone = saved[JUDGE_SAMPLE]!.reading.appealPhone?.replace(/\D/g, "");
    expect(phone).toBeTruthy();
    expect(key[JUDGE_SAMPLE]!.phones).not.toContain(phone);
  });
});
