// Free help, from prep/ROUTING.md (checked on the agencies' own sites, Oct 28, 2026). Arkansas only for v1.
import type { Answers, Outcome } from "../shared/types";
import type { Strings } from "./i18n";

export interface HelpItem {
  who: string;
  what: string;
  phone?: string;
  href?: string;
  linkText?: string;
}

const LINKS = {
  aidConsumer: "https://insurance.arkansas.gov/consumer-assistance/consumer-services/",
  aidExternal: "https://insurance.arkansas.gov/consumer-assistance/consumer-services/external-review/",
  aidContact: "https://insurance.arkansas.gov/contact/",
  ebsa: "https://beta.dol.gov/about/agencies/ebsa/ask-ebsa",
  external: "https://www.healthcare.gov/appeal-insurance-company-decision/external-review/",
};

export function helpFor(answers: Answers, outcome: Outcome, t: Strings): HelpItem[] {
  const h = t.help;
  const aidConsumer: HelpItem = { ...h.aidConsumer, phone: "501-371-2640", href: LINKS.aidConsumer, linkText: h.aidConsumer.link };
  const aidExternal: HelpItem = { ...h.aidExternal, href: LINKS.aidExternal, linkText: h.aidExternal.link };
  const shiip: HelpItem = { ...h.shiip, phone: "501-371-2782", href: LINKS.aidContact, linkText: h.shiip.link };
  const ebsa: HelpItem = { ...h.ebsa, phone: "(866) 444-3272", href: LINKS.ebsa, linkText: h.ebsa.link };
  const otherState: HelpItem = { ...h.otherState, href: LINKS.external, linkText: h.otherState.link };
  const ar = answers.state === "AR";

  if (outcome === "guard_plan") {
    if (answers.plan === "medicare") return ar ? [shiip] : [{ who: h.ship.who, what: h.ship.what }];
    return ar ? [aidConsumer] : [otherState];
  }
  const items = [ar ? aidConsumer : otherState];
  if (outcome === "appeal" && ar) items.push(aidExternal);
  if (answers.plan === "job" && outcome !== "guard_unclear") items.push(ebsa);
  return items;
}
