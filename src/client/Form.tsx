// Screen 1: the letter photo and the five questions.
import { useState, type Dispatch, type StateUpdater } from "preact/hooks";
import type { Answers } from "../shared/types";
import { useT, type Strings } from "./i18n";
import { prepare, type Photo } from "./image";
import { SAMPLES } from "./samples";
import { STATES } from "./states";
import { Choice } from "./ui";

export type Draft = Partial<Answers>;

const ORDER: (keyof Answers)[] = ["plan", "careHappened", "doctorSaysHarm", "officeResubmitted", "state"];

export function missingAnswers(draft: Draft, t: Strings): string[] {
  return ORDER.filter((k) => draft[k] === undefined || draft[k] === "").map((k) => t.form.missing[k]);
}

export function Form(props: {
  draft: Draft;
  setDraft: Dispatch<StateUpdater<Draft>>;
  photo: Photo | null;
  setPhoto: (p: Photo | null) => void;
  onRead: () => void;
  onManual: () => void;
  onSample: (id: string) => void;
  notice: string | null;
}) {
  const t = useT();
  const f = t.form;
  const { draft, setDraft, photo } = props;
  const [photoError, setPhotoError] = useState(false);
  const [tried, setTried] = useState<"read" | "manual" | null>(null);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const missing = missingAnswers(draft, t);

  async function pick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    setPhotoError(false);
    try {
      props.setPhoto(await prepare(file));
    } catch {
      props.setPhoto(null);
      setPhotoError(true);
    }
  }

  function go(kind: "read" | "manual") {
    setTried(kind);
    if (missing.length || (kind === "read" && !photo)) return;
    if (kind === "read") props.onRead();
    else props.onManual();
  }

  return (
    <main class="wrap" id="main">
      <h1>{f.title}</h1>
      <p class="lede">{f.lede}</p>
      <p class="try-top">
        {f.tryTop}{" "}
        <a
          href="#samples"
          onClick={(e) => {
            e.preventDefault();
            const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.getElementById("samples")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
            (document.querySelector("#samples .chip") as HTMLElement | null)?.focus({ preventScroll: true });
          }}
        >
          {f.tryTopLink}
        </a>
      </p>

      {props.notice && (
        <div class="notice error" role="alert">
          <p>{props.notice}</p>
        </div>
      )}

      <div class={photo ? "photo has" : "photo"}>
        {photo ? (
          <img class="thumb" src={photo.preview} alt="" />
        ) : (
          <div class="ph" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </div>
        )}
        <div class="body">
          <strong id="photo-title">{photo?.sampleId ? f.sampleTitle(photo.sampleId) : f.photoTitle}</strong>
          <p class="hint">{photo ? f.photoHintHas : f.photoHintEmpty}</p>
          <label class="btn secondary">
            {photo ? f.photoChange : f.photoPick}
            <input class="visually-hidden" type="file" accept="image/*" aria-describedby="photo-title" onChange={pick} />
          </label>
        </div>
      </div>
      {photoError && (
        <p class="small error-text" role="alert">
          {f.photoError}
        </p>
      )}

      <h2>{f.questions}</h2>
      <Choice
        name="plan"
        legend={<><span class="n">1.</span>{f.q1}</>}
        value={draft.plan}
        onChange={(v) => set("plan", v)}
        options={(["job", "marketplace", "medicare", "medicaid", "not_sure"] as const).map((v) => ({ value: v, label: f.plans[v] }))}
      />
      <Choice
        name="care"
        legend={<><span class="n">2.</span>{f.q2}</>}
        value={draft.careHappened === undefined ? undefined : draft.careHappened ? "yes" : "no"}
        onChange={(v) => set("careHappened", v === "yes")}
        options={[
          { value: "yes", label: f.yes },
          { value: "no", label: f.careNo },
        ]}
      />
      <Choice
        name="harm"
        legend={<><span class="n">3.</span>{f.q3}</>}
        value={draft.doctorSaysHarm}
        onChange={(v) => set("doctorSaysHarm", v)}
        row
        options={[
          { value: "yes", label: f.yes },
          { value: "no", label: f.no },
          { value: "not_asked", label: f.notAsked },
        ]}
      />
      <Choice
        name="resubmitted"
        legend={<><span class="n">4.</span>{f.q4}</>}
        value={draft.officeResubmitted}
        onChange={(v) => set("officeResubmitted", v)}
        row
        options={[
          { value: "yes", label: f.yes },
          { value: "no", label: f.no },
          { value: "dont_know", label: f.dontKnow },
        ]}
      />
      <div class="question">
        <label for="state" class="q-label">
          <span class="n">5.</span>
          {f.q5}
        </label>
        <select id="state" value={draft.state ?? ""} onChange={(e) => set("state", (e.currentTarget as HTMLSelectElement).value)}>
          <option value="" disabled>
            {f.chooseState}
          </option>
          {STATES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {tried && (missing.length > 0 || (tried === "read" && !photo)) && (
        <div class="notice" role="alert">
          {tried === "read" && !photo && <p>{f.needPhoto}</p>}
          {missing.length > 0 && <p>{f.stillNeeded(missing.join(", "))}</p>}
        </div>
      )}

      {missing.length > 0 && !tried && (
        <p class="small muted" id="answer-first">
          {f.answerFirst}
        </p>
      )}
      <div class="actions">
        <button class="btn block" type="button" aria-describedby={missing.length > 0 ? "answer-first" : undefined} onClick={() => go("read")}>
          {f.read}
        </button>
        <div class="alt">
          <button class="linkish" type="button" aria-describedby={missing.length > 0 ? "answer-first" : undefined} onClick={() => go("manual")}>
            {f.manual}
          </button>
        </div>
      </div>

      <section class="samples" id="samples" aria-labelledby="samples-h">
        <p id="samples-h">{f.samplesIntro}</p>
        <div class="sample-chips">
          {SAMPLES.map((s) => (
            <button class="chip" type="button" key={s.id} onClick={() => props.onSample(s.id)}>
              {f.samples[s.id]}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
