// The demo letters (fictional, from test-letters/). Their readings in public/samples/readings.json are real
// model answers captured ahead of time by scripts/capture-samples.mjs, so a sample never spends neurons and keeps working when the free allowance runs out.
// Their labels are in i18n.ts (form.samples).
import type { Answers, Reading } from "../shared/types";

export interface Sample {
  id: string;
  answers: Answers;
}

export const SAMPLES: Sample[] = [
  { id: "L01", answers: { plan: "job", careHappened: false, doctorSaysHarm: "no", officeResubmitted: "no", state: "AR" } },
  { id: "L02", answers: { plan: "marketplace", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no", state: "AR" } },
  { id: "L04", answers: { plan: "marketplace", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no", state: "MO" } },
  { id: "L03", answers: { plan: "job", careHappened: false, doctorSaysHarm: "yes", officeResubmitted: "no", state: "AR" } },
  { id: "L09", answers: { plan: "medicare", careHappened: false, doctorSaysHarm: "no", officeResubmitted: "no", state: "AR" } },
  { id: "L12", answers: { plan: "job", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "dont_know", state: "AR" } },
];

/** The sample "Just looking, or judging?" opens: a saved reading where the AI picked the fax number, so the check has something to catch. */
export const JUDGE_SAMPLE = "L04";

export interface CapturedReading {
  reading: Reading;
  model: string;
  capturedAt: string;
}

let cache: Promise<Record<string, CapturedReading>> | null = null;

export function sampleReading(id: string): Promise<CapturedReading | null> {
  cache ??= fetch("/samples/readings.json").then((r) => (r.ok ? r.json() : {}));
  return cache.then((all) => all[id] ?? null).catch(() => null);
}
