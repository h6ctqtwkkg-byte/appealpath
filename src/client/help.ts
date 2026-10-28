// Free help, from prep/ROUTING.md (checked on the agencies' own sites, Oct 28, 2026). Arkansas only for v1.
import type { Answers, Outcome } from "../shared/types";

export interface HelpItem {
  who: string;
  what: string;
  phone?: string;
  href?: string;
  linkText?: string;
}

const AID_CONSUMER: HelpItem = {
  who: "Arkansas Insurance Department, Consumer Services",
  what: "Free help with health insurance denials and appeals.",
  phone: "501-371-2640",
  href: "https://insurance.arkansas.gov/consumer-assistance/consumer-services/",
  linkText: "Consumer Services",
};
const AID_EXTERNAL: HelpItem = {
  who: "Arkansas external review",
  what: "If your plan still says no after the appeal, an independent reviewer can look at it. The forms are on this page.",
  href: "https://insurance.arkansas.gov/consumer-assistance/consumer-services/external-review/",
  linkText: "External review forms",
};
const SHIIP: HelpItem = {
  who: "Arkansas SHIIP",
  what: "Free, one-on-one Medicare counseling.",
  phone: "501-371-2782",
  href: "https://insurance.arkansas.gov/contact/",
  linkText: "Arkansas Insurance Department contacts",
};
const EBSA: HelpItem = {
  who: "U.S. Department of Labor (EBSA)",
  what: "Help with job-based health plans, especially self-funded ones.",
  phone: "(866) 444-3272",
  href: "https://beta.dol.gov/about/agencies/ebsa/ask-ebsa",
  linkText: "Ask EBSA",
};
const OTHER_STATE: HelpItem = {
  who: "Your state's Department of Insurance or Consumer Assistance Program",
  what: "Healthcare.gov links to every state's office from its external review page.",
  href: "https://www.healthcare.gov/appeal-insurance-company-decision/external-review/",
  linkText: "Healthcare.gov: external review",
};

export function helpFor(answers: Answers, outcome: Outcome): HelpItem[] {
  const ar = answers.state === "AR";
  if (outcome === "guard_plan") {
    if (answers.plan === "medicare") {
      return ar ? [SHIIP] : [{ who: "Your state's SHIP (State Health Insurance Assistance Program)", what: "Every state has one. It gives free Medicare counseling." }];
    }
    return ar ? [AID_CONSUMER] : [OTHER_STATE];
  }
  const items = [ar ? AID_CONSUMER : OTHER_STATE];
  if (outcome === "appeal" && ar) items.push(AID_EXTERNAL);
  if (answers.plan === "job" && outcome !== "guard_unclear") items.push(EBSA);
  return items;
}
