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
  // OEM 1 = LSTM only, which matches the best_int English data.
  worker ??= createWorker("eng", 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr", langPath: "/ocr", gzip: true });
  return worker;
}

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
  const [w, size] = await Promise.all([getWorker(), imageSize(src)]);
  const { data } = await w.recognize(src, {}, { blocks: true, text: false });
  const words = wordsFromBlocks(data.blocks);
  return { words, ...size };
}
