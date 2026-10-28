// Screen 2: always shown. The user checks the deadline and the reason against the letter before any next step.
// prep/READER-TEST.md: the model rated itself 100% sure on a quote it got wrong, so nothing here is skipped on confidence.
import { useState } from "preact/hooks";
import { CATEGORIES, CATEGORY_LABELS, type Category, type Reading } from "../shared/types";
import type { Photo } from "./image";
import { Choice } from "./ui";

type Source = "ai" | "sample" | "manual";

/** Enough rows to show a copied sentence without scrolling inside the box on a phone. */
const rowsFor = (text: string | null) => Math.min(8, Math.max(2, Math.ceil((text?.length ?? 0) / 32)));

function TextField(props: { id: string; label: string; value: string | null; onInput: (v: string | null) => void; help?: string; quote?: boolean }) {
  const Tag = props.quote ? "textarea" : "input";
  return (
    <div class={props.value ? "field" : "field missing"}>
      <label for={props.id}>{props.label}</label>
      <Tag
        id={props.id}
        type={props.quote ? undefined : "text"}
        class={props.quote ? "quote-input" : undefined}
        rows={props.quote ? rowsFor(props.value) : undefined}
        value={props.value ?? ""}
        onInput={(e: Event) => props.onInput((e.currentTarget as HTMLInputElement).value || null)}
      />
      {props.help && <p class="help">{props.help}</p>}
    </div>
  );
}

export function Check(props: {
  reading: Reading;
  setReading: (r: Reading) => void;
  photo: Photo | null;
  source: Source;
  capturedAt?: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const { reading: r, setReading } = props;
  const set = <K extends keyof Reading>(k: K, v: Reading[K]) => setReading({ ...r, [k]: v });
  const manual = props.source === "manual";
  const several = r.deniedServices.length > 1;
  // Decided once, so typing a deadline into the "not found" box doesn't swap the box out from under the cursor.
  const [deadlineFound] = useState(r.deadlineQuote !== null);

  return (
    <main class="wrap wide">
      <h1>{manual ? "Enter what your letter says" : "Check what we read"}</h1>
      <p class="lede">
        {manual
          ? "Copy the deadline and the reason from your letter. Leave anything blank that isn't printed."
          : "Check the deadline and the reason against your letter. Fix anything that's wrong; we won't guess."}
      </p>
      {props.source === "sample" && (
        <p class="sample-tag">Sample letter: read ahead of time{props.capturedAt ? ` (${props.capturedAt})` : ""}, no AI used just now.</p>
      )}
      {!r.isDenial && !manual && (
        <div class="notice" role="alert">
          <p>This doesn't look like an insurance denial. If it is, fill in the details below.</p>
        </div>
      )}

      <div class={props.photo ? "check-layout with-photo" : "check-layout"}>
        {props.photo && (
          <details class="letter-view" open={typeof window !== "undefined" && window.innerWidth >= 760}>
            <summary>Show your letter</summary>
            <a href={props.photo.preview} target="_blank" rel="noopener">
              <img src={props.photo.preview} alt="Your letter" />
            </a>
          </details>
        )}

        <div>
          {deadlineFound || manual ? (
            <TextField
              id="deadline"
              label="Your appeal deadline, as printed"
              value={r.deadlineQuote}
              onInput={(v) => set("deadlineQuote", v)}
              quote
              help={manual ? "Copy it word for word. If your letter doesn't give one, leave this blank." : "Copied word for word from your letter. Fix it if it doesn't match."}
            />
          ) : (
            <div class="field missing">
              <div class="label">Your appeal deadline</div>
              <p style="margin: 0 0 10px">We didn't find a deadline on your letter.</p>
              <label for="deadline-typed" class="small muted">
                If your letter does show one, type it exactly as printed:
              </label>
              <input
                id="deadline-typed"
                type="text"
                value={r.deadlineQuote ?? ""}
                onInput={(e) => set("deadlineQuote", (e.currentTarget as HTMLInputElement).value || null)}
              />
            </div>
          )}

          <div class={r.category === "unclear" ? "field key missing" : "field key"}>
            <label for="reason">Why it was denied, as printed</label>
            <textarea
              id="reason"
              class="quote-input"
              rows={rowsFor(r.reasonQuote)}
              placeholder={manual ? "Copy the reason from your letter" : "We couldn't find a clear reason. Copy it here if your letter gives one."}
              value={r.reasonQuote ?? ""}
              onInput={(e) => set("reasonQuote", (e.currentTarget as HTMLTextAreaElement).value || null)}
            />
            {!manual && r.reasonQuote && <p class="help">Copied word for word from your letter. Fix it if it doesn't match.</p>}
            <Choice<Category>
              name="category"
              legend={<span class="small muted">{manual ? "Which of these is closest?" : "We read this as:"}</span>}
              value={r.category}
              onChange={(v) => set("category", v)}
              options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
            />
          </div>

          {several ? (
            <div class="field">
              <Choice
                name="service"
                legend="This letter lists more than one denied service. Which one do you want help with?"
                value={r.service ?? undefined}
                onChange={(v) => set("service", v)}
                options={r.deniedServices.map((s) => ({ value: s, label: s }))}
              />
            </div>
          ) : (
            <TextField id="service" label="What was denied" value={r.service} onInput={(v) => set("service", v)} help={r.service ? undefined : "What care or service was denied?"} />
          )}

          <TextField
            id="phone"
            label="Phone number for appeals"
            value={r.appealPhone}
            onInput={(v) => set("appealPhone", v)}
            help={r.appealPhone ? undefined : "Not found. Check the back of your insurance card."}
          />

          <details class="more">
            <summary>More details for your appeal letter</summary>
            <TextField id="reference" label="Reference or claim number" value={r.reference} onInput={(v) => set("reference", v)} />
            <TextField id="plan" label="Plan name" value={r.planName} onInput={(v) => set("planName", v)} />
            <TextField id="member" label="Member name" value={r.memberName} onInput={(v) => set("memberName", v)} />
            <TextField id="memberid" label="Member ID" value={r.memberId} onInput={(v) => set("memberId", v)} />
            <TextField id="date" label="Date of the letter" value={r.letterDate} onInput={(v) => set("letterDate", v)} />
            <TextField id="address" label="Where to send an appeal" value={r.appealAddress} onInput={(v) => set("appealAddress", v)} />
            <TextField id="provider" label="Doctor or clinic" value={r.provider} onInput={(v) => set("provider", v)} />
            <TextField id="expedited" label="Phone for urgent appeals" value={r.expeditedPhone} onInput={(v) => set("expeditedPhone", v)} />
          </details>

          <div class="actions">
            <button class="btn block" type="button" onClick={props.onConfirm}>
              Looks right, show my next step
            </button>
            <div class="alt">
              <button class="linkish" type="button" onClick={props.onBack}>
                Back to the questions
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
