// Builds submission/paste.html: each Devpost field from prep/DEVPOST.md in its own box with a Copy button, and the
// files to upload, so filling in the form is copy, paste, repeat. Open it in a browser; nothing is sent anywhere.
//   node scripts/paste-sheet.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";

const md = await readFile("prep/DEVPOST.md", "utf8");
const section = (title) => md.split(`\n## ${title}\n`)[1].split("\n## ")[0].trim();
const about = md.split("\n## About the project\n")[1].split("\n## Built with")[0].trim();
const links = section('"Try it out" links').split("\n").map((l) => l.replace(/^- /, "").trim()).filter(Boolean);
const video = section("Video demo link").match(/https:\/\/\S+/)?.[0] ?? "";

const FIELDS = [
  ["Project name", section("Project name")],
  ["Elevator pitch", section("Elevator pitch"), "Devpost allows 200 characters."],
  ["About the project", about, "Devpost takes Markdown. Paste it all into the one box."],
  ["Built with", section("Built with"), "Type each tag and press Enter, or paste the list."],
  ...links.map((l, i) => [`"Try it out" link ${i + 1}`, l]),
  ["Video demo link", video, "Use the YouTube link instead if you uploaded one."],
];
const FILES = [
  ["One-page PDF", "AppealPath-one-pager.pdf"],
  ["Code PDF (with the GitHub link)", "AppealPath-code.pdf"],
  ["Code zip, only if a box asks for one", "AppealPath-source.zip"],
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => [`Gallery image ${n}${n === 1 ? " (becomes the thumbnail)" : ""}`, `gallery/${md.match(new RegExp("`(" + n + "-[a-z-]+\\.png)`"))[1]}`]),
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AppealPath: Devpost paste sheet</title><style>
  :root { color-scheme: light dark; --bg: #f6f4ef; --card: #fff; --ink: #1a2332; --muted: #626a7a; --rule: #dcd7cb; --accent: #1f3f6e; --warn: #fff3b0; }
  @media (prefers-color-scheme: dark) { :root { --bg: #14181f; --card: #1c222c; --ink: #eef1f5; --muted: #a3acbb; --rule: #333b48; --accent: #8fb3ef; --warn: #4a3f12; } }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 860px; margin: 0 auto; padding: 24px 16px 64px; }
  h1 { margin: 0 0 4px; font-size: 24px; } h2 { font-size: 18px; margin: 32px 0 8px; }
  .field { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 12px; margin: 12px 0; }
  .head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 6px; }
  .head b { font-size: 15px; } .note { color: var(--muted); font-size: 13px; }
  textarea { box-sizing: border-box; width: 100%; font: 13px/1.45 ui-monospace, Menlo, monospace; color: inherit; background: transparent; border: 1px solid var(--rule); border-radius: 6px; padding: 8px; resize: vertical; }
  button { font: inherit; font-weight: 600; padding: 6px 14px; border-radius: 8px; border: 0; background: var(--accent); color: var(--card); cursor: pointer; min-width: 84px; }
  .warn { background: var(--warn); border-radius: 6px; padding: 8px 10px; margin: 0 0 8px; font-size: 14px; }
  ul { padding-left: 20px; } li { margin: 4px 0; } a { color: var(--accent); }
</style></head><body><main>
<h1>Devpost paste sheet</h1>
<p class="note">DSH Hacks V2 closes Nov 14, 2026, 11:45 PM PST (1:45 AM Central, Nov 15). Built from prep/DEVPOST.md; edits here aren't saved back to it.</p>
<h2>Text boxes</h2>
${FIELDS.map(([label, text, note], i) => `<section class="field"><div class="head"><span><b>${esc(label)}</b> <span class="note">${text.length.toLocaleString("en-US")} characters${note ? ` · ${esc(note)}` : ""}</span></span><button type="button" data-copy="t${i}">Copy</button></div>
${text.includes("[[") ? `<p class="warn">One sentence below is still in <code>[[ ]]</code> brackets: a draft of what you did yourself. Edit it here so it's true and in your words, and delete the brackets, before copying.</p>` : ""}<textarea id="t${i}" rows="${Math.min(Math.max(Math.ceil(text.length / 95) + text.split("\n").length / 2, 1), 24)}" spellcheck="false">${esc(text)}</textarea></section>`).join("\n")}
<h2>Files to upload</h2>
<ul>${FILES.map(([label, file]) => `<li>${esc(label)}: <a href="${esc(file)}">${esc(file)}</a></li>`).join("")}</ul>
<h2>Then</h2>
<ul><li>Answer the hackathon's own questions yourself. If prizes are listed, also pick Best Research-Oriented Project (YRI).</li><li>Press <b>Submit</b>, not just Save, then open the project page signed out and click every link.</li></ul>
</main><script>
for (const b of document.querySelectorAll("[data-copy]")) b.addEventListener("click", async () => {
  const t = document.getElementById(b.dataset.copy);
  if (t.value.includes("[[") && !confirm("This still has a [[ ]] draft sentence in it. Copy anyway?")) return;
  try { await navigator.clipboard.writeText(t.value); } catch { t.select(); document.execCommand("copy"); }
  b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1500);
});
</script></body></html>`;

await mkdir("submission", { recursive: true });
await writeFile("submission/paste.html", html);
console.log(`submission/paste.html: ${FIELDS.length} fields, ${FILES.length} files`);
