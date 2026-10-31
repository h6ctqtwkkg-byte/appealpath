// The second reader's verdict on each field the user acts on, shared by the check screen (to stop before going on) and
// the result screen (to say which values the photo never confirmed). Tesseract only proves words are printed on the
// photo, not that they're the right ones, so a confirmed value still gets the user's own check.
import { FOUND, findPhone, findQuote, type Box } from "../shared/match";
import type { Reading } from "../shared/types";
import type { OcrResult } from "./ocr";

/** "done" keeps every page's words; result is page 1, for the code that only ever had one page. */
export type OcrState = { status: "none" | "running" | "failed" } | { status: "done"; result: OcrResult; pages: OcrResult[] };
export type Verdict = "exact" | "close" | "notFound" | "fax";
export type CheckedField = "deadline" | "reason" | "phone" | "expedited";
/** Where a value was found: the page (0 = first) and the boxes to highlight on it. */
export type Found = { verdict: Verdict; boxes: Box[]; page: number };

const pagesOf = (ocr: OcrState) => (ocr.status === "done" ? (ocr.pages.length ? ocr.pages : [ocr.result]) : []);

type QuoteMatch = NonNullable<ReturnType<typeof findQuote>>;

/** The best match on any page: an exact one first, then the closest. */
export function quoteVerdict(text: string | null, ocr: OcrState): Found | null {
  if (!text?.trim() || ocr.status !== "done") return null;
  const pages = pagesOf(ocr);
  let best: { m: QuoteMatch; page: number } | null = null;
  for (let page = 0; page < pages.length; page++) {
    const m = findQuote(text, pages[page]!.words);
    if (m && (!best || (m.exact && !best.m.exact) || (m.exact === best.m.exact && m.score > best.m.score))) best = { m, page };
  }
  if (!best || best.m.score < FOUND) return { verdict: "notFound", boxes: best?.m.boxes ?? [], page: best?.page ?? 0 };
  return { verdict: best.m.exact ? "exact" : "close", boxes: best.m.boxes, page: best.page };
}

/** A phone number on any page; a fax only if it's labeled as one wherever it was found. */
export function phoneVerdict(text: string | null, ocr: OcrState): Found | null {
  if (!text?.trim() || ocr.status !== "done") return null;
  const found = pagesOf(ocr)
    .map((p, page) => ({ m: findPhone(text, p.words), page }))
    .filter((x): x is { m: NonNullable<ReturnType<typeof findPhone>>; page: number } => !!x.m);
  if (!found.length) return { verdict: "notFound", boxes: [], page: 0 };
  const phone = found.find((x) => !x.m.fax) ?? found[0]!;
  return { verdict: phone.m.fax ? "fax" : "exact", boxes: phone.m.boxes, page: phone.page };
}

/**
 * Fields with a value the photo didn't confirm: anything short of an exact match (a "close" quote can hide one wrong
 * digit in a date), a number after the word "fax", or every value while the second reader is still running or
 * couldn't run. With no photo (typed in by hand) there's nothing to check against.
 */
export function unconfirmed(r: Reading, ocr: OcrState, withExpedited: boolean): CheckedField[] {
  if (ocr.status === "none") return [];
  const checked = ocr.status === "done";
  const bad = (text: string | null, v: Found | null) => !!text?.trim() && (!checked || (!!v && v.verdict !== "exact"));
  const out: CheckedField[] = [];
  if (bad(r.deadlineQuote, quoteVerdict(r.deadlineQuote, ocr))) out.push("deadline");
  if (bad(r.reasonQuote, quoteVerdict(r.reasonQuote, ocr))) out.push("reason");
  if (bad(r.appealPhone, phoneVerdict(r.appealPhone, ocr))) out.push("phone");
  if (withExpedited && bad(r.expeditedPhone, phoneVerdict(r.expeditedPhone, ocr))) out.push("expedited");
  return out;
}
