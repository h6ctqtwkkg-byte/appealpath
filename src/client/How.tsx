// "How it decides": the rules, their sources, measured accuracy (public/accuracy.json) and the limits.
import { useEffect, useState } from "preact/hooks";
import { useT } from "./i18n";

interface Run {
  measuredOn: string;
  images: string;
  model: string;
  photos: number;
  fields: { name: string; right: number; empty: number; wrong: number }[];
  results: { right: number; total: number };
  secondReader?: { confirmed: number; correct: number; caught: number; wrong: number };
  misses: string[];
}

const RULE_SOURCES = [
  "",
  "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/",
  "",
  "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/",
  "",
];

const SOURCE_LINKS = [
  "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/",
  "https://www.healthcare.gov/appeal-insurance-company-decision/external-review/",
  "https://insurance.arkansas.gov/consumer-assistance/consumer-services/external-review/",
  "https://beta.dol.gov/about/agencies/ebsa/ask-ebsa",
  "https://humanservices.arkansas.gov/contact-us/file-an-appeal/",
  "https://www.medicaid.gov/about-us/where-can-people-get-help-medicaid-chip",
];

function RunTable({ run }: { run: Run }) {
  const t = useT().how;
  return (
    <section class="run">
      <p>{t.tested(run.photos, run.images, run.measuredOn, run.model)}</p>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t.fieldCols.field}</th>
              <th scope="col">{t.fieldCols.right}</th>
              <th scope="col">{t.fieldCols.empty}</th>
              <th scope="col">{t.fieldCols.wrong}</th>
            </tr>
          </thead>
          <tbody>
            {run.fields.map((f) => (
              <tr key={f.name}>
                <th scope="row">{t.fieldNames[f.name] ?? f.name}</th>
                <td>{f.right}</td>
                <td>{f.empty}</td>
                <td>{f.wrong}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <strong>{t.rightSteps(run.results.right, run.results.total)}</strong>
      </p>
      {run.secondReader && <p>{t.secondReader(run.secondReader.confirmed, run.secondReader.correct, run.secondReader.caught, run.secondReader.wrong)}</p>}
      {run.misses.length > 0 && (
        <>
          <h3>{t.misses}</h3>
          <ul lang="en">
            {run.misses.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

// The held-out letters are the fairer test, so they come first.
const heldOutFirst = (run: Run) => (run.images.startsWith("held-out") ? 0 : 1);

export function How() {
  const t = useT().how;
  const [runs, setRuns] = useState<Run[] | null | undefined>(undefined);
  useEffect(() => {
    fetch("/accuracy.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { runs?: Run[] } | Run | null) => setRuns(d ? ("runs" in d && d.runs ? d.runs : [d as Run]) : null))
      .catch(() => setRuns(null));
  }, []);

  return (
    <main class="wrap wide how" id="main">
      <h1>{t.title}</h1>
      <ol class="principles">
        <li>
          <strong>{t.p1Title}</strong> {t.p1}
        </li>
        <li>
          <strong>{t.p2Title}</strong> {t.p2}
        </li>
        <li>
          <strong>{t.p3Title}</strong> {t.p3}
        </li>
        <li>
          <strong>{t.p4Title}</strong> {t.p4}
        </li>
      </ol>

      <h2>{t.rulesTitle}</h2>
      <p class="muted small">{t.rulesNote}</p>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">{t.cols.n}</th>
              <th scope="col">{t.cols.when}</th>
              <th scope="col">{t.cols.then}</th>
              <th scope="col">{t.cols.source}</th>
            </tr>
          </thead>
          <tbody>
            {t.rules.map(([when, then], i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{when}</td>
                <td>
                  <strong>{then}</strong>
                </td>
                <td>
                  {RULE_SOURCES[i] ? (
                    <a href={RULE_SOURCES[i]} target="_blank" rel="noopener">
                      Healthcare.gov
                    </a>
                  ) : (
                    <span class="tag-src">{t.designChoice}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{t.accuracyTitle}</h2>
      {runs === undefined && <p class="muted">{t.loading}</p>}
      {runs === null && <p>{t.notMeasured}</p>}
      {runs && [...runs].sort((a, b) => heldOutFirst(a) - heldOutFirst(b)).map((run) => <RunTable key={run.images} run={run} />)}
      {runs && <p class="muted small">{t.caveat}</p>}

      <h2>{t.wontTitle}</h2>
      <p>{t.wont}</p>

      <h2>{t.limitsTitle}</h2>
      <p>{t.limits}</p>

      <h2>{t.sourcesTitle}</h2>
      <ul>
        {t.sources.map((name, i) => (
          <li key={name}>
            <a href={SOURCE_LINKS[i]} target="_blank" rel="noopener">
              {name}
            </a>
          </li>
        ))}
      </ul>
      <p>
        <a href="#">{t.back}</a>
      </p>
    </main>
  );
}
