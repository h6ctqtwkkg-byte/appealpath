// Small shared pieces: header, step indicator, footer, radio choices, quoted letter text, phone links.
import type { ComponentChildren } from "preact";

export function Header({ onHome }: { onHome: () => void }) {
  return (
    <header class="top">
      <a
        class="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
      >
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="var(--primary)" />
          <path d="M9 8h10l4 4v12H9z" fill="var(--surface)" />
          <path d="M12 18h6m-2.5-3 3 3-3 3" stroke="var(--primary)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <b>AppealPath</b>
      </a>
      <a class="how-link" href="#how">
        How it decides
      </a>
    </header>
  );
}

const STEP_NAMES = ["Your letter", "Check it", "Next step"];

export function Steps({ at }: { at: 0 | 1 | 2 }) {
  return (
    <ol class="steps" aria-label="Progress">
      {STEP_NAMES.map((name, i) => (
        <li key={name} class={i === at ? "on" : i < at ? "done" : ""} aria-current={i === at ? "step" : undefined}>
          {name}
        </li>
      ))}
    </ol>
  );
}

export function Footer() {
  return (
    <footer class="foot">
      <p>AppealPath doesn't contact your insurer or file anything for you. We don't save your photo or your answers.</p>
      <p>
        Prototype, not medical or legal advice. Built for DSH Hacks V2. <a href="#how">How it decides</a>
      </p>
    </footer>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
}

export function Choice<T extends string>(props: {
  name: string;
  legend: ComponentChildren;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  row?: boolean;
}) {
  return (
    <fieldset>
      <legend>{props.legend}</legend>
      <div class={props.row ? "choices row" : "choices"}>
        {props.options.map((o) => (
          <label class="choice" key={o.value}>
            <input type="radio" name={props.name} value={o.value} checked={props.value === o.value} onChange={() => props.onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Text copied word for word from the user's letter. */
export function Quote({ children, label = "From your letter" }: { children: ComponentChildren; label?: string }) {
  return (
    <blockquote class="quote">
      <span class="from">{label}</span>
      {children}
    </blockquote>
  );
}

/** A phone number as printed, linked for tapping when it has 10 digits. */
export function Phone({ number }: { number: string }) {
  const digits = number.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return digits.length === 10 ? <a href={`tel:+1${digits}`}>{number}</a> : <>{number}</>;
}
