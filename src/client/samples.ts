// The demo letters (fictional, from test-letters/). Their readings in public/samples/readings.json are real
// model answers captured ahead of time by scripts/capture-samples.mjs, so a sample never spends neurons and keeps working when the free allowance runs out.
// Their labels are in i18n.ts (form.samples).
import type { Answers, Reading } from "../shared/types";

export interface Sample {
  id: string;
  answers: Answers;
  /** A letter of several pages: public/samples/<id>-p1.jpg, -p2.jpg… instead of <id>.jpg. */
  pages?: number;
}

export const SAMPLES: Sample[] = [
  { id: "L01", answers: { plan: "job", careHappened: false, doctorSaysHarm: "no", officeResubmitted: "no", earlierAppeal: "no", state: "AR" } },
  { id: "L02", answers: { plan: "marketplace", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no", earlierAppeal: "no", state: "AR" } },
  { id: "L04", answers: { plan: "marketplace", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no", earlierAppeal: "no", state: "MO" } },
  { id: "L03", answers: { plan: "job", careHappened: false, doctorSaysHarm: "yes", officeResubmitted: "no", earlierAppeal: "no", state: "AR" } },
  { id: "L09", answers: { plan: "medicare", careHappened: false, doctorSaysHarm: "no", officeResubmitted: "no", earlierAppeal: "no", state: "AR" } },
  { id: "G01", pages: 3, answers: { plan: "job", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no", earlierAppeal: "yes", state: "AR" } },
  { id: "L12", answers: { plan: "job", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "dont_know", earlierAppeal: "no", state: "AR" } },
];

/** The sample "Just looking, or judging?" opens: a saved reading where the AI picked the fax number, so the check has something to catch. */
export const JUDGE_SAMPLE = "L04";

/** The sample's page images, in order. */
export function sampleImages(id: string): string[] {
  const pages = SAMPLES.find((s) => s.id === id)?.pages;
  return pages ? Array.from({ length: pages }, (_, i) => `/samples/${id}-p${i + 1}.jpg`) : [`/samples/${id}.jpg`];
}

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
