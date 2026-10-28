// Reads a denial letter photo with Workers AI. Gemma 4 first (about 16 neurons a read in prep/READER-TEST.md);
// Llama 4 Scout once if Gemma's answer won't parse. The model only copies what is printed; src/shared/rules.ts decides.
// Network time is free on the Workers plan; the only CPU spent here is building the request and checking the answer.
import { CATEGORIES, type Category, type Reading } from "./shared/types";

export const GEMMA = "@cf/google/gemma-4-26b-a4b-it";
export const SCOUT = "@cf/meta/llama-4-scout-17b-16e-instruct";
// Gemma usually answers in 4–10 s; a stalled call falls back to Scout instead of making the user wait 30 s.
const GEMMA_TIMEOUT_MS = 15_000;
const SCOUT_TIMEOUT_MS = 25_000;
const MAX_TEXT = 600;
const MAX_SERVICES = 8;

type Schema = Record<string, unknown>;
const str: Schema = { type: "string" };
const nullable = (s: Schema): Schema => ({ anyOf: [s, { type: "null" }] });
const obj = (properties: Record<string, Schema>): Schema => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const text = nullable(str);

/** Property order is generation order: the model looks at the document before it fills anything in. */
export const LETTER_SCHEMA: Schema = obj({
  observations: str,
  is_denial: { type: "boolean" },
  plan_name: text,
  member_name: text,
  member_id: text,
  letter_date: text,
  reference_number: text,
  provider: text,
  denied_services: { type: "array", items: str },
  service_denied: text,
  reason_quote: text,
  reason_category: { type: "string", enum: [...CATEGORIES] },
  deadline_quote: text,
  appeal_phone: text,
  expedited_phone: text,
  appeal_address: text,
});

export const SYSTEM = `You read photos of US health insurance denial letters and explanation-of-benefits statements.
Copy text exactly as printed, word for word. Never calculate, infer or invent a value. If something is not printed, use null.
observations: one short sentence on what kind of document this is.
is_denial: true only if the document denies, or refuses to pay for, at least one service.
denied_services: only services that were denied or paid $0. Lines the plan paid are not denied.
service_denied: the name of the main denied service as printed, in a few words, without dates or explanations.
reason_quote: the sentence or sentences that give the reason for the denial, word for word.
reason_category: prior_auth_missing (prior authorization not received or not obtained), missing_info (records or paperwork missing), billing_error (coding or billing mistake the provider can correct), not_medically_necessary, not_covered (excluded or not a benefit), out_of_network, experimental, or unclear if no clear reason is given. If the letter only gives a code or says to see plan documents, use unclear; never guess a category from the service.
deadline_quote: the sentence that states the appeal deadline, word for word, or null if no deadline is printed.
appeal_phone: the phone number to call for appeals or questions, never a fax number. expedited_phone: a number for urgent or expedited appeals, if one is printed.
appeal_address: the mailing address or fax number for appeals, as printed.
provider: the doctor or office that ordered or requested the denied service (the one that would send paperwork), as printed. If none is named, the facility.`;

export class ReadError extends Error {
  constructor(public kind: "quota" | "busy" | "unreadable" | "unavailable") {
    super(kind);
  }
}

/** Maps a Workers AI error. 3036 = today's free neurons are used up; 3040 = no capacity. */
export function readError(err: unknown): ReadError {
  if (err instanceof ReadError) return err;
  const msg = String((err as Error)?.message ?? err);
  if (msg.includes("3036")) return new ReadError("quota");
  if (msg.includes("3040") || /capacity|busy|timed? ?out|3007/i.test(msg)) return new ReadError("busy");
  return new ReadError("unavailable");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ReadError("busy")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

function messages(imageBase64: string) {
  return [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: [
        { type: "text", text: "Read this letter." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    },
  ];
}

interface Raw {
  content: unknown;
  neurons: number | null;
}

type Run = (model: string, input: unknown, options?: unknown) => Promise<unknown>;

async function runGemma(ai: Ai, imageBase64: string): Promise<Raw> {
  const out = (await withTimeout(
    (ai.run as unknown as Run)(
      GEMMA,
      {
        messages: messages(imageBase64),
        response_format: { type: "json_schema", json_schema: { name: "letter", schema: LETTER_SCHEMA, strict: true } },
        chat_template_kwargs: { enable_thinking: false },
        max_completion_tokens: 1200,
        temperature: 0,
      },
      { rejectIfBusy: true },
    ),
    GEMMA_TIMEOUT_MS,
  )) as { choices?: { message?: { content?: unknown } }[]; usage?: { neurons?: number } };
  return { content: out.choices?.[0]?.message?.content ?? null, neurons: out.usage?.neurons ?? null };
}

async function runScout(ai: Ai, imageBase64: string): Promise<Raw> {
  const out = (await withTimeout(
    (ai.run as unknown as Run)(
      SCOUT,
      {
        messages: messages(imageBase64),
        response_format: { type: "json_schema", json_schema: LETTER_SCHEMA },
        max_tokens: 1200,
        temperature: 0,
      },
      { rejectIfBusy: true },
    ),
    SCOUT_TIMEOUT_MS,
  )) as { response?: unknown; usage?: { neurons?: number } };
  return { content: out.response ?? null, neurons: out.usage?.neurons ?? null };
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.replace(/\s+/g, " ").trim();
  if (!v || /^(null|none|n\/a|not (printed|found|shown))\.?$/i.test(v)) return null;
  return v.slice(0, MAX_TEXT);
}

/** Checks a model answer and turns it into a Reading. Returns null if it isn't a usable answer. */
export function normalize(content: unknown): Reading | null {
  let data: unknown = content;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  if (typeof d.is_denial !== "boolean") return null;

  const category: Category = CATEGORIES.includes(d.reason_category as Category) ? (d.reason_category as Category) : "unclear";
  const deniedServices = (Array.isArray(d.denied_services) ? d.denied_services : [])
    .map(clean)
    .filter((s): s is string => s !== null)
    .slice(0, MAX_SERVICES);
  const service = clean(d.service_denied) ?? deniedServices[0] ?? null;
  if (service && !deniedServices.includes(service)) deniedServices.unshift(service);

  return {
    isDenial: d.is_denial,
    planName: clean(d.plan_name),
    memberName: clean(d.member_name),
    memberId: clean(d.member_id),
    letterDate: clean(d.letter_date),
    reference: clean(d.reference_number),
    deniedServices,
    service,
    reasonQuote: clean(d.reason_quote),
    category,
    deadlineQuote: clean(d.deadline_quote),
    appealPhone: clean(d.appeal_phone),
    expeditedPhone: clean(d.expedited_phone),
    appealAddress: clean(d.appeal_address),
    provider: clean(d.provider),
  };
}

export async function readLetter(ai: Ai, imageBase64: string): Promise<{ reading: Reading; model: string; neurons: number | null }> {
  let neurons = 0;
  try {
    const first = await runGemma(ai, imageBase64);
    neurons += first.neurons ?? 0;
    const reading = normalize(first.content);
    if (reading) return { reading, model: GEMMA, neurons };
  } catch (err) {
    const e = readError(err);
    if (e.kind === "quota") throw e;
  }
  try {
    const second = await runScout(ai, imageBase64);
    neurons += second.neurons ?? 0;
    const reading = normalize(second.content);
    if (reading) return { reading, model: SCOUT, neurons };
    throw new ReadError("unreadable");
  } catch (err) {
    throw readError(err);
  }
}
