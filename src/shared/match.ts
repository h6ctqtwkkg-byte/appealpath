// The second reader's check: is a quote the AI copied actually printed on the photo? Works on word boxes from any OCR
// (Tesseract in the browser, or in scripts/measure.mjs). Pure functions, so they're tested directly.

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Word {
  text: string;
  bbox: Box;
  /** Index of the OCR line the word sits on. */
  line: number;
}

export interface QuoteMatch {
  /** Share of the quote's words found in order on the photo, 0 to 1. */
  score: number;
  /** Every word matched and none skipped: the photo says exactly this. */
  exact: boolean;
  /** One box per line of the letter the matched words cover. */
  boxes: Box[];
}

/** At or above this, the quote counts as found on the photo. */
export const FOUND = 0.8;

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9']+/)
    .map((t) => t.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

function distance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j]!;
      prev[j] = Math.min(up + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length]!;
}

/** OCR misreads a letter here and there; short words and numbers must match exactly. */
export function same(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length <= 3 || b.length <= 3 || /\d/.test(a) || /\d/.test(b)) return false;
  return 1 - distance(a, b) / Math.max(a.length, b.length) >= 0.75;
}

function merge(boxes: Box[]): Box {
  return {
    x0: Math.min(...boxes.map((b) => b.x0)),
    y0: Math.min(...boxes.map((b) => b.y0)),
    x1: Math.max(...boxes.map((b) => b.x1)),
    y1: Math.max(...boxes.map((b) => b.y1)),
  };
}

/** One word per token: OCR words like "(479)" or "notice." can hold more than one token or stray punctuation. */
function flatten(words: Word[]): { token: string; word: Word }[] {
  return words.flatMap((word) => tokens(word.text).map((token) => ({ token, word })));
}

/**
 * Finds the quote on the photo: the best in-order run of its words, allowing an OCR miss or an extra word now and then.
 * Returns null when nothing usable matches.
 */
export function findQuote(quote: string, words: Word[]): QuoteMatch | null {
  const q = tokens(quote);
  const ocr = flatten(words);
  if (!q.length || !ocr.length) return null;
  let best: { matched: number; hits: Word[]; span: number } | null = null;

  for (let start = 0; start < ocr.length; start++) {
    // A run may start on any of the quote's first three words, in case OCR missed the first one.
    const first = q.slice(0, 3).findIndex((t) => same(t, ocr[start]!.token));
    if (first < 0) continue;
    let k = start;
    let matched = 0;
    let last = start;
    const hits: Word[] = [];
    for (let j = first; j < q.length && k < ocr.length; j++) {
      // Look a couple of words ahead for OCR noise; if the word isn't there, count it as missed and move on.
      for (let look = k; look < Math.min(k + 3, ocr.length); look++) {
        if (same(q[j]!, ocr[look]!.token)) {
          matched++;
          hits.push(ocr[look]!.word);
          last = look;
          k = look + 1;
          break;
        }
      }
    }
    // span counts the photo's words from the first match to the last: more than the quote means it skipped some.
    const span = last - start + 1;
    if (!best || matched > best.matched || (matched === best.matched && span < best.span)) best = { matched, hits, span };
    if (matched === q.length && span === q.length) break;
  }
  if (!best || best.matched === 0) return null;

  const byLine = new Map<number, Box[]>();
  for (const w of best.hits) byLine.set(w.line, [...(byLine.get(w.line) ?? []), w.bbox]);
  return {
    score: best.matched / q.length,
    exact: best.matched === q.length && best.span === q.length,
    boxes: [...byLine.values()].map(merge),
  };
}

/**
 * Where a phone number appears on the photo, and whether it's a fax: true only when every place it appears comes right
 * after the word "fax" on the same line ("or fax it to (479) 555-0178"). Every digit has to match, area code included,
 * so a number with the wrong area code isn't confirmed; a leading 1 is ignored.
 */
export function findPhone(phone: string, words: Word[]): { boxes: Box[]; fax: boolean } | null {
  const want = phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  const last4 = want.slice(-4);
  if (want.length < 7) return null;
  const found: { boxes: Box; fax: boolean }[] = [];
  for (let i = 0; i < words.length; i++) {
    let joined = words[i]!.text.replace(/\D/g, "");
    if (!joined.endsWith(last4)) continue;
    // The number may be split across words: "(479)" "555-0178".
    const line = words[i]!.line;
    let j = i;
    while (j > 0 && words[j - 1]!.line === line && /\d/.test(words[j - 1]!.text) && joined.length < want.length) {
      j--;
      joined = words[j]!.text.replace(/\D/g, "") + joined;
    }
    if (!joined.endsWith(want)) continue;
    const before = words.slice(Math.max(0, j - 4), j).filter((w) => w.line === line);
    found.push({ boxes: merge(words.slice(j, i + 1).map((w) => w.bbox)), fax: before.some((w) => /fax/i.test(w.text)) });
  }
  if (!found.length) return null;
  return { boxes: found.map((f) => f.boxes), fax: found.every((f) => f.fax) };
}

interface OcrBlock {
  paragraphs: { lines: { words: { text: string; bbox: Box }[] }[] }[];
}

/** Flattens Tesseract's blocks → paragraphs → lines → words into words that know their line. */
export function wordsFromBlocks(blocks: unknown): Word[] {
  const words: Word[] = [];
  let line = 0;
  for (const block of (blocks ?? []) as OcrBlock[]) {
    for (const p of block.paragraphs) {
      for (const l of p.lines) {
        for (const w of l.words) if (w.text.trim()) words.push({ text: w.text, bbox: w.bbox, line });
        line++;
      }
    }
  }
  return words;
}
