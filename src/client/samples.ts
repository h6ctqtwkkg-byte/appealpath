// The three demo letters (fictional, from test-letters/). Their readings in public/samples/readings.json are real
// model answers captured ahead of time by scripts/capture-samples.mjs, so a sample never spends neurons and always works.
import type { Answers, Reading } from "../shared/types";

export interface Sample {
  id: string;
  label: string;
  answers: Answers;
}

export const SAMPLES: Sample[] = [
  {
    id: "L01",
    label: "MRI: no prior authorization",
    answers: { plan: "job", careHappened: false, doctorSaysHarm: "no", officeResubmitted: "no", state: "AR" },
  },
  {
    id: "L02",
    label: "Physical therapy: not medically necessary",
    answers: { plan: "marketplace", careHappened: true, doctorSaysHarm: "no", officeResubmitted: "no", state: "AR" },
  },
  {
    id: "L03",
    label: "Rehab after a stroke: urgent",
    answers: { plan: "job", careHappened: false, doctorSaysHarm: "yes", officeResubmitted: "no", state: "AR" },
  },
];

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
