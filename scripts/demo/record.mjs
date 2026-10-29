// Builds the draft demo video: speaks each line of scripts/demo/narration.json with the macOS voice, records the live
// app doing the matching steps inside a phone frame (scripts/demo/stage.html), and mixes them with ffmpeg.
//   node scripts/demo/record.mjs            → demo/AppealPath-demo.mp4 and demo/AppealPath-demo-silent.mp4
//   APP_URL=http://localhost:8792 HEADED=1 node scripts/demo/record.mjs
// One scene uploads a simulated phone photo for a real read (about 14 neurons); the rest use the sample letters.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { chromium } from "playwright-core";

const BASE = process.env.APP_URL ?? "https://appealpath.7zhvt4rjzh.workers.dev";
const OUT = "demo";
const PHOTO = "test-letters/phone-like/L01.jpg";
const { voice, rate, scenes } = JSON.parse(await readFile("scripts/demo/narration.json", "utf8"));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. Speak every line and measure it, so each scene lasts at least as long as its narration.
await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/audio`, { recursive: true });
for (const s of scenes) {
  const file = `${OUT}/audio/${s.id}.aiff`;
  execFileSync("say", ["-v", voice, "-r", String(rate), "-o", file, s.text]);
  s.seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]).toString());
}

// A soft dot that follows the mouse inside the app, since recordings don't show the real cursor.
const cursor = () => {
  if (location.protocol === "file:") return;
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.style.cssText =
      "position:fixed;left:0;top:0;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:rgba(31,63,110,.22);" +
      "border:2px solid rgba(31,63,110,.8);z-index:99999;pointer-events:none;transition:transform .08s linear,background .2s;transform:translate(-80px,-80px)";
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => (c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`), true);
    addEventListener("mousedown", () => {
      c.style.background = "rgba(31,63,110,.6)";
      setTimeout(() => (c.style.background = "rgba(31,63,110,.22)"), 220);
    }, true);
  });
};

// 2. Record.
const browser = await chromium.launch({ channel: "chrome", headless: !process.env.HEADED });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: "en-US" });
await context.addInitScript(cursor);
const page = await context.newPage();

// Chrome's screencast sends a frame whenever the screen changes; each frame is held until the next one arrives.
await mkdir(`${OUT}/frames`, { recursive: true });
const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const file = `${OUT}/frames/${String(frames.length).padStart(6, "0")}.jpg`;
  frames.push({ file, at: metadata.timestamp * 1000 });
  await writeFile(file, Buffer.from(data, "base64"));
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
const t0 = Date.now();
const starts = [];
await page.goto(new URL("stage.html", import.meta.url).href);
const app = page.frameLocator("#app");

async function open(path) {
  await page.evaluate((src) => (document.getElementById("app").src = src), BASE + path);
  await app.locator("main h1").first().waitFor({ timeout: 20_000 });
  await wait(600);
}
async function smoothTo(locator, block = "start") {
  await locator.evaluate((el, b) => el.scrollIntoView({ behavior: "smooth", block: b }), block);
  await wait(900);
}
async function point(locator) {
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 22 });
  await wait(180);
}
async function tap(locator) {
  await smoothTo(locator, "center");
  await point(locator);
  await locator.click();
  await wait(350);
}
async function secondReaderDone() {
  await app.locator(".second").first().waitFor({ timeout: 20_000 }).catch(() => {});
  for (let i = 0; i < 60 && (await app.locator(".second.running").count()) > 0; i++) await wait(500);
}
async function scene(id, actions) {
  const s = scenes.find((x) => x.id === id);
  const start = Date.now();
  starts.push({ id, at: (start - t0) / 1000 });
  await page.evaluate(([l, t]) => window.setScene(l, t), [s.label, s.text]);
  await actions();
  const left = s.seconds + 0.8 - (Date.now() - start) / 1000;
  if (left > 0) await wait(left * 1000);
}

