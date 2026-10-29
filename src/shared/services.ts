// A letter's denied services, without repeats. The reader often returns the same service twice, once short
// ("Physical therapy") and once as the full line ("Physical therapy, 12 visits, August 4 to September 25, 2026").
// Those are one service, not a choice, so the fuller wording wins.

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function distinctServices(list: string[]): string[] {
  const out: string[] = [];
  for (const s of list) {
    const k = key(s);
    if (!k) continue;
    const same = out.findIndex((o) => key(o).includes(k) || k.includes(key(o)));
    if (same < 0) out.push(s);
    else if (k.length > key(out[same]!).length) out[same] = s; // more words, not just more punctuation
  }
  return out;
}
