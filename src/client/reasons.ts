// What each kind of denial reason means, in plain words, and what usually helps. Fixed text, not AI: the same reason
// always gets the same explanation. General information only, never a promise about the outcome.
import type { Category } from "../shared/types";
import type { Lang } from "./i18n";

export interface ReasonInfo {
  means: string;
  helps: string;
}

export const REASON_INFO: Record<Lang, Record<Category, ReasonInfo>> = {
  en: {
    prior_auth_missing: {
      means: "Your plan needed to approve this care ahead of time, and it never got a request from your doctor's office.",
      helps: "The office can usually send the request now. Ask them to tell you once it's been sent.",
    },
    missing_info: {
      means: "The plan asked for records or paperwork and didn't get everything it needed to decide.",
      helps: "Find out exactly what's missing, then make sure the office sends it and keeps a record of when.",
    },
    billing_error: {
      means: "Something on the claim, like a code, didn't match the care you got. It's a paperwork problem, not a decision about your care.",
      helps: "The office's billing staff can correct the claim and send it again.",
    },
    not_medically_necessary: {
      means: "The plan's reviewer decided the care isn't needed under the plan's own rules.",
      helps: "A letter from your doctor explaining why you need this care is the main thing to send with your appeal.",
    },
    not_covered: {
      means: "Your plan's documents list this as something the plan doesn't pay for.",
      helps: "You can still appeal. Ask the plan which part of your plan documents it's relying on.",
    },
    out_of_network: {
      means: "The doctor or facility isn't in your plan's network of providers.",
      helps: "If there was no in-network option, or it was an emergency, say so in your appeal.",
    },
    experimental: {
      means: "The plan considers this treatment unproven or still being studied.",
      helps: "Your doctor can explain why it's the right option for you and send any studies that support it.",
    },
    unclear: {
      means: "Your letter doesn't say clearly why it was denied.",
      helps: "Ask the plan to give you the specific reason in writing.",
    },
  },
  es: {
    prior_auth_missing: {
      means: "Su plan tenía que aprobar esta atención por adelantado y nunca recibió la solicitud del consultorio de su médico.",
      helps: "Normalmente el consultorio puede enviar la solicitud ahora. Pídales que le avisen cuando la hayan enviado.",
    },
    missing_info: {
      means: "El plan pidió expedientes o documentos y no recibió todo lo que necesitaba para decidir.",
      helps: "Averigüe exactamente qué falta y asegúrese de que el consultorio lo envíe y anote cuándo lo hizo.",
    },
    billing_error: {
      means: "Algo en el reclamo, como un código, no coincidió con la atención que recibió. Es un problema de papeleo, no una decisión sobre su atención.",
      helps: "El personal de facturación del consultorio puede corregir el reclamo y enviarlo de nuevo.",
    },
    not_medically_necessary: {
      means: "El revisor del plan decidió que la atención no es necesaria según las reglas propias del plan.",
      helps: "Lo más importante que puede enviar con su apelación es una carta de su médico que explique por qué necesita esta atención.",
    },
    not_covered: {
      means: "Los documentos de su plan dicen que el plan no paga esto.",
      helps: "Aun así puede apelar. Pregúntele al plan en qué parte de los documentos de su plan se basa.",
    },
    out_of_network: {
      means: "El médico o el centro no está en la red de proveedores de su plan.",
      helps: "Si no había una opción dentro de la red, o si fue una emergencia, dígalo en su apelación.",
    },
    experimental: {
      means: "El plan considera que este tratamiento no está comprobado o que todavía se está estudiando.",
      helps: "Su médico puede explicar por qué es la mejor opción para usted y enviar estudios que lo respalden.",
    },
    unclear: {
      means: "Su carta no dice claramente por qué se denegó.",
      helps: "Pídale al plan que le dé el motivo específico por escrito.",
    },
  },
};