await open("/");
await scene("intro", async () => {
  await wait(2500);
  await point(app.locator("h1").first());
});
await scene("upload", async () => {
  await point(app.locator("label.btn").first());
  await app.locator('input[type="file"]').setInputFiles(PHOTO);
  await wait(700);
  for (const [name, value] of [["plan", "job"], ["care", "no"], ["harm", "no"], ["resubmitted", "no"]]) {
    await tap(app.locator(`input[name="${name}"][value="${value}"]`).locator("xpath=.."));
  }
  await smoothTo(app.locator("#state"), "center");
  await point(app.locator("#state"));
  await app.locator("#state").selectOption("AR");
  await wait(400);
  await tap(app.getByRole("button", { name: "Read my letter" }));
});
await scene("check", async () => {
  const shown = await app.getByRole("heading", { name: "Check what we read" }).waitFor({ timeout: 45_000 }).then(() => true, () => false);
  if (!shown) await open("/?sample=L01"); // the live reader was busy: fall back to the captured sample
  await secondReaderDone();
  await smoothTo(app.locator("#deadline"), "start");
  await wait(1200);
  await smoothTo(app.locator("#reason"), "start");
});
await scene("fix", async () => {
  await tap(app.getByRole("button", { name: "Looks right, show my next step" }));
  await wait(1800);
  await smoothTo(app.locator(".script").first(), "center");
});
await scene("appeal", async () => {
  await open("/?sample=L02&result");
  await wait(1500);
  await smoothTo(app.locator(".deadline"), "start");
  await wait(2200);
  await smoothTo(app.locator(".appeal-letter"), "start");
});
await scene("urgent", async () => {
  await open("/?sample=L03&result");
  await wait(2500);
  await smoothTo(app.locator(".script").first(), "center");
});
await scene("second", async () => {
  await open("/?sample=L02");
  await secondReaderDone();
  await smoothTo(app.locator("#deadline"), "center");
  await wait(1500);
  await tap(app.locator(".second .linkish").first());
  await wait(1500);
});
await scene("how", async () => {
  await open("/#how");
  await wait(1500);
  await smoothTo(app.locator(".run").first(), "start");
  await wait(2500);
  await smoothTo(app.locator(".run").nth(1), "start");
});
await scene("spanish", async () => {
  await open("/?sample=L03&result");
  await wait(800);
  await tap(app.getByRole("button", { name: "Español" }));
  await wait(800);
});
await scene("end", async () => {
  await tap(app.getByRole("button", { name: "English" }));
  await open("/");
  await wait(1500);
});
await wait(1200);
await cdp.send("Page.stopScreencast");
const ended = Date.now();
await context.close();
await browser.close();

// Frames → a constant 30 fps video. The concat list holds each frame until the next one.
const first = frames[0].at;
const list = frames.map((f, i) => `file '${f.file.replace(`${OUT}/`, "")}'\nduration ${(((frames[i + 1]?.at ?? ended) - f.at) / 1000).toFixed(3)}`);
await writeFile(`${OUT}/frames.txt`, list.join("\n") + `\nfile '${frames.at(-1).file.replace(`${OUT}/`, "")}'\n`);
const raw = `${OUT}/raw.mp4`;
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", `${OUT}/frames.txt`, "-vf", "fps=30,scale=1920:1080:flags=lanczos", "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", raw]);
const offset = (first - t0) / 1000; // scene times are measured from t0; the video starts at the first frame

// 3. Mix: each line starts with its scene.
const inputs = ["-i", raw];
const filters = [];
starts.forEach((s, i) => {
  inputs.push("-i", `${OUT}/audio/${s.id}.aiff`);
  const ms = Math.max(0, Math.round((s.at - offset) * 1000 + 400));
  filters.push(`[${i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${ms}|${ms}[a${i}]`);
});
const mix = `${filters.join(";")};${starts.map((_, i) => `[a${i}]`).join("")}amix=inputs=${starts.length}:normalize=0[a]`;
const video264 = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart"];
execFileSync("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", mix, "-map", "0:v", "-map", "[a]", ...video264, "-c:a", "aac", "-b:a", "160k", `${OUT}/AppealPath-demo.mp4`]);
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, ...video264, "-an", `${OUT}/AppealPath-demo-silent.mp4`]);

const length = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", `${OUT}/AppealPath-demo.mp4`]).toString());
console.log(`demo/AppealPath-demo.mp4: ${length.toFixed(1)} s`);
for (const s of starts) console.log(`  ${s.at.toFixed(1).padStart(6)} s  ${s.id}`);
