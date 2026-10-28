// Screen 1: the letter photo and the five questions.
import { useState, type Dispatch, type StateUpdater } from "preact/hooks";
import type { Answers } from "../shared/types";
import { prepare, type Photo } from "./image";
import { SAMPLES } from "./samples";
import { STATES } from "./states";
import { Choice } from "./ui";

export type Draft = Partial<Answers>;

const MISSING_LABELS: [keyof Answers, string][] = [
  ["plan", "what kind of plan it is"],
  ["careHappened", "whether the care has happened"],
  ["doctorSaysHarm", "what your doctor said"],
  ["officeResubmitted", "whether the office resubmitted"],
  ["state", "your state"],
];

export function missingAnswers(draft: Draft): string[] {
  return MISSING_LABELS.filter(([k]) => draft[k] === undefined || draft[k] === "").map(([, label]) => label);
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
  const { draft, setDraft, photo } = props;
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [tried, setTried] = useState<"read" | "manual" | null>(null);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const missing = missingAnswers(draft);

  async function pick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      props.setPhoto(await prepare(file));
    } catch {
      props.setPhoto(null);
      setPhotoError("We couldn't open that photo. Try a JPEG or PNG, or take a new photo.");
    }
  }

  function go(kind: "read" | "manual") {
    setTried(kind);
    if (missing.length || (kind === "read" && !photo)) return;
    if (kind === "read") props.onRead();
    else props.onManual();
  }

  return (
    <main class="wrap">
      <h1>Got a health insurance denial? Find your next step.</h1>
      <p class="lede">Take a photo of the letter and answer 5 questions. You'll get one next step, who to call, and the deadline printed on your letter.</p>

      {props.notice && (
        <div class="notice error" role="alert">
          <p>{props.notice}</p>
        </div>
      )}

      <div class={photo ? "photo has" : "photo"}>
        {photo ? (
          <img class="thumb" src={photo.preview} alt="Your letter" />
        ) : (
          <div class="ph" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </div>
        )}
        <div class="body">
          <strong>{photo ? (photo.sampleId ? `Sample letter ${photo.sampleId}` : "Photo of your letter") : "Photo of your letter"}</strong>
          <p class="hint">{photo ? "Make sure the whole page is in the photo." : "Lay it flat with the whole page in frame. We read it, then throw the photo away."}</p>
          <label class="btn secondary">
            {photo ? "Change photo" : "Take or choose a photo"}
            <input class="visually-hidden" type="file" accept="image/*" onChange={pick} />
          </label>
        </div>
      </div>
      {photoError && <p class="small" style="color: var(--urgent); margin-top: 8px">{photoError}</p>}

      <h2>5 quick questions</h2>
      <Choice
        name="plan"
        legend={<><span class="n">1.</span>What kind of plan is it?</>}
        value={draft.plan}
        onChange={(v) => set("plan", v)}
        options={[
          { value: "job", label: "Through a job" },
          { value: "marketplace", label: "Marketplace (Healthcare.gov or your state's)" },
          { value: "medicare", label: "Medicare" },
          { value: "medicaid", label: "Medicaid" },
          { value: "not_sure", label: "Not sure" },
        ]}
      />
      <Choice
        name="care"
        legend={<><span class="n">2.</span>Has the care already happened?</>}
        value={draft.careHappened === undefined ? undefined : draft.careHappened ? "yes" : "no"}
        onChange={(v) => set("careHappened", v === "yes")}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No, it's still scheduled or needed" },
        ]}
      />
      <Choice
        name="harm"
        legend={<><span class="n">3.</span>Has your doctor said waiting could seriously harm your health?</>}
        value={draft.doctorSaysHarm}
        onChange={(v) => set("doctorSaysHarm", v)}
        row
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_asked", label: "I haven't asked" },
        ]}
      />
      <Choice
        name="resubmitted"
        legend={<><span class="n">4.</span>Has your doctor's office already resubmitted or sent more information?</>}
        value={draft.officeResubmitted}
        onChange={(v) => set("officeResubmitted", v)}
        row
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "dont_know", label: "Don't know" },
        ]}
      />
      <fieldset>
        <legend>
          <label for="state">
            <span class="n">5.</span>What state do you live in?
          </label>
        </legend>
        <select id="state" value={draft.state ?? ""} onChange={(e) => set("state", (e.currentTarget as HTMLSelectElement).value)}>
          <option value="" disabled>
            Choose your state
          </option>
          {STATES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </fieldset>

      {tried && (missing.length > 0 || (tried === "read" && !photo)) && (
        <div class="notice" role="alert">
          {tried === "read" && !photo && <p>Add a photo of your letter, or enter the details by hand.</p>}
          {missing.length > 0 && <p>Still needed: {missing.join(", ")}.</p>}
        </div>
      )}

      <div class="actions">
        <button class="btn block" type="button" onClick={() => go("read")}>
          Read my letter
        </button>
        <div class="alt">
          <button class="linkish" type="button" onClick={() => go("manual")}>
            No photo? Enter the details by hand
          </button>
        </div>
      </div>

      <div class="samples">
        <p>Just looking? Try a fictional sample letter. It fills in the photo and the answers.</p>
        <div class="sample-chips">
          {SAMPLES.map((s) => (
            <button class="chip" type="button" key={s.id} onClick={() => props.onSample(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
