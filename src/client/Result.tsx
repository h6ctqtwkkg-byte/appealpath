// Screen 3: one next step. Wording from prep/SCREEN-COPY.md; the outcome comes from src/shared/rules.ts.
import type { JSX } from "preact";
import type { Answers, Decision, Reading } from "../shared/types";
import { helpFor } from "./help";
import { Phone } from "./ui";

const KICKER: Record<Decision["outcome"], string> = {
  fix: "Fix & resubmit",
  appeal: "Appeal",
  urgent: "Urgent review today",
  guard_plan: "Call your plan",
  guard_unclear: "Call your plan",
};

const FIX_ASK: Partial<Record<Reading["category"], string>> = {
  prior_auth_missing: "prior authorization request",
  missing_info: "missing records",
  billing_error: "corrected claim",
};

const or = (value: string | null, fallback: string) => value ?? fallback;

/** "Physical therapy" reads wrong mid-sentence; "MRI of the spine" must keep its capitals. */
const inSentence = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s);

/** Letters often say "send it to X, or fax it to Y"; the letter heading only wants X. */
const mailingAddress = (s: string) => s.split(/,?\s*or fax(?: it)?(?: to)?\s*/i)[0]!.trim();

function CallLine({ phone, fallback = "the number on your letter" }: { phone: string | null; fallback?: string }) {
  return phone ? <Phone number={phone} /> : <>{fallback}</>;
}

