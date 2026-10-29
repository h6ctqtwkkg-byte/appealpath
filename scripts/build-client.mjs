// Bundles the Preact app into public/app.js and copies the in-browser text reader (Tesseract) into public/ocr/,
// so the second reader never loads anything from a CDN. Pass --watch to rebuild on change.
import { copyFile, mkdir, stat } from "node:fs/promises";
import * as esbuild from "esbuild";

const OCR_FILES = [
  ["node_modules/tesseract.js/dist/worker.min.js", "public/ocr/worker.min.js"],
  // Each browser loads only one core, picked by its WebAssembly features. LSTM-only cores match the best_int data.
  ["node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js", "public/ocr/tesseract-core-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js", "public/ocr/tesseract-core-simd-lstm.wasm.js"],
  ["node_modules/tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js", "public/ocr/tesseract-core-relaxedsimd-lstm.wasm.js"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "public/ocr/eng.traineddata.gz"],
];

async function copyOcr() {
  await mkdir("public/ocr", { recursive: true });
  for (const [from, to] of OCR_FILES) {
    const [a, b] = await Promise.all([stat(from), stat(to).catch(() => null)]);
    if (!b || b.size !== a.size) await copyFile(from, to);
  }
}

const options = {
  entryPoints: ["src/client/main.tsx"],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: true,
  jsx: "automatic",
  jsxImportSource: "preact",
  outfile: "public/app.js",
  logLevel: "info",
};

await copyOcr();
if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
