// Small shared pieces: banner, header, step indicator, footer, radio choices, quoted letter text, phone links, the letter view.
import type { ComponentChildren } from "preact";
import type { Box } from "../shared/match";
import { useLang, useT, type Lang } from "./i18n";

export function Banner() {
  const t = useT();
  return (
    <div class="banner" role="note">
      <strong>{t.banner.strong}</strong> {t.banner.rest}
      {t.reviewNote && <span class="review-note">{t.reviewNote}</span>}
    </div>
  );
}

export function Header({ onHome, setLang }: { onHome: () => void; setLang: (l: Lang) => void }) {
  const t = useT();
  const lang = useLang();
  const other: Lang = lang === "en" ? "es" : "en";
  return (
    <header class="top">
      <a
        class="brand"
        href="#"
        aria-label={t.header.home}
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
      <nav class="top-links" aria-label="AppealPath">
        <button class="linkish lang" type="button" lang={other} aria-label={t.header.switchLabel} onClick={() => setLang(other)}>
          {t.header.switchTo}
        </button>
        <a class="how-link" href="#how">
          {t.header.how}
        </a>
      </nav>
    </header>
  );
}

export function Steps({ at }: { at: 0 | 1 | 2 }) {
  const t = useT();
  return (
    <ol class="steps" aria-label={t.stepsLabel}>
      {t.steps.map((name, i) => (
        <li key={name} class={i === at ? "on" : i < at ? "done" : ""} aria-current={i === at ? "step" : undefined}>
          {name}
        </li>
      ))}
    </ol>
  );
}

export function Footer() {
  const t = useT();
  return (
    <footer class="foot">
      <p>{t.footer.privacy}</p>
      <p>
        {t.footer.prototype} <a href="#how">{t.footer.how}</a>
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

/** Text copied word for word from the user's letter. Never translated: it stays as printed. */
export function Quote({ children, label }: { children: ComponentChildren; label?: string }) {
  const t = useT();
  return (
    <blockquote class="quote" lang="en">
      <span class="from" lang={useLang()}>
        {label ?? t.quoteFrom}
      </span>
      {children}
    </blockquote>
  );
}

/** A phone number as printed, linked for tapping when it has 10 digits. */
export function Phone({ number }: { number: string }) {
  const digits = number.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return digits.length === 10 ? <a href={`tel:+1${digits}`}>{number}</a> : <>{number}</>;
}

/** The user's letter, with optional highlight boxes in the image's own pixel coordinates. */
export function LetterImage(props: { src: string; alt: string; boxes?: Box[]; width?: number; height?: number }) {
  const { boxes = [], width, height } = props;
  return (
    <div class="letter-frame">
      <img src={props.src} alt={props.alt} />
      {width &&
        height &&
        boxes.map((b, i) => (
          <span
            key={i}
            class="hl"
            aria-hidden="true"
            style={{
              left: `${((b.x0 - 6) / width) * 100}%`,
              top: `${((b.y0 - 4) / height) * 100}%`,
              width: `${((b.x1 - b.x0 + 12) / width) * 100}%`,
              height: `${((b.y1 - b.y0 + 8) / height) * 100}%`,
            }}
          />
        ))}
    </div>
  );
}