function Facts({ r }: { r: Reading }) {
  return (
    <section class="facts" aria-label="What your letter says">
      <dl>
        <div class="row">
          <dt>Denied</dt>
          <dd>{or(r.service, "Not found on the letter")}</dd>
        </div>
        <div class="row">
          <dt>Reason, as written</dt>
          <dd class="q">{r.reasonQuote ? `"${r.reasonQuote}"` : "No clear reason was printed."}</dd>
        </div>
        <div class="row">
          <dt>Your appeal deadline, as printed</dt>
          <dd class="q">{r.deadlineQuote ? `"${r.deadlineQuote}"` : "We didn't find a deadline on your letter."}</dd>
        </div>
        {r.appealPhone && (
          <div class="row">
            <dt>Call</dt>
            <dd>
              <Phone number={r.appealPhone} />
            </dd>
          </div>
        )}
        {r.reference && (
          <div class="row">
            <dt>Reference</dt>
            <dd>{r.reference}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function Deadline({ r, decision }: { r: Reading; decision: Decision }) {
  if (!decision.noDeadline && r.deadlineQuote) {
    return (
      <div class="deadline">
        <span class="from">Your deadline, as printed on your letter</span>
        <blockquote class="quote">{r.deadlineQuote}</blockquote>
      </div>
    );
  }
  return (
    <div class="deadline">
      <span class="from">Your deadline</span>
      <p style="margin: 6px 0 0">
        We didn't find a deadline on your letter. Healthcare.gov says internal appeals must be filed within 180 days of receiving the denial notice. Call{" "}
        <CallLine phone={r.appealPhone} fallback="your plan" /> to confirm yours.
      </p>
    </div>
  );
}

function AppealLetter({ r }: { r: Reading }) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const blank = (v: string | null) => v ?? <span class="blank">&nbsp;</span>;
  return (
    <div class="appeal-letter" id="appeal-letter">
      <p>{today}</p>
      <p>{r.appealAddress ? mailingAddress(r.appealAddress) : r.planName ? `${r.planName}, Appeals` : <>Appeals Department<br />{blank(null)}</>}</p>
      <p>
        <strong>
          Re: Appeal of denial for {blank(r.memberName)}, Member ID {blank(r.memberId)}, Reference {blank(r.reference)}
        </strong>
      </p>
      <p>
        I am requesting an internal appeal of your decision {r.letterDate ? `dated ${r.letterDate} ` : ""}to deny {r.service ? inSentence(r.service) : blank(null)}.
        {r.reasonQuote ? ` Your letter gives this reason: "${r.reasonQuote}"` : ""}
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
        Phone: __________
      </p>
    </div>
  );
}

function printLetter() {
  document.body.classList.add("print-letter");
  const done = () => {
    document.body.classList.remove("print-letter");
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

export function Result(props: { decision: Decision; reading: Reading; answers: Answers; sample: boolean; onEdit: () => void; onRestart: () => void }) {
  const { decision: d, reading: r, answers } = props;
  const help = helpFor(answers, d.outcome);
  const who = or(r.provider, "your doctor's office");
  const service = (fallback: string) => (r.service ? inSentence(r.service) : fallback);
  const member = or(r.memberName, "the patient");
  const ref = r.reference ? ` The reference number is ${r.reference}.` : "";

  let headline: string;
  let why: string;
  let steps: JSX.Element[];

  switch (d.outcome) {
    case "fix":
      headline = "Next step: ask your doctor's office to fix and resubmit";
      why = "Your plan didn't turn down the care itself. Something the office sends is missing or needs correcting.";
      steps = [
        <li key="1">
          Call {who} and read this:
          <div class="script">
            <span class="from">What to say</span>
            Hi, I'm calling about {service("a denied claim")} for {member}. My insurance denied it.
            {r.reasonQuote ? ` The letter says: "${r.reasonQuote}"` : ""} Can you send the {FIX_ASK[r.category] ?? "missing information"}?{ref}
          </div>
        </li>,
        <li key="2">Ask them to tell you when it's been sent.</li>,
        <li key="3">If it's denied again, come back. Your next step will be an appeal.</li>,
      ];
      break;
    case "appeal":
      headline = "Next step: file an appeal";
      why = "You have the right to ask your plan to look at this again.";
      steps = [
        <li key="1">Ask your doctor for a letter explaining why you need {service("this care")}.</li>,
        <li key="2">
          Send the appeal below, with that letter, to {r.appealAddress ? <span class="q">{r.appealAddress}</span> : "the address or fax on your letter"}.
        </li>,
        <li key="3">Keep copies. Write down the date and the name of everyone you talk to.</li>,
        <li key="4">If the plan still says no, you can ask for an independent external review. Healthcare.gov says to request it within 4 months of the final decision.</li>,
      ];
      break;
    case "urgent":
      headline = "Next step: ask for an urgent review today";
      why =
        "The care hasn't happened yet and your doctor says waiting could seriously harm your health, so you can ask for a fast (expedited) appeal now. You can also ask for an outside review at the same time.";
      steps = [
        <li key="1">
          Today, call <CallLine phone={r.expeditedPhone ?? r.appealPhone} /> and say:
          <div class="script">
            <span class="from">What to say</span>
            I'm requesting an expedited appeal for {service("a denied service")} for {member}. My doctor says waiting could seriously harm my health.{ref}
          </div>
        </li>,
        <li key="2">
          Ask {who} to tell the plan, in writing, that waiting could seriously harm your health.
          {answers.state === "AR" && (
            <>
              {" "}
              The Arkansas Insurance Department has a form for this:{" "}
              <a href="https://insurance.arkansas.gov/consumer-assistance/consumer-services/external-review/" target="_blank" rel="noopener">
                Physician Certification of Expedited External Review
              </a>
              .
            </>
          )}
        </li>,
        <li key="3">Get free help (below) if the plan doesn't answer quickly.</li>,
      ];
      break;
    case "guard_plan":
      headline = "This prototype covers job and Marketplace plans";
      why = "Medicare and Medicaid have their own appeal rules, and we don't want to guess.";
      steps = [
        <li key="1">
          Call <CallLine phone={r.appealPhone} /> and ask: "Why exactly was this denied, and what's my deadline to appeal?"
        </li>,
        <li key="2">Write down the date, who you talked to, and what they said.</li>,
      ];
      break;
    case "guard_unclear":
      headline = "We couldn't tell why it was denied";
      why = "Your letter doesn't give a clear reason, so we won't guess one.";
      steps = [
        <li key="1">
          Call <CallLine phone={r.appealPhone} /> and ask two questions: Why exactly was this denied? What's my deadline to appeal?
        </li>,
        <li key="2">Write down the date, who you talked to, and what they said.</li>,
        <li key="3">Come back and enter the reason by hand to get your next step.</li>,
      ];
      break;
  }

  return (
    <main class="wrap">
      {props.sample && <p class="sample-tag">Sample letter: fictional, read ahead of time.</p>}
      <section class={`verdict ${d.outcome}`} aria-labelledby="verdict-h">
        <div class="kicker">{KICKER[d.outcome]}</div>
        <h1 id="verdict-h">{headline}</h1>
        <p>{why}</p>
      </section>

      {d.outcome === "urgent" && <p class="emergency">If this is a medical emergency, call 911. Don't wait on insurance.</p>}
      {d.askDoctor && d.outcome !== "guard_plan" && (
        <div class="notice">
          <p>If you think waiting could harm your health, ask your doctor today. If they agree, the next step can be an urgent review.</p>
        </div>
      )}
      {(d.outcome === "appeal" || d.outcome === "urgent") && <Deadline r={r} decision={d} />}

      <h2>What to do</h2>
      <ol class="next">{steps}</ol>

      {d.outcome === "fix" && r.deadlineQuote && <p class="muted small">Keep your letter. If you end up appealing, its deadline is below.</p>}
      {d.outcome === "appeal" && answers.plan === "job" && (
        <p class="muted small">Job plans: ask HR whether your plan is "self-funded". It changes who handles an outside review.</p>
      )}

      {d.outcome === "appeal" && (
        <>
          <h2>Your appeal letter</h2>
          <p class="muted small">Filled in from your letter. Add your own words in the blank lines, then sign and send it.</p>
          <AppealLetter r={r} />
          <div class="row-actions">
            <button class="btn" type="button" onClick={printLetter}>
              Print my appeal letter
            </button>
          </div>
        </>
      )}

      <h2>What your letter says</h2>
      <Facts r={r} />

      <h2>Free help</h2>
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
          Change what we read
        </button>
        <button class="btn secondary" type="button" onClick={props.onRestart}>
          Start over
        </button>
      </div>
      <p class="small muted" style="margin-top: 14px">
        Why this step? <a href="#how">See how AppealPath decides</a> (rule {d.rule}).
      </p>
    </main>
  );
}
