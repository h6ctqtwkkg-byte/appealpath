// The six rules, checked in order up to the one that picked the next step: on the result screen, and on the How page,
// where anyone can change the answers and watch it move.
import { explain } from "../shared/rules";
import type { Answers, Category, Decision } from "../shared/types";
import { useT } from "./i18n";

/** The six rules, checked in order up to the one that picked this step, so the user can see why. */
export function Trace({ answers, reading, decision, title = true }: { answers: Answers; reading: { category: Category }; decision: Decision; title?: boolean }) {
  const all = useT();
  const t = all.result.trace;
  const tests = explain(answers, reading);
  return (
    <section class="trace" aria-labelledby={title ? "trace-h" : undefined}>
      {title && <h2 id="trace-h">{t.title}</h2>}
      <p class="small muted">{t.intro}</p>
      <ol>
        {t.rules.slice(0, decision.rule).map((question, i) => (
          <li key={i} class={tests[i] ? "hit" : undefined}>
            {question}{" "}
            {i < 5 && <strong>{tests[i] ? t.yes : t.no}</strong>}
            {tests[i] && <strong> → {all.result.kicker[decision.outcome]}</strong>}
            {i === 3 && <span class="small muted"> {t.kind(all.categories[reading.category])}</span>}
          </li>
        ))}
      </ol>
      {title && (
        <p class="small muted">
          <a href="#how">{all.result.seeHow}</a>
        </p>
      )}
    </section>
  );
}
