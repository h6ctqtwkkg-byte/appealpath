// Reads the three demo letters (public/samples/L01–L03.jpg) through a running dev server and saves the real model
// answers to public/samples/readings.json, so the sample buttons never spend neurons. Run `npm run dev` first.
//   node scripts/capture-samples.mjs [http://127.0.0.1:8792]
import { readFile, writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://127.0.0.1:8792";
const out = {};
for (const id of ["L01", "L02", "L03"]) {
  const image = (await readFile(`public/samples/${id}.jpg`)).toString("base64");
  const res = await fetch(`${base}/api/read`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
  const body = await res.json();
  if (!body.ok) throw new Error(`${id}: ${body.error}`);
  out[id] = { reading: body.reading, model: body.model, capturedAt: new Date().toISOString().slice(0, 10) };
  console.log(id, body.model, `${body.neurons?.toFixed(1)} neurons`, `${body.ms} ms`);
}
await writeFile("public/samples/readings.json", JSON.stringify(out, null, 2) + "\n");
console.log("wrote public/samples/readings.json");
