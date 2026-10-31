// Screen 3: one next step. Wording in i18n.ts; the outcome comes from src/shared/rules.ts.
import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { deadlineEvent, printedDate } from "../shared/dates";
import { distinctServices } from "../shared/services";
import { EXTERNAL_REVIEW, type Answers, type Decision, type Reading } from "../shared/types";
import type { CheckedField } from "./checks";
import { helpFor } from "./help";
import { STRINGS, useLang, useT } from "./i18n";
import { REASON_INFO } from "./reasons";
import { canSpeak, plainText, speak, stopSpeaking } from "./speak";
import { Trace } from "./Trace";
import { Phone } from "./ui";

/** "Physical therapy" reads wrong mid-sentence; "MRI of the spine" must keep its capitals. */
const inSentence = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s);

/** Letters often say "send it to X, or fax it to Y"; the letter heading only wants X. */
const mailingAddress = (s: string) => s.split(/,?\s*or fax(?: it)?(?: to)?\s*/i)[0]!.trim();

function CallLine({ phone, fallback }: { phone: string | null; fallback: string }) {
  return phone ? <Phone number={phone} /> : <>{fallback}</>;
}

/** A script to read on the phone. In Spanish, the English version follows, since many plans answer in English. */
function Script({ es, en }: { es: string; en: string }) {
  const t = useT().result;
  const lang = useLang();
  return (
    <div class="script">
      <span class="from">{t.sayLabel}</span>
      <span lang={lang}>{lang === "en" ? en : es}</span>
      {lang !== "en" && (
        <>
          <span class="from" style="margin-top: 10px">
            {t.sayEnglish}
          </span>
          <span lang="en">{en}</span>
        </>
      )}
    </div>
  );
}

