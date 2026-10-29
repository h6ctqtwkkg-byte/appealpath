// Shapes shared by the Worker, the rules and the browser app.

export const PLAN_TYPES = ["job", "marketplace", "medicare", "medicaid", "not_sure"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const CATEGORIES = [
  "prior_auth_missing",
  "missing_info",
  "billing_error",
  "not_medically_necessary",
  "not_covered",
  "out_of_network",
  "experimental",
  "unclear",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Reasons the doctor's office can usually fix by sending or correcting something. */
export const FIX_TYPE: readonly Category[] = ["prior_auth_missing", "missing_info", "billing_error"];
/** Reasons the plan decided on the merits, which only an appeal can change. */
export const APPEAL_TYPE: readonly Category[] = ["not_medically_necessary", "not_covered", "out_of_network", "experimental"];

/** The five questions on the form. */
export interface Answers {
  plan: PlanType;
  careHappened: boolean;
  doctorSaysHarm: "yes" | "no" | "not_asked";
  officeResubmitted: "yes" | "no" | "dont_know";
  /** Two-letter state code. */
  state: string;
}

/** What the AI read from the letter, after the user has checked it. Every text field is copied as printed, or null. */
export interface Reading {
  isDenial: boolean;
  planName: string | null;
  memberName: string | null;
  memberId: string | null;
  letterDate: string | null;
  reference: string | null;
  deniedServices: string[];
  service: string | null;
  reasonQuote: string | null;
  category: Category;
  deadlineQuote: string | null;
  appealPhone: string | null;
  expeditedPhone: string | null;
  appealAddress: string | null;
  provider: string | null;
}

export const EMPTY_READING: Reading = {
  isDenial: true,
  planName: null,
  memberName: null,
  memberId: null,
  letterDate: null,
  reference: null,
  deniedServices: [],
  service: null,
  reasonQuote: null,
  category: "unclear",
  deadlineQuote: null,
  appealPhone: null,
  expeditedPhone: null,
  appealAddress: null,
  provider: null,
};

export type Outcome = "fix" | "appeal" | "urgent" | "guard_plan" | "guard_unclear";

export interface Decision {
  outcome: Outcome;
  /** Which rule fired, 1 to 5, in the order ROUTING.md lists them. */
  rule: 1 | 2 | 3 | 4 | 5;
  /** The user answered "I haven't asked" to the harm question. */
  askDoctor: boolean;
  /** No deadline was printed (or found) on the letter. */
  noDeadline: boolean;
}

/** What POST /api/read returns. */
export type ReadResponse =
  | { ok: true; reading: Reading; model: string; neurons: number | null; ms: number }
  | { ok: false; error: "quota" | "busy" | "rate_limited" | "unreadable" | "too_large" | "bad_request" | "unavailable" };
