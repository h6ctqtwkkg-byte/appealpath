// The second reader's verdict on each field the user acts on, shared by the check screen (to stop before going on) and
// the result screen (to say which values the photo never confirmed). Tesseract only proves words are printed on the
// photo, not that they're the right ones, so a confirmed value still gets the user's own check.
import { FOUND, findPhone, findQuote, type Box } from "../shared/match";
import type { Reading } from "../shared/types";
import type { OcrResult } from "./ocr";

export type OcrState = { status: "none" | "running" | "failed" } | { status: "done"; result: OcrResult };
export type Verdict = "exact" | "close" | "notFound" | "fax";
export type CheckedField = "deadline" | "reason" | "phone" | "expedited";

export function quoteVerdict(text: string | null, ocr: OcrState): { verdict: Verdict; boxes: Box[] } | null {
  if (!text?.trim() || ocr.status !== "done") return null;
  const m = findQuote(text, ocr.result.words);
  if (!m || m.score < FOUND) return { verdict: "notFound", boxes: m?.boxes ?? [] };
  return { verdict: m.exact ? "exact" : "close", boxes: m.boxes };
}

export function phoneVerdict(text: string | null, ocr: OcrState): { verdict: Verdict; boxes: Box[] } | null {
  if (!text?.trim() || ocr.status !== "done") return null;
  const m = findPhone(text, ocr.result.words);
  if (!m) return { verdict: "notFound", boxes: [] };
  return { verdict: m.fax ? "fax" : "exact", boxes: m.boxes };
}

/**
 * Fields with a value the photo didn't confirm: anything short of an exact match (a "close" quote can hide one wrong
 * digit in a date), a number after the word "fax", or every value while the second reader is still running or
 * couldn't run. With no photo (typed in by hand) there's nothing to check against.
 */
export function unconfirmed(r: Reading, ocr: OcrState, withExpedited: boolean): CheckedField[] {
  if (ocr.status === "none") return [];
  const checked = ocr.status === "done";
  const bad = (text: string | null, v: { verdict: Verdict } | null) => !!text?.trim() && (!checked || (!!v && v.verdict !== "exact"));
  const out: CheckedField[] = [];
  if (bad(r.deadlineQuote, quoteVerdict(r.deadlineQuote, ocr))) out.push("deadline");
  if (bad(r.reasonQuote, quoteVerdict(r.reasonQuote, ocr))) out.push("reason");
  if (bad(r.appealPhone, phoneVerdict(r.appealPhone, ocr))) out.push("phone");
  if (withExpedited && bad(r.expeditedPhone, phoneVerdict(r.expeditedPhone, ocr))) out.push("expedited");
  return out;
}
