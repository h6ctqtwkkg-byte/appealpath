// The second reader: Tesseract running in the browser, on the same shrunk photo the AI read. The photo never leaves
// the device for this, and every file it needs is served from /ocr (copied there by scripts/build-client.mjs).
import { createWorker, type Worker } from "tesseract.js";
import { wordsFromBlocks, type Word } from "../shared/match";

export interface OcrResult {
  words: Word[];
  width: number;
  height: number;
}

let worker: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  // OEM 1 = LSTM only, which matches the best_int English data. A failed start isn't kept, so the next photo tries again.
  worker ??= createWorker("eng", 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr", langPath: "/ocr", gzip: true }).catch((err) => {
    worker = null;
    throw err;
  });
  return worker;
}

/** A slow phone can take a while, but past this the check would never finish; the screen says it couldn't check instead. */
const TIMEOUT_MS = 90_000;

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

/** Reads every word on the photo with its position. Rejects if the reader can't load or the image can't be read. */
export async function readWords(src: string): Promise<OcrResult> {
  // The clock covers loading the reader too, since a stalled download would otherwise never finish.
  const current = getWorker();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // Start over with a fresh worker next time, unless a newer one has already replaced this one.
      if (worker === current) worker = null;
      void current.then((w) => w.terminate()).catch(() => {});
      reject(new Error("ocr timeout"));
    }, TIMEOUT_MS);
  });
  const work = Promise.all([current, imageSize(src)]).then(async ([w, size]) => ({ size, data: (await w.recognize(src, {}, { blocks: true, text: false })).data }));
  const { size, data } = await Promise.race([work, timeout]).finally(() => clearTimeout(timer));
  const words = wordsFromBlocks(data.blocks);
  return { words, ...size };
}
