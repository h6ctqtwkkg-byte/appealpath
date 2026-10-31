// "Listen" and "Send to someone helping you" on the result screen. Reading aloud uses the browser's own voices, and
// sending uses the phone's share sheet (or the clipboard), so nothing goes through AppealPath's server and nothing is saved.

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** The visible words of these elements, grouped by language: text quoted from the letter is marked lang="en". */
function chunks(elements: Element[], pageLang: string): { text: string; lang: string }[] {
  const out: { text: string; lang: string }[] = [];
  for (const el of elements) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const parent = n.parentElement;
      if (!parent || parent.closest("button, .visually-hidden")) continue;
      const text = (n.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const lang = parent.closest<HTMLElement>("[lang]")?.lang || pageLang;
      const last = out[out.length - 1];
      if (last && last.lang === lang) last.text += ` ${text}`;
      else out.push({ text, lang });
    }
  }
  return out;
}

/** Reads the elements aloud in order, each piece in its own language's voice. Calls onEnd when done or stopped. */
export function speak(elements: Element[], pageLang: string, onEnd: () => void) {
  speechSynthesis.cancel();
  const parts = chunks(elements, pageLang);
  if (!parts.length) return onEnd();
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.text);
    u.lang = p.lang.startsWith("es") ? "es-US" : "en-US";
    if (i === parts.length - 1) {
      u.onend = onEnd;
      u.onerror = onEnd;
    }
    speechSynthesis.speak(u);
  });
}

export const stopSpeaking = () => canSpeak() && speechSynthesis.cancel();

/** Plain text of the elements, one line per block, for a text message or an email. */
export function plainText(elements: Element[]): string {
  return elements
    .map((el) => (el as HTMLElement).innerText.replace(/\n{3,}/g, "\n\n").trim())
    .filter(Boolean)
    .join("\n\n");
}
