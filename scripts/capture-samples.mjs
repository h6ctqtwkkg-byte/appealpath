// Reads demo letters (public/samples/<id>.jpg, or <id>-p1.jpg, <id>-p2.jpg… for a letter of several pages) through a
// running dev server and saves the real model answers in public/samples/readings.json, so the sample buttons never
// spend neurons. Pages are read one by one and joined the way the app joins them (src/shared/merge.ts). Readings for
// other ids are kept. Run `npm run dev` first.
//   node scripts/capture-samples.mjs [L01 L02 …]   (default: every sample)   BASE=http://127.0.0.1:8792
import { access, readFile, writeFile } from "node:fs/promises";
import * as esbuild from "esbuild";

const bundled = await esbuild.build({
  stdin: { contents: 'export { mergeReadings } from "./src/shared/merge.ts";', resolveDir: process.cwd() },
  bundle: true,
  format: "esm",
  write: false,
});
const { mergeReadings } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`);

const base = process.env.BASE ?? "http://127.0.0.1:8792";
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ["L01", "L02", "L03", "L04", "L09", "L12", "G01"];
const out = JSON.parse(await readFile("public/samples/readings.json", "utf8").catch(() => "{}"));
const exists = (f) => access(f).then(() => true, () => false);
for (const id of ids) {
  const files = [];
  if (await exists(`public/samples/${id}.jpg`)) files.push(`public/samples/${id}.jpg`);
  for (let n = 1; (await exists(`public/samples/${id}-p${n}.jpg`)); n++) files.push(`public/samples/${id}-p${n}.jpg`);
  const readings = [];
  for (const f of files) {
    const image = (await readFile(f)).toString("base64");
    const res = await fetch(`${base}/api/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
    const body = await res.json();
    if (!body.ok) throw new Error(`${f}: ${body.error}`);
    readings.push(body);
    console.log(f, body.model, `${body.neurons?.toFixed(1)} neurons`, `${body.ms} ms`);
  }
  out[id] = { reading: mergeReadings(readings.map((b) => b.reading)), model: readings[0].model, capturedAt: new Date().toISOString().slice(0, 10) };
}
await writeFile("public/samples/readings.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote public/samples/readings.json");
