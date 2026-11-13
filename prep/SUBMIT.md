# Submitting to DSH Hacks V2

**Deadline: Nov 14, 2026, 11:45 PM PST** (1:45 AM Central on Nov 15), from the Devpost schedule page. The Rules tab still says Nov 8; that's stale. Submit a day early: Devpost's submit button has broken before, and you can keep editing the entry until the deadline.

DSH asks for four things: the project, a demo video, a one-page PDF, and the GitHub repository or a code PDF. All of the files are in `submission/` (not in git; rebuild with the commands at the bottom).

## 1. Upload the video (YouTube, Unlisted)

Upload `demo/AppealPath-demo.mp4` (3:14, 1080p). It's narrated by a computer voice (macOS), and the closing credits say so. If you have time to record your own voice over `demo/AppealPath-demo-silent.mp4` with `prep/DEMO-SCRIPT.md`, do it, but don't let it hold up submitting: you can swap the link on Devpost until the deadline.

- **Title:** AppealPath: from a health-insurance denial letter to one next step (DSH Hacks V2)
- **Description:**

  ```
  Take a photo of a health-insurance denial letter and answer 6 questions. An AI copies the facts, a second reader on your phone checks them against the photo, you confirm, and six fixed rules pick one next step: fix the paperwork, appeal, urgent review, or external review.

  Built solo for DSH Hacks V2 (AI x Healthcare). A prototype, not medical or legal advice. Every letter shown is fictional. Narration: computer voice (macOS).

  Try it: https://appealpath.7zhvt4rjzh.workers.dev
  Code: https://github.com/h6ctqtwkkg-byte/appealpath
  ```

- **Visibility:** Unlisted (anyone with the link can watch). Set "No, it's not made for kids".

Send Claude the link. It goes into the write-up and the one-pager, and the one-pager PDF gets re-rendered.

## 2. On Devpost

Sign in at https://dsh-hacks-v2.devpost.com, click **Join hackathon** if you haven't, then **Enter a submission**. Paste from `prep/DEVPOST.md`:

| Devpost field | What to put |
|---|---|
| Project name | AppealPath |
| Elevator pitch | The "Elevator pitch" line (179 characters; the limit is 200) |
| About the project | Everything under "About the project", from "### Inspiration" to the end of "What's next". Devpost takes Markdown. |
| Built with | cloudflare-workers, workers-ai, gemma, llama, tesseract.js, preact, typescript, esbuild, vitest |
| "Try it out" links | https://appealpath.7zhvt4rjzh.workers.dev and https://github.com/h6ctqtwkkg-byte/appealpath |
| Video demo link | the YouTube link |
| Image gallery | `submission/gallery/1-cover.png` to `7-real-letters.png`, in order. The first becomes the thumbnail. |
| One-page PDF | `submission/AppealPath-one-pager.pdf` |
| GitHub / code PDF | the GitHub link, and upload `submission/AppealPath-code.pdf` if there's a file box |
| Prizes, if asked | the main prizes, and **Best Research-Oriented Project (YRI)** |

Answer the hackathon's own questions (school, age and so on) yourself. Then press **Submit**, not just Save. Open the project page signed out to check it shows, and every link opens.

If the submit button fails, try another browser, then email the hackathon manager (link at the bottom of the Devpost overview page) with the links and PDFs before the deadline.

## Rebuilding the files

```bash
cd /Users/nbrew/AppealPath && node scripts/code-pdf.mjs && git archive --format=zip -o submission/AppealPath-source.zip HEAD && mkdir -p submission/gallery && cp docs/gallery/*.png submission/gallery/
```

The one-pager: see `prep/ONE-PAGER.md`, then copy `prep/AppealPath-one-pager.pdf` into `submission/`.
