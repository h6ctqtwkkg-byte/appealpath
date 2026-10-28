// AppealPath app: letter and questions → check what we read → one next step. "#how" shows how it decides.
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { decide } from "../shared/rules";
import { EMPTY_READING, type Answers, type Decision, type ReadResponse, type Reading } from "../shared/types";
import { Check } from "./Check";
import { Form, missingAnswers, type Draft } from "./Form";
import { How } from "./How";
import type { Photo } from "./image";
import { Result } from "./Result";
import { SAMPLES, sampleReading } from "./samples";
import { Footer, Header, Steps } from "./ui";

type Screen = "form" | "reading" | "check" | "result";
type Source = "ai" | "sample" | "manual";

const ERRORS: Record<Exclude<ReadResponse, { ok: true }>["error"], string> = {
  quota: "Our letter reader has used up today's free allowance. You can enter the details by hand, or try a sample letter.",
  busy: "Our letter reader is busy right now. Try again in a minute, enter the details by hand, or try a sample letter.",
  rate_limited: "You've read several letters in the last minute. Wait a minute and try again, or try a sample letter.",
  unreadable: "We couldn't read this photo. Try again in good light with the whole page in frame, or enter the details by hand.",
  too_large: "That photo is too large. Try taking it again.",
  bad_request: "Something went wrong sending the photo. Try choosing it again.",
  unavailable: "Our letter reader isn't working right now. You can enter the details by hand, or try a sample letter.",
};

function useHash(): string {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

function ReadingScreen() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 15_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <main class="wrap reading" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <h1>Reading your letter…</h1>
      <p class="muted">{slow ? "Still reading. This one is taking longer than usual." : "This usually takes about 10 seconds."}</p>
    </main>
  );
}

function App() {
  const hash = useHash();
  const [screen, setScreen] = useState<Screen>("form");
  const [draft, setDraft] = useState<Draft>({});
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [reading, setReading] = useState<Reading>(EMPTY_READING);
  const [source, setSource] = useState<Source>("ai");
  const [capturedAt, setCapturedAt] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);

  useEffect(() => window.scrollTo(0, 0), [screen, hash]);

  function goHome() {
    if (location.hash) history.pushState(null, "", location.pathname);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    setScreen("form");
  }

  async function read() {
    if (photo?.sampleId) return openSample(photo.sampleId, draft);
    if (!photo?.base64) return;
    setNotice(null);
    setScreen("reading");
    try {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: photo.base64 }),
      });
      const body = (await res.json()) as ReadResponse;
      if (!body.ok) {
        setNotice(ERRORS[body.error]);
        setScreen("form");
        return;
      }
      setReading(body.reading);
      setSource("ai");
      setScreen("check");
    } catch {
      setNotice(ERRORS.unavailable);
      setScreen("form");
    }
  }

  function manual() {
    setNotice(null);
    setReading(EMPTY_READING);
    setSource("manual");
    setScreen("check");
  }

  async function openSample(id: string, answers: Draft) {
    const captured = await sampleReading(id);
    if (!captured) {
      setNotice("The sample letters aren't available right now.");
      return;
    }
    setNotice(null);
    setDraft(answers);
    setPhoto({ preview: `/samples/${id}.jpg`, base64: null, sampleId: id });
    setReading(captured.reading);
    setCapturedAt(captured.capturedAt);
    setSource("sample");
    setScreen("check");
  }

  function confirm() {
    if (missingAnswers(draft).length) {
      setScreen("form");
      return;
    }
    setDecision(decide(draft as Answers, reading));
    setScreen("result");
  }

  function restart() {
    setDraft({});
    setPhoto(null);
    setReading(EMPTY_READING);
    setDecision(null);
    setNotice(null);
    setScreen("form");
  }

  if (hash === "#how") {
    return (
      <>
        <div class="wrap wide" style="padding-bottom: 0">
          <Header onHome={goHome} />
        </div>
        <How />
        <div class="wrap wide">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <div class="wrap wide" style="padding-bottom: 0">
        <Header onHome={goHome} />
      </div>
      <div class="wrap" style="padding-bottom: 0">
        <Steps at={screen === "result" ? 2 : screen === "check" ? 1 : 0} />
      </div>
      {screen === "form" && (
        <Form
          draft={draft}
          setDraft={setDraft}
          photo={photo}
          setPhoto={setPhoto}
          onRead={read}
          onManual={manual}
          onSample={(id) => openSample(id, SAMPLES.find((s) => s.id === id)?.answers ?? {})}
          notice={notice}
        />
      )}
      {screen === "reading" && <ReadingScreen />}
      {screen === "check" && (
        <Check
          reading={reading}
          setReading={setReading}
          photo={photo}
          source={source}
          capturedAt={capturedAt}
          onConfirm={confirm}
          onBack={() => setScreen("form")}
        />
      )}
      {screen === "result" && decision && (
        <Result
          decision={decision}
          reading={reading}
          answers={draft as Answers}
          sample={source === "sample"}
          onEdit={() => setScreen("check")}
          onRestart={restart}
        />
      )}
      <div class="wrap">
        <Footer />
      </div>
    </>
  );
}

const root = document.getElementById("app");
if (root) {
  root.textContent = "";
  render(<App />, root);
}