function Facts({ r, unconfirmed }: { r: Reading; unconfirmed: CheckedField[] }) {
  const t = useT().result;
  return (
    <section class="facts" aria-labelledby="facts-h">
      <dl>
        <div class="row">
          <dt>{t.facts.denied}</dt>
          <dd lang="en">{r.service ?? t.notFound}</dd>
        </div>
        <div class="row">
          <dt>{t.facts.reason}</dt>
          <dd class="q" lang={r.reasonQuote ? "en" : undefined}>
            {r.reasonQuote ? `"${r.reasonQuote}"` : t.noReason}
            {r.reasonQuote && unconfirmed.includes("reason") && <span class="small error-text unconfirmed-note">{t.unconfirmedQuote}</span>}
          </dd>
        </div>
        <div class="row">
          <dt>{t.facts.deadline}</dt>
          <dd class="q" lang={r.deadlineQuote ? "en" : undefined}>
            {r.deadlineQuote ? `"${r.deadlineQuote}"` : t.noDeadline}
          </dd>
        </div>
        {r.appealPhone && (
          <div class="row">
            <dt>{t.facts.call}</dt>
            <dd>
              <Phone number={r.appealPhone} />
            </dd>
          </div>
        )}
        {r.expeditedPhone && r.expeditedPhone !== r.appealPhone && (
          <div class="row">
            <dt>{t.facts.urgentCall}</dt>
            <dd>
              <Phone number={r.expeditedPhone} />
            </dd>
          </div>
        )}
        {r.reference && (
          <div class="row">
            <dt>{t.facts.reference}</dt>
            <dd>{r.reference}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function Calendar({ quote }: { quote: string }) {
  const t = useT().calendar;
  const date = printedDate(quote);
  if (!date) return <p class="small muted calendar">{t.relative}</p>;
  function download() {
    const ics = deadlineEvent(date!, t.summary, `"${quote}" (AppealPath prototype: check your letter)`, t.alarm);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "appeal-deadline.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div class="calendar">
      <button class="btn secondary" type="button" onClick={download}>
        {t.add}
      </button>
      <p class="small muted">{t.note}</p>
    </div>
  );
}

function Deadline({ r, decision, unconfirmed }: { r: Reading; decision: Decision; unconfirmed: boolean }) {
  const t = useT().result;
  if (!decision.noDeadline && r.deadlineQuote) {
    return (
      <div class="deadline">
        <span class="from">{t.deadlinePrinted}</span>
        <blockquote class="quote" lang="en">
          {r.deadlineQuote}
        </blockquote>
        {unconfirmed && <p class="small error-text">{t.unconfirmedQuote}</p>}
        <Calendar quote={r.deadlineQuote} />
      </div>
    );
  }
  return (
    <div class="deadline">
      <span class="from">{t.deadlineNoneLabel}</span>
      <p style="margin: 6px 0 0">
        {decision.outcome === "external" ? t.deadlineNoneExternal : t.deadlineNone} <CallLine phone={r.appealPhone} fallback={t.yourPlan} /> {t.deadlineNoneEnd}
      </p>
    </div>
  );
}

/** Always in English: the plan reads it. Only the brackets come from the letter. */
function AppealLetter({ r }: { r: Reading }) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const blank = (v: string | null) => v ?? <span class="blank">&nbsp;</span>;
  return (
    <div class="appeal-letter" id="appeal-letter" lang="en">
      <p>{today}</p>
      <p>
        {r.appealAddress ? (
          mailingAddress(r.appealAddress)
        ) : r.planName ? (
          `${r.planName}, Appeals`
        ) : (
          <>
            Appeals Department
            <br />
            {blank(null)}
          </>
        )}
      </p>
      <p>
        <strong>
          Re: Appeal of denial for {blank(r.memberName)}, Member ID {blank(r.memberId)}, Reference {blank(r.reference)}
        </strong>
      </p>
      <p>
        I am requesting an internal appeal of your decision {r.letterDate ? `dated ${r.letterDate} ` : ""}to deny{" "}
        {r.service ? inSentence(r.service) : blank(null)}.{r.reasonQuote ? ` Your letter gives this reason: "${r.reasonQuote}"` : ""}
      </p>
      <p>I disagree with this decision. (In your own words: what your doctor said, and why you need this care.)</p>
      <div class="lines" />
      <div class="lines" />
      <div class="lines" />
      <p style="margin-top: 14px">I have attached: ☐ a letter from my doctor ☐ medical records ☐ other: __________</p>
      <p>Please review this decision and send me your answer in writing.</p>
      <p>
        Sincerely,
        <br />
        {blank(r.memberName)}
        <br />
        Your phone number: __________
      </p>
    </div>
  );
}

/** For a medical-judgment denial: a request the patient hands to their doctor. Always in English, like the appeal letter. */
function DoctorNote({ r }: { r: Reading }) {
  const blank = (v: string | null) => v ?? <span class="blank">&nbsp;</span>;
  return (
    <div class="appeal-letter" id="doctor-note" lang="en">
      <p>Dear Dr. {blank(null)},</p>
      <p>
        My health plan{r.planName ? `, ${r.planName},` : ""} denied {r.service ? inSentence(r.service) : blank(null)}.
        {r.reasonQuote ? ` The plan's letter gives this reason: "${r.reasonQuote}"` : ""}
      </p>
      <p>
        I am appealing this decision. Could you write a letter explaining why I need this care? It helps the plan's reviewer to see my diagnosis, the
        treatments I have already tried and how they worked, why this is the right next step for me, and what could happen without it.
      </p>
      {r.deadlineQuote && <p>The plan's letter gives this deadline: "{r.deadlineQuote}"</p>}
      <p>Please send the letter to me{r.appealAddress ? `, or to the plan at ${mailingAddress(r.appealAddress)}` : ""}. Thank you.</p>
      <p>
        Sincerely,
        <br />
        {blank(r.memberName)}
        <br />
        Member ID {blank(r.memberId)}
      </p>
    </div>
  );
}

/** Listen, and send to someone helping you: the headline, why, deadline and steps, read or shared from the phone. */
function Tools() {
  const t = useT().result.tools;
  const lang = useLang();
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => void stopSpeaking(), []);
  const parts = () => [...(toolsRef.current?.closest("main")?.querySelectorAll(".verdict, .emergency, .deadline, ol.next") ?? [])];

  function listen() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(parts(), lang, () => setSpeaking(false));
  }

  async function send() {
    const text = `${plainText(parts())}

${t.from} ${location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AppealPath", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // The share sheet was closed, or the clipboard isn't allowed: nothing to undo.
    }
  }

  return (
    <div class="result-tools" ref={toolsRef}>
      {canSpeak() && (
        <button class="btn secondary" type="button" aria-pressed={speaking} onClick={listen}>
          {speaking ? t.stop : t.listen}
        </button>
      )}
      <button class="btn secondary" type="button" onClick={send}>
        {t.share}
      </button>
      <p class="small muted" role="status">
        {copied ? t.copied : t.note}
      </p>
    </div>
  );
}

/** Prints only one letter: a standalone copy at the top of the page, so the hidden rest of the app takes no space. */
function printLetter(id = "appeal-letter") {
  const letter = document.getElementById(id);
  if (!letter) return;
  const root = document.createElement("div");
  root.id = "print-root";
  root.appendChild(letter.cloneNode(true));
  document.body.appendChild(root);
  document.body.classList.add("print-letter");
  const done = () => {
    document.body.classList.remove("print-letter");
    root.remove();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

export function Result(props: {
  decision: Decision;
  reading: Reading;
  answers: Answers;
  sample: boolean;
  /** Straight from the form: no letter was read, so there are no facts to show. */
  early: boolean;
  /** Values the second reader couldn't confirm on the photo. */
  unconfirmed: CheckedField[];
  onEdit: () => void;
  onRestart: () => void;
}) {
  const all = useT();
  const t = all.result;
  const lang = useLang();
  const en = STRINGS.en.result;
  const { decision: d, reading: r, answers } = props;
  const help = helpFor(answers, d.outcome, all);
  const who = r.provider ?? t.yourOffice;
  const service = r.service ? inSentence(r.service) : null;
  const info = REASON_INFO[lang][r.category];

  let headline: string;
  let why: string;
  let steps: JSX.Element[];

  switch (d.outcome) {
    case "fix": {
      const ask = t.fixAsk[r.category] ?? t.fixAskDefault;
      const askEn = en.fixAsk[r.category] ?? en.fixAskDefault;
      headline = t.fix.headline;
      why = t.fix.why;
      steps = [
        <li key="1">
          {t.fix.call(who)}
          <Script
            es={t.fix.script(service, r.memberName, r.reasonQuote, ask, r.reference)}
            en={en.fix.script(service, r.memberName, r.reasonQuote, askEn, r.reference)}
          />
        </li>,
        <li key="2">{t.fix.step2}</li>,
        <li key="3">{t.fix.step3}</li>,
      ];
      break;
    }
    case "appeal":
      headline = t.appeal.headline;
      why = t.appeal.why;
      steps = [
        <li key="1">{t.appeal.step1(r.category, service)}</li>,
        <li key="2">
          {t.appeal.step2}{" "}
          {r.appealAddress ? (
            <span class="q" lang="en">
              {r.appealAddress}
            </span>
          ) : (
            t.appeal.step2Fallback
          )}
          .
        </li>,
        <li key="3">{t.appeal.step3}</li>,
        <li key="4">{EXTERNAL_REVIEW.includes(r.category) ? t.appeal.step4 : t.appeal.step4Ask}</li>,
      ];
      break;
    case "urgent":
      headline = t.urgent.headline;
      why = t.urgent.why;
      steps = [
        <li key="1">
          {r.expeditedPhone ? t.urgent.callExpedited : r.appealPhone ? t.urgent.callAppeals : t.urgent.call}{" "}
          <CallLine phone={r.expeditedPhone ?? r.appealPhone} fallback={t.numberOnLetter} />
          {r.expeditedPhone || r.appealPhone ? "," : ""} {t.urgent.andSay}
          <Script es={t.urgent.script(service, r.memberName, r.reference)} en={en.urgent.script(service, r.memberName, r.reference)} />
        </li>,
        <li key="2">
          {t.urgent.step2(who)}
          {answers.state === "AR" && (
            <>
              {" "}
              {t.urgent.step2Ar}{" "}
              <a href="https://insurance.arkansas.gov/consumer-assistance/consumer-services/external-review/" target="_blank" rel="noopener" lang="en">
                {t.urgent.formName}
              </a>
              .
            </>
          )}
        </li>,
        <li key="3">{t.urgent.step3}</li>,
      ];
      break;
    case "external":
      headline = t.external.headline;
      why = t.external.why;
      steps = [
        <li key="1">
          {EXTERNAL_REVIEW.includes(r.category) ? t.external.stepEligible : t.external.stepAsk}{" "}
          {r.appealPhone && (
            <>
              (<Phone number={r.appealPhone} />)
            </>
          )}
        </li>,
        <li key="2">{t.external.step2}</li>,
        <li key="3">{t.external.step3}</li>,
        <li key="4">{t.external.step4}</li>,
      ];
      break;
    case "guard_plan":
      headline = t.guardPlan.headline;
      why = t.guardPlan.why;
      steps = [
        <li key="1">
          {t.guardPlan.call} <CallLine phone={r.appealPhone} fallback={t.numberOnLetter} /> {t.guardPlan.ask}
        </li>,
        <li key="2">{t.guardPlan.urgent}</li>,
        <li key="3">{t.guardPlan.step2}</li>,
      ];
      break;
    case "guard_unclear":
      headline = t.guardUnclear.headline;
      why = t.guardUnclear.why;
      steps = [
        <li key="1">
          {t.guardUnclear.call} <CallLine phone={r.appealPhone} fallback={t.numberOnLetter} /> {t.guardUnclear.ask}
        </li>,
        <li key="2">{t.guardUnclear.step2}</li>,
        <li key="3">{t.guardUnclear.step3}</li>,
      ];
      break;
  }

  return (
    <main class="wrap" id="main">
      {props.sample && <p class="sample-tag">{t.sampleTag}</p>}
      <section class={`verdict ${d.outcome}`} aria-labelledby="verdict-h">
        <div class="kicker">{t.kicker[d.outcome]}</div>
        <h1 id="verdict-h">{headline}</h1>
        <p>{why}</p>
      </section>
      <Tools />

      {d.outcome === "urgent" && <p class="emergency">{t.urgent.emergency}</p>}
      {props.unconfirmed.includes("phone") && r.appealPhone && (
        <div class="notice">
          <p>
            <strong>{r.appealPhone}</strong>: {t.unconfirmed}
          </p>
        </div>
      )}
      {d.outcome === "urgent" && props.unconfirmed.includes("expedited") && r.expeditedPhone && (
        <div class="notice">
          <p>
            <strong>{r.expeditedPhone}</strong>: {t.unconfirmed}
          </p>
        </div>
      )}
      {distinctServices(r.deniedServices).length > 1 && (
        <div class="notice">
          <p>{t.several(service)}</p>
        </div>
      )}
      {d.askDoctor && d.outcome !== "guard_plan" && (
        <div class="notice">
          <p>{t.askDoctor}</p>
        </div>
      )}
      {(d.outcome === "fix" || d.outcome === "appeal" || d.outcome === "guard_unclear") && answers.earlierAppeal === "not_sure" && (
        <div class="notice">
          <p>{t.earlierNote}</p>
        </div>
      )}
      {(d.outcome === "appeal" || d.outcome === "urgent" || d.outcome === "external") && <Deadline r={r} decision={d} unconfirmed={props.unconfirmed.includes("deadline")} />}

      <h2>{t.whatToDo}</h2>
      <ol class="next">{steps}</ol>
      {d.outcome === "fix" && (
        <>
          <Deadline r={r} decision={d} unconfirmed={props.unconfirmed.includes("deadline")} />
          <p class="small fix-keep">{t.fix.keep}</p>
        </>
      )}

      <Trace answers={answers} reading={r} decision={d} />

      {d.outcome !== "guard_plan" && (
        <section class="reason-info" aria-labelledby="reason-means-h">
          <h3 id="reason-means-h">{all.reason.means}</h3>
          <p>{info.means}</p>
          <h3>{all.reason.helps}</h3>
          <p>{info.helps}</p>
          <p class="small muted">{all.reason.note}</p>
        </section>
      )}

      {d.outcome === "appeal" && answers.plan === "job" && <p class="muted small">{t.appeal.hr}</p>}

      {d.outcome === "appeal" && (
        <>
          <h2>{t.appeal.letterTitle}</h2>
          <p class="muted small">
            {t.appeal.letterNote} {t.appeal.letterDated(r.letterDate)} {t.appeal.letterLanguage}
          </p>
          {r.reasonQuote && props.unconfirmed.includes("reason") && <p class="small error-text">{t.unconfirmedReasonLetter}</p>}
          <AppealLetter r={r} />
          <div class="row-actions">
            <button class="btn" type="button" onClick={() => printLetter()}>
              {t.appeal.print}
            </button>
          </div>
        </>
      )}

      {(d.outcome === "appeal" || d.outcome === "external") && EXTERNAL_REVIEW.includes(r.category) && (
        <>
          <h2>{t.doctor.title}</h2>
          <p class="muted small">{t.doctor.note}</p>
          <DoctorNote r={r} />
          <div class="row-actions">
            <button class="btn secondary" type="button" onClick={() => printLetter("doctor-note")}>
              {t.doctor.print}
            </button>
          </div>
        </>
      )}

      {!props.early && (
        <>
          <h2 id="facts-h">{t.factsTitle}</h2>
          <Facts r={r} unconfirmed={props.unconfirmed} />
        </>
      )}

      <h2>{t.helpTitle}</h2>
      {all.help.englishOnly && <p class="small muted">{all.help.englishOnly}</p>}
      <ul class="help-list">
        {help.map((h) => (
          <li key={h.who}>
            <span class="who">{h.who}</span>
            {h.what}
            {h.phone && (
              <>
                {" "}
                <Phone number={h.phone} />
              </>
            )}
            {h.href && (
              <>
                {" · "}
                <a href={h.href} target="_blank" rel="noopener">
                  {h.linkText}
                </a>
              </>
            )}
          </li>
        ))}
      </ul>

      <div class="row-actions">
        <button class="btn secondary" type="button" onClick={props.onEdit}>
          {props.early ? t.editAnswers : t.edit}
        </button>
        <button class="btn secondary" type="button" onClick={props.onRestart}>
          {t.restart}
        </button>
      </div>
    </main>
  );
}
