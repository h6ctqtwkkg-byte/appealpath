// Screen 2: always shown. The user checks the deadline and the reason against the letter before any next step, with the
// second reader (Tesseract, on the device) saying whether the AI's words are really on the photo, and where.
// prep/READER-TEST.md: the model rated itself 100% sure on a quote it got wrong, so nothing here is skipped on confidence.
import { useRef, useState } from "preact/hooks";
import { FOUND, findPhone, findQuote, type Box } from "../shared/match";
import { distinctServices } from "../shared/services";
import { CATEGORIES, type Answers, type Category, type Reading } from "../shared/types";
import { useT } from "./i18n";
import type { Photo } from "./image";
import type { OcrResult } from "./ocr";
import { STATES } from "./states";
import { Choice, LetterImage } from "./ui";

type Source = "ai" | "sample" | "manual";
export type OcrState = { status: "none" | "running" | "failed" } | { status: "done"; result: OcrResult };
type Verdict = "exact" | "close" | "notFound" | "fax";

/** Enough rows to show a copied sentence without scrolling inside the box on a phone. */
const rowsFor = (text: string | null) => Math.min(8, Math.max(2, Math.ceil((text?.length ?? 0) / 32)));

function quoteVerdict(text: string | null, ocr: OcrState): { verdict: Verdict; boxes: Box[] } | null {
  if (!text?.trim() || ocr.status !== "done") return null;
  const m = findQuote(text, ocr.result.words);
  if (!m || m.score < FOUND) return { verdict: "notFound", boxes: m?.boxes ?? [] };
  return { verdict: m.exact ? "exact" : "close", boxes: m.boxes };
}

function phoneVerdict(text: string | null, ocr: OcrState): { verdict: Verdict; boxes: Box[] } | null {
  if (!text?.trim() || ocr.status !== "done") return null;
  const m = findPhone(text, ocr.result.words);
  if (!m) return { verdict: "notFound", boxes: [] };
  return { verdict: m.fax ? "fax" : "exact", boxes: m.boxes };
}

function SecondCheck(props: { id: string; ocr: OcrState; result: { verdict: Verdict; boxes: Box[] } | null; onShow: (boxes: Box[]) => void; active: boolean }) {
  const t = useT().second;
  if (props.ocr.status === "none") return null;
  if (props.ocr.status === "running") return <p class="second running" id={props.id}>{t.running}</p>;
  if (props.ocr.status === "failed") return <p class="second warn" id={props.id}>{t.failed}</p>;
  if (!props.result) return null;
  const { verdict, boxes } = props.result;
  const ok = verdict === "exact";
  return (
    <p class={ok ? "second ok" : "second warn"}>
      <span class="mark" aria-hidden="true">
        {ok ? "✓" : "!"}
      </span>
      <span id={props.id}>{t[verdict]}</span>
      {boxes.length > 0 && (
        <button class="linkish" type="button" aria-pressed={props.active} onClick={() => props.onShow(boxes)}>
          {props.active ? t.shown : t.show}
        </button>
      )}
    </p>
  );
}

function TextField(props: { id: string; label: string; value: string | null; onInput: (v: string | null) => void; help?: string; quote?: boolean; checkedBy?: string }) {
  const Tag = props.quote ? "textarea" : "input";
  const helpId = [props.help ? `${props.id}-help` : "", props.checkedBy ?? ""].filter(Boolean).join(" ") || undefined;
  return (
    <div class={props.value ? "field" : "field missing"}>
      <label for={props.id}>{props.label}</label>
      <Tag
        id={props.id}
        type={props.quote ? undefined : "text"}
        class={props.quote ? "quote-input" : undefined}
        lang={props.quote ? "en" : undefined}
        rows={props.quote ? rowsFor(props.value) : undefined}
        aria-describedby={helpId}
        value={props.value ?? ""}
        onInput={(e: Event) => props.onInput((e.currentTarget as HTMLInputElement).value || null)}
      />
      {props.help && (
        <p class="help" id={`${props.id}-help`}>
          {props.help}
        </p>
      )}
    </div>
  );
}

