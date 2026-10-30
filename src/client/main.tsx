// AppealPath app: letter and questions → check what we read → one next step. "#how" shows how it decides.
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { decide } from "../shared/rules";
import { EMPTY_READING, type Answers, type Decision, type ReadResponse, type Reading } from "../shared/types";
import { Check, type OcrState } from "./Check";
import { unconfirmed } from "./checks";
import { Form, isGuardPlan, missingAnswers, type Draft } from "./Form";
import { How } from "./How";
import { initialLang, LangContext, saveLang, STRINGS, type Lang } from "./i18n";
import { prepare, type Photo } from "./image";
import { readWords } from "./ocr";
import { Result } from "./Result";
import { SAMPLES, sampleReading } from "./samples";
import { Banner, Footer, Header, Steps } from "./ui";

type Screen = "form" | "reading" | "check" | "result";
type Source = "ai" | "sample" | "manual";

function useHash(): string {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

function ReadingScreen({ lang }: { lang: Lang }) {
  const t = STRINGS[lang].reading;
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 15_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <main class="wrap reading" id="main" aria-live="polite">
      <div class="spinner" aria-hidden="true" />
      <h1>{t.title}</h1>
      <p class="muted">{slow ? t.slow : t.usual}</p>
    </main>
  );
}

function App() {
  const hash = useHash();
  const [lang, setLangState] = useState<Lang>(initialLang);
  const t = STRINGS[lang];
  const [screen, setScreen] = useState<Screen>("form");
  const [draft, setDraft] = useState<Draft>({});
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [ocr, setOcr] = useState<OcrState>({ status: "none" });
  const [reading, setReading] = useState<Reading>(EMPTY_READING);
  const [source, setSource] = useState<Source>("ai");
  const [capturedAt, setCapturedAt] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<keyof typeof t.errors | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  // True when the result came straight from the form (rule 1), with no letter read.
  const [early, setEarly] = useState(false);

  // Focus follows the user's own actions only, so a direct link (?sample=…) doesn't land with a focus ring.
  const interacted = useRef(false);
  useEffect(() => {
    const on = () => (interacted.current = true);
    window.addEventListener("pointerdown", on, { once: true });
    window.addEventListener("keydown", on, { once: true });
    return () => {
      window.removeEventListener("pointerdown", on);
      window.removeEventListener("keydown", on);
    };
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    // On a screen change the user caused, move focus to the new heading so screen readers announce where they are.
    if (!interacted.current) return;
    const h1 = document.querySelector<HTMLElement>("main h1");
    if (h1) {
      h1.tabIndex = -1;
      h1.focus({ preventScroll: true });
    }
  }, [screen, hash]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // The second reader starts as soon as there's a photo, so it's usually done by the time the AI answers.
  useEffect(() => {
    if (!photo) return setOcr({ status: "none" });
    let current = true;
    setOcr({ status: "running" });
    readWords(photo.preview)
      .then((result) => current && setOcr({ status: "done", result }))
      .catch(() => current && setOcr({ status: "failed" }));
    return () => {
      current = false;
    };
  }, [photo]);

  // Direct links for judges and the README: ?sample=L02 opens a sample on the check screen; add &result to skip ahead.
  const urlReady = useRef(!new URLSearchParams(location.search).has("sample"));
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("sample")?.toUpperCase();
    const sample = SAMPLES.find((s) => s.id === id);
    if (!sample) {
      urlReady.current = true;
      return;
    }
    openSample(sample.id, sample.answers).then((reading) => {
      urlReady.current = true;
      if (reading && params.has("result")) {
        setDecision(decide(sample.answers, reading));
        setScreen("result");
      }
    });
  }, []);
  // Keep the address in step with the sample on screen, so a copied link opens the same thing.
  useEffect(() => {
    if (!urlReady.current) return;
    const id = source === "sample" ? photo?.sampleId : undefined;
    const want = id ? (screen === "result" ? `?sample=${id}&result` : `?sample=${id}`) : "";
    if (location.search !== want) history.replaceState(null, "", location.pathname + want + location.hash);
  }, [screen, source, photo]);

  function setLang(l: Lang) {
    setLangState(l);
    saveLang(l);
  }

  function goHome() {
    if (location.hash) history.pushState(null, "", location.pathname);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    setScreen("form");
  }

  async function read(image = photo?.base64) {
    if (photo?.sampleId && !image) {
      await openSample(photo.sampleId, draft);
      return;
    }
    if (!image) return;
    setNotice(null);
    setEarly(false);
    setScreen("reading");
    // The Worker gives up within about 40 seconds; past that the network is stuck, so stop and offer the other ways in.
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 60_000);
    try {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image }),
        signal: stop.signal,
      });
      const body = (await res.json()) as ReadResponse;
      if (!body.ok) {
        setNotice(body.error);
        setScreen("form");
        return;
      }
      setReading(body.reading);
      setSource("ai");
      setScreen("check");
    } catch {
      setNotice(stop.signal.aborted ? "busy" : "unavailable");
      setScreen("form");
    } finally {
      clearTimeout(timer);
    }
  }

  // A sample letter sent through the real reader, so anyone can watch the AI read without a letter of their own.
  async function readLive() {
    if (!photo?.sampleId) return;
    try {
      const blob = await fetch(photo.preview).then((r) => r.blob());
      const live = await prepare(new File([blob], `${photo.sampleId}.jpg`, { type: blob.type }));
      setPhoto(live);
      await read(live.base64 ?? undefined);
    } catch {
      setNotice("unavailable");
      setScreen("form");
    }
  }

  function manual() {
    setNotice(null);
    setEarly(false);
    setReading(EMPTY_READING);
    setSource("manual");
    setScreen("check");
  }

  async function openSample(id: string, answers: Draft): Promise<Reading | null> {
    // Medicare, Medicaid and "not sure" read nothing, samples included: straight to "call your plan", as from the form.
    if (isGuardPlan(answers)) {
      setNotice(null);
      setDraft(answers);
      setPhoto({ preview: `/samples/${id}.jpg`, base64: null, sampleId: id });
      setReading(EMPTY_READING);
      setSource("sample");
      setEarly(true);
      setDecision(decide(answers as Answers, EMPTY_READING));
      setScreen("result");
      return EMPTY_READING;
    }
    const captured = await sampleReading(id);
    if (!captured) {
      setNotice("samples");
      return null;
    }
    setNotice(null);
    setEarly(false);
    setDraft(answers);
    if (photo?.sampleId !== id) setPhoto({ preview: `/samples/${id}.jpg`, base64: null, sampleId: id });
    setReading(captured.reading);
    setCapturedAt(captured.capturedAt);
    setSource("sample");
    setScreen("check");
    return captured.reading;
  }

  // Medicare, Medicaid and "not sure": rule 1 doesn't depend on the letter, so go straight to the result and read nothing.
  function planGuard() {
    setNotice(null);
    setReading(EMPTY_READING);
    setSource("manual");
    setEarly(true);
    setDecision(decide(draft as Answers, EMPTY_READING));
    setScreen("result");
  }

  function confirm() {
    if (missingAnswers(draft, t).length) {
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
    setEarly(false);
    setScreen("form");
  }

  const top = (
    <>
      <a class="skip" href="#main">
        {lang === "es" ? "Ir al contenido" : "Skip to content"}
      </a>
      <Banner />
      <div class="wrap wide" style="padding-bottom: 0">
        <Header onHome={goHome} setLang={setLang} />
      </div>
    </>
  );

  if (hash === "#how") {
    return (
      <LangContext.Provider value={lang}>
        {top}
        <How />
        <div class="wrap wide">
          <Footer />
        </div>
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider value={lang}>
      {top}
      <div class="wrap" style="padding-bottom: 0">
        <Steps at={screen === "result" ? 2 : screen === "check" ? 1 : 0} />
      </div>
      {screen === "form" && (
        <Form
          draft={draft}
          setDraft={setDraft}
          photo={photo}
          setPhoto={setPhoto}
          onRead={() => read()}
          onManual={manual}
          onGuard={planGuard}
          onSample={(id) => openSample(id, SAMPLES.find((s) => s.id === id)?.answers ?? {})}
          notice={notice ? t.errors[notice] : null}
        />
      )}
      {screen === "reading" && <ReadingScreen lang={lang} />}
      {screen === "check" && (
        <Check
          reading={reading}
          setReading={setReading}
          photo={photo}
          ocr={ocr}
          answers={draft}
          source={source}
          capturedAt={capturedAt}
          onConfirm={confirm}
          onBack={() => setScreen("form")}
          onReadLive={source === "sample" ? readLive : undefined}
        />
      )}
      {screen === "result" && decision && (
        <Result
          decision={decision}
          reading={reading}
          answers={draft as Answers}
          sample={source === "sample" && !early}
          unconfirmed={early || ocr.status === "running" ? [] : unconfirmed(reading, ocr, decision.outcome === "urgent")}
          early={early}
          onEdit={() => setScreen(early ? "form" : "check")}
          onRestart={restart}
        />
      )}
      <div class="wrap">
        <Footer />
      </div>
    </LangContext.Provider>
  );
}

const root = document.getElementById("app");
if (root) {
  root.textContent = "";
  render(<App />, root);
}
