// Real denial letters often run two or three pages: the reason on the first, the appeal rights and phone numbers
// later. Each page is read on its own, and this joins the readings: each fact comes from the first page that has it.
import { distinctServices } from "./services";
import type { Reading } from "./types";

const TEXT_FIELDS = [
  "planName",
  "memberName",
  "memberId",
  "letterDate",
  "reference",
  "service",
  "deadlineQuote",
  "appealPhone",
  "expeditedPhone",
  "appealAddress",
  "provider",
] as const;

export function mergeReadings(pages: Reading[]): Reading {
  const [first, ...rest] = pages;
  if (!first) throw new Error("no pages");
  if (!rest.length) return first;
  const merged: Reading = { ...first };
  for (const f of TEXT_FIELDS) merged[f] = pages.find((p) => p[f] !== null)?.[f] ?? null;
  // The reason and its kind come from the same page, so a quote is never paired with another page's kind of reason.
  const reasonPage = pages.find((p) => p.category !== "unclear") ?? pages.find((p) => p.reasonQuote !== null) ?? first;
  merged.category = reasonPage.category;
  merged.reasonQuote = reasonPage.reasonQuote ?? pages.find((p) => p.reasonQuote !== null)?.reasonQuote ?? null;
  merged.isDenial = pages.some((p) => p.isDenial);
  merged.deniedServices = distinctServices(pages.flatMap((p) => p.deniedServices));
  return merged;
}