export function Check(props: {
  reading: Reading;
  setReading: (r: Reading) => void;
  photo: Photo | null;
  ocr: OcrState;
  answers: Partial<Answers>;
  source: Source;
  capturedAt?: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const all = useT();
  const t = all.check;
  const { reading: r, setReading, ocr } = props;
  const set = <K extends keyof Reading>(k: K, v: Reading[K]) => setReading({ ...r, [k]: v });
  const manual = props.source === "manual";
  const services = distinctServices(r.deniedServices);
  const several = services.length > 1;
  const a = props.answers;
  const parts = t.answerParts;
  const answersLine =
    a.plan && a.careHappened !== undefined && a.doctorSaysHarm && a.officeResubmitted && a.state
      ? [
          parts.plan[a.plan],
          parts.care[a.careHappened ? "yes" : "no"],
          parts.harm[a.doctorSaysHarm],
          parts.resubmitted[a.officeResubmitted],
          STATES.find(([code]) => code === a.state)?.[1] ?? a.state,
        ].join(" · ")
      : null;
  // Decided once, so typing a deadline into the "not found" box doesn't swap the box out from under the cursor.
  const [deadlineFound] = useState(r.deadlineQuote !== null);
  const [highlight, setHighlight] = useState<{ field: string; boxes: Box[] } | null>(null);
  const [letterOpen, setLetterOpen] = useState(typeof window !== "undefined" && window.innerWidth >= 760);
  const letterRef = useRef<HTMLDetailsElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoomBoxes, setZoomBoxes] = useState<Box[]>([]);
  const ocrSize = ocr.status === "done" ? { width: ocr.result.width, height: ocr.result.height } : {};

  /** The whole letter at full width, with the highlight scrolled into view. */
  function openFull(boxes: Box[]) {
    setZoomBoxes(boxes);
    dialogRef.current?.showModal();
    requestAnimationFrame(() => dialogRef.current?.querySelector(".hl")?.scrollIntoView({ block: "center" }));
  }

  const deadlineCheck = quoteVerdict(r.deadlineQuote, ocr);
  const reasonCheck = quoteVerdict(r.reasonQuote, ocr);
  const phoneCheck = phoneVerdict(r.appealPhone, ocr);

  function show(field: string, boxes: Box[]) {
    setHighlight({ field, boxes });
    setLetterOpen(true);
    openFull(boxes);
  }

  const second = (field: string, result: { verdict: Verdict; boxes: Box[] } | null) => (
    <SecondCheck id={`${field}-check`} ocr={ocr} result={result} active={highlight?.field === field} onShow={(boxes) => show(field, boxes)} />
  );

  return (
    <main class="wrap wide" id="main">
      <h1>{manual ? t.titleManual : t.titleAi}</h1>
      <p class="lede">{manual ? t.ledeManual : t.ledeAi}</p>
      {props.source === "sample" && <p class="sample-tag">{t.sampleTag(props.capturedAt)}</p>}
      {answersLine && (
        <p class="answers-line">
          <strong>{t.answersLabel}</strong> {answersLine}{" "}
          <button class="linkish" type="button" onClick={props.onBack}>
            {t.answersChange}
          </button>
        </p>
      )}
      {!r.isDenial && !manual && (
        <div class="notice" role="alert">
          <p>{t.notDenial}</p>
        </div>
      )}
      {ocr.status !== "none" && <p class="small muted">{all.second.about}</p>}
      <p class="visually-hidden" role="status">
        {ocr.status === "done"
          ? (() => {
              const results = [deadlineCheck, reasonCheck, phoneCheck].filter((x) => x !== null);
              return all.second.summary(results.filter((x) => x!.verdict === "exact").length, results.length);
            })()
          : ""}
      </p>

      <div class={props.photo ? "check-layout with-photo" : "check-layout"}>
        {props.photo && (
          <details class="letter-view" open={letterOpen} ref={letterRef} onToggle={(e) => setLetterOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>{t.showLetter}</summary>
            <button class="letter-open" type="button" aria-label={t.openFull} onClick={() => openFull(highlight?.boxes ?? [])}>
              <LetterImage src={props.photo.preview} alt="" boxes={highlight?.boxes} {...ocrSize} />
            </button>
          </details>
        )}
        {props.photo && (
          <dialog
            class="letter-dialog"
            ref={dialogRef}
            aria-label={t.fullTitle}
            onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
          >
            <div class="dialog-bar">
              <strong>{t.fullTitle}</strong>
              <button class="btn secondary" type="button" onClick={() => dialogRef.current?.close()}>
                {t.close}
              </button>
            </div>
            <div class="dialog-body">
              <LetterImage src={props.photo.preview} alt={t.fullTitle} boxes={zoomBoxes} {...ocrSize} />
            </div>
          </dialog>
        )}

        <div>
          {deadlineFound || manual ? (
            <>
              <TextField
                id="deadline"
                label={t.deadlineLabel}
                value={r.deadlineQuote}
                onInput={(v) => set("deadlineQuote", v)}
                quote
                help={manual ? t.deadlineHelpManual : t.deadlineHelpAi}
                checkedBy={ocr.status !== "none" ? "deadline-check" : undefined}
              />
              {second("deadline", deadlineCheck)}
            </>
          ) : (
            <div class="field missing">
              <div class="label">{t.deadlineMissingLabel}</div>
              <p style="margin: 0 0 10px">{t.deadlineMissing}</p>
              <label for="deadline-typed" class="small muted">
                {t.deadlineTypeIt}
              </label>
              <input
                id="deadline-typed"
                type="text"
                lang="en"
                value={r.deadlineQuote ?? ""}
                onInput={(e) => set("deadlineQuote", (e.currentTarget as HTMLInputElement).value || null)}
              />
            </div>
          )}

          <div class={r.category === "unclear" ? "field key missing" : "field key"}>
            <label for="reason">{t.reasonLabel}</label>
            <textarea
              id="reason"
              class="quote-input"
              lang="en"
              rows={rowsFor(r.reasonQuote)}
              aria-describedby={[!manual && r.reasonQuote ? "reason-help" : "", ocr.status !== "none" ? "reason-check" : ""].filter(Boolean).join(" ") || undefined}
              placeholder={manual ? t.reasonPlaceholderManual : t.reasonPlaceholderAi}
              value={r.reasonQuote ?? ""}
              onInput={(e) => set("reasonQuote", (e.currentTarget as HTMLTextAreaElement).value || null)}
            />
            {!manual && r.reasonQuote && (
              <p class="help" id="reason-help">
                {t.reasonHelpAi}
              </p>
            )}
            {second("reason", reasonCheck)}
            <Choice<Category>
              name="category"
              legend={<span class="small muted">{manual ? t.categoryLegendManual : t.categoryLegendAi}</span>}
              value={r.category}
              onChange={(v) => set("category", v)}
              options={CATEGORIES.map((c) => ({ value: c, label: all.categories[c] }))}
            />
          </div>

          {several ? (
            <div class="field">
              <Choice
                name="service"
                legend={t.severalLegend}
                value={r.service ?? undefined}
                onChange={(v) => set("service", v)}
                options={services.map((s) => ({ value: s, label: s }))}
              />
            </div>
          ) : (
            <TextField id="service" label={t.serviceLabel} value={r.service} onInput={(v) => set("service", v)} help={r.service ? undefined : t.serviceMissing} />
          )}

          <TextField
            id="phone"
            label={t.phoneLabel}
            value={r.appealPhone}
            onInput={(v) => set("appealPhone", v)}
            help={r.appealPhone ? undefined : t.phoneMissing}
            checkedBy={ocr.status !== "none" ? "phone-check" : undefined}
          />
          {second("phone", phoneCheck)}

          <details class="more">
            <summary>{t.more}</summary>
            <TextField id="reference" label={t.fields.reference} value={r.reference} onInput={(v) => set("reference", v)} />
            <TextField id="plan" label={t.fields.plan} value={r.planName} onInput={(v) => set("planName", v)} />
            <TextField id="member" label={t.fields.member} value={r.memberName} onInput={(v) => set("memberName", v)} />
            <TextField id="memberid" label={t.fields.memberId} value={r.memberId} onInput={(v) => set("memberId", v)} />
            <TextField id="date" label={t.fields.date} value={r.letterDate} onInput={(v) => set("letterDate", v)} />
            <TextField id="address" label={t.fields.address} value={r.appealAddress} onInput={(v) => set("appealAddress", v)} />
            <TextField id="provider" label={t.fields.provider} value={r.provider} onInput={(v) => set("provider", v)} />
            <TextField id="expedited" label={t.fields.expedited} value={r.expeditedPhone} onInput={(v) => set("expeditedPhone", v)} />
          </details>

          <div class="actions">
            <button class="btn block" type="button" onClick={props.onConfirm}>
              {t.confirm}
            </button>
            <div class="alt">
              <button class="linkish" type="button" onClick={props.onBack}>
                {t.back}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
