// Sums up the run-to-run spread: the first measured run (public/accuracy.json) next to every repeat in
// test-letters/runs/repeats/ (REPEAT=n node scripts/measure.mjs …), and, image by image, how often each field came out
// right across the repeats.
//   node scripts/repeats-summary.mjs   → a table, and test-letters/runs/repeats/summary.json
import { readdir, readFile, writeFile } from "node:fs/promises";

const dir = "test-letters/runs/repeats";
const files = (await readdir(dir)).filter((f) => f.endsWith(".json") && f !== "summary.json").sort();
const repeats = await Promise.all(files.map(async (f) => JSON.parse(await readFile(`${dir}/${f}`, "utf8"))));
const first = JSON.parse(await readFile("public/accuracy.json", "utf8")).runs;

const FIELDS = ["Service", "Reason", "Deadline", "Phone"];
const total = (runs) => {
  const t = { step: [0, 0], second: { caught: 0, wrong: 0, falseAlarms: 0 } };
  for (const f of FIELDS) t[f] = [0, 0];
  for (const r of runs) {
    t.step[0] += r.results.right;
    t.step[1] += r.results.total;
    for (const f of r.fields) {
      t[f.name][0] += f.right;
      t[f.name][1] += f.right + f.empty + f.wrong;
    }
    t.second.caught += r.secondReader.caught;
    t.second.wrong += r.secondReader.wrong;
    t.second.falseAlarms += r.secondReader.correct - r.secondReader.confirmed;
  }
  return t;
};
const row = (name, t) => ({
  run: name,
  "next step": `${t.step[0]}/${t.step[1]}`,
  ...Object.fromEntries(FIELDS.map((f) => [f === "Reason" ? "kind of reason" : f.toLowerCase(), `${t[f][0]}/${t[f][1]}`])),
  "wrong values flagged": `${t.second.caught}/${t.second.wrong}`,
  "false alarms": t.second.falseAlarms,
});

const table = [row("1 (published)", total(first))];
const byRepeat = new Map();
for (const r of repeats) byRepeat.set(r.repeat, [...(byRepeat.get(r.repeat) ?? []), r]);
for (const [n, rs] of [...byRepeat].sort((a, b) => a[0] - b[0])) table.push(row(String(n), total(rs.flatMap((r) => r.runs))));
console.table(table);

// Image by image across the repeats: a field that's right in some runs and not others is the run-to-run noise.
const perImage = new Map();
for (const r of repeats) {
  const condition = r.images.includes("simulated") ? "phone" : "clean";
  for (const c of r.cases) {
    const k = `${c.file} (${condition})`;
    const e = perImage.get(k) ?? { reads: 0, step: 0, ...Object.fromEntries(FIELDS.map((f) => [f, 0])) };
    e.reads++;
    if (c.outcome === c.expected) e.step++;
    for (const f of FIELDS) if (c.scores?.[f] === "right") e[f]++;
    perImage.set(k, e);
  }
}
const unstable = [...perImage].filter(([, e]) => e.step % e.reads || FIELDS.some((f) => e[f] % e.reads)).map(([k, e]) => ({ image: k, ...e }));
console.log(`\n${perImage.size} images read ${repeats.length ? Math.round([...perImage.values()].reduce((a, e) => a + e.reads, 0) / perImage.size) : 0} times each in the repeats; ${unstable.length} had a field that changed from run to run:`);
console.table(unstable);
await writeFile(`${dir}/summary.json`, JSON.stringify({ table, unstable }, null, 2) + "\n");
