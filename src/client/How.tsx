// "How it decides": the rules, their sources, measured accuracy (public/accuracy.json) and the limits.
import { useEffect, useState } from "preact/hooks";

interface Accuracy {
  measuredOn: string;
  images: string;
  model: string;
  photos: number;
  fields: { name: string; right: number; empty: number; wrong: number }[];
  results: { right: number; total: number };
  misses: string[];
}

const RULES: [string, string, string, string?][] = [
  ["1", "Medicare, Medicaid or not sure", "Call the number on your letter", ""],
  [
    "2",
    "The care hasn't happened, and your doctor says waiting could seriously harm your health",
    "Urgent review today",
    "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/",
  ],
  ["3", "A fixable reason (prior authorization, missing records, billing mistake) and the office hasn't resubmitted", "Fix & resubmit", ""],
  [
    "4",
    "Not medically necessary, not covered, out of network or experimental; or a fixable reason the office already resubmitted",
    "Appeal",
    "https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/",
  ],
  ["5", "No clear reason", "Call and ask why, and what the deadline is", ""],
];

export function How() {
  const [acc, setAcc] = useState<Accuracy | null | undefined>(undefined);
  useEffect(() => {
    fetch("/accuracy.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setAcc)
      .catch(() => setAcc(null));
  }, []);

  return (
    <main class="wrap wide how">
      <h1>How AppealPath decides</h1>
      <ol class="principles">
        <li>
          <strong>The AI reads; the rules decide.</strong> An AI model (Gemma 4 on Cloudflare Workers AI) reads your letter: what was denied, why, the deadline and who
          to call. It copies text word for word. Fixed rules, not the AI, pick your next step from what it read and your 5 answers.
        </li>
        <li>
          <strong>You check before it decides.</strong> You always check the deadline and the reason against your letter before you get a next step. AI readers can sound
          sure and still be wrong: in our tests, the model said it was 100% sure about a sentence it had copied with a word missing.
        </li>
        <li>
          <strong>It never makes up a deadline.</strong> It shows the one printed on your letter. If there isn't one, it says so.
        </li>
      </ol>

      <h2>The rules, in order</h2>
      <p class="muted small">The first rule that matches picks your next step. Rules without a source are our own design choices.</p>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>If…</th>
              <th>Next step</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map(([n, when, then, src]) => (
              <tr key={n}>
                <td>{n}</td>
                <td>{when}</td>
                <td>
                  <strong>{then}</strong>
                </td>
                <td>
                  {src ? (
                    <a href={src} target="_blank" rel="noopener">
                      Healthcare.gov
                    </a>
                  ) : (
                    <span class="tag-src">Design choice</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>How well it works</h2>
      {acc === undefined && <p class="muted">Loading…</p>}
      {acc === null && <p>Not measured yet.</p>}
      {acc && (
        <>
          <p>
            Tested on {acc.photos} images of fictional letters ({acc.images}), {acc.measuredOn}, with {acc.model}.
          </p>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Read right</th>
                  <th>Left empty for you to fill</th>
                  <th>Wrong</th>
                </tr>
              </thead>
              <tbody>
                {acc.fields.map((f) => (
                  <tr key={f.name}>
                    <td>{f.name}</td>
                    <td>{f.right}</td>
                    <td>{f.empty}</td>
                    <td>{f.wrong}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <strong>
              Right next step without any fixes: {acc.results.right} of {acc.results.total}.
            </strong>
          </p>
          {acc.misses.length > 0 && (
            <>
              <h3>What it got wrong</h3>
              <ul>
                {acc.misses.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          )}
          <p class="muted small">
            These test letters are cleaner than real mail, and the reading instructions were adjusted after earlier runs on these same letters, so these numbers are a
            best case. Real-world accuracy will be lower, which is why you always check the deadline and the reason.
          </p>
        </>
      )}

      <h2>What it won't do</h2>
      <p>Contact your insurer, file anything, predict whether you'll win, give medical or legal advice, or save your photo or answers.</p>

      <h2>Limits</h2>
      <p>
        This version covers job and Marketplace plans only. Medicare and Medicaid have their own appeal rules, so they get "call the number on your letter" instead of a
        guess. Free-help contacts are for Arkansas; other states get a link to their insurance department.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>
          <a href="https://www.healthcare.gov/appeal-insurance-company-decision/internal-appeals/" target="_blank" rel="noopener">
            Healthcare.gov: internal appeals
          </a>
        </li>
        <li>
          <a href="https://www.healthcare.gov/appeal-insurance-company-decision/external-review/" target="_blank" rel="noopener">
            Healthcare.gov: external review
          </a>
        </li>
        <li>
          <a href="https://insurance.arkansas.gov/consumer-assistance/consumer-services/external-review/" target="_blank" rel="noopener">
            Arkansas Insurance Department: external review
          </a>
        </li>
        <li>
          <a href="https://beta.dol.gov/about/agencies/ebsa/ask-ebsa" target="_blank" rel="noopener">
            U.S. Department of Labor: Ask EBSA
          </a>
        </li>
      </ul>
      <p>
        <a href="#">Back to AppealPath</a>
      </p>
    </main>
  );
}
