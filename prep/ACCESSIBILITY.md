## Accessibility audit: AppealPath
**Standard:** WCAG 2.1 AA (plus 2.5.8 target size from 2.2) | **Date:** Oct 28, 2026 | **Checked on:** the local build, Chrome, light and dark mode, 320px to 1280px wide

### Summary
**Issues found:** 7 | **Critical:** 0 | **Major:** 3 | **Minor:** 4. **All 7 are fixed.**

### Findings

#### Perceivable
| # | Issue | WCAG criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 1 | Small gray labels (step names, question numbers, "From your letter") were 4.34–4.49:1 on the light background | 1.4.3 Contrast | 🟡 Major | `--ink-3` darkened to #626a7a (4.95–5.13:1) |
| 2 | Text-box borders and radio circles were 2.1:1 against white (2.06:1 in dark mode), so the controls were hard to make out | 1.4.11 Non-text contrast | 🟡 Major | New `--control` token: #857f70 in light (3.99:1), #778195 in dark (4.08:1) |

#### Operable
| # | Issue | WCAG criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 3 | The photo picker's real file input is visually hidden, so keyboard focus on it was invisible | 2.4.7 Focus visible | 🟡 Major | A focus ring on its label (`label.btn:focus-within`) |
| 4 | "Show me" (21px tall), the language toggle (23px) and "Back to the questions" (24px) had small tap areas | 2.5.8 Target size | 🟢 Minor | Text-style buttons now get a 44px tap area ("Show me": 32px) without looking like buttons |
| 5 | Smooth scrolling ignored the reduced-motion setting | 2.3.3 (AAA, good practice) | 🟢 Minor | Scrolling is instant when reduced motion is on |

#### Understandable
| # | Issue | WCAG criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 6 | The progress steps had an English-only label in Spanish mode | 3.1.2 Language of parts | 🟢 Minor | Translated ("Progreso") |

#### Robust
| # | Issue | WCAG criterion | Severity | Fix |
|---|-------|---------------|----------|-----|
| 7 | Moving from one screen to the next didn't move focus, so a screen reader wouldn't announce the new step | 4.1.3 Status messages / 2.4.3 Focus order | 🟢 Minor | Focus moves to each new screen's heading. The letter link also got a name: "Open your letter full size" |

### Color contrast check (after fixes)
| Element | Light | Dark | Required | Pass? |
|---------|-------|------|----------|-------|
| Body text on the page | 14.36:1 | 15.71:1 | 4.5:1 | ✅ |
| Secondary text | 6.84:1 | 9.61:1 | 4.5:1 | ✅ |
| Small labels | 4.95:1 | 6.58:1 | 4.5:1 | ✅ |
| Links and secondary buttons | 9.58:1 | 8.52:1 | 4.5:1 | ✅ |
| Primary button text | 10.53:1 | 8.76:1 | 4.5:1 | ✅ |
| Quoted letter text | 14.88:1 | 13.42:1 | 4.5:1 | ✅ |
| Result headings: Fix / Appeal / Urgent / guard | 5.60 / 7.07 / 6.51 / 5.91 | 7.84 / 7.41 / 6.99 / 7.58 | 4.5:1 | ✅ |
| Emergency line | 6.80:1 | 8.06:1 | 4.5:1 | ✅ |
| Input and radio borders | 3.99:1 | 4.08:1 | 3:1 | ✅ |
| Focus ring | 4.38:1 | 8.52:1 | 3:1 | ✅ |

### Already right
- Every input, select and text area has a label; radio groups use `fieldset` + `legend`; every button and link has a name.
- One `main` per screen, plus a header, nav and footer; headings in order; a "Skip to content" link.
- Errors are spelled out ("Still needed: your state") in `role="alert"` notices, not shown by color alone.
- The second reader's results use a ✓ or ! mark plus words, never color alone.
- `<html lang>` follows the language toggle, and text copied from the letter is marked `lang="en"` in Spanish mode.
- No horizontal scrolling at 320px; tables scroll inside their own box.

### Keyboard navigation
| Element | Tab order | Enter/Space | Notes |
|---------|-----------|-------------|-------|
| Skip link → home → language → How it decides | 1–4 | Follows the link / switches language | Skip link appears on focus |
| "Try a sample letter" | 5 | Scrolls to the samples and focuses the first one | |
| Photo picker | 6 | Opens the file or camera picker | Focus ring on the label |
| Question groups | 7+ | Arrow keys move within a group | Native radios |
| Read my letter / enter by hand | After the questions | Runs it | Missing answers are announced |

### Not tested
- **A real screen reader** (VoiceOver or NVDA). The structure is checked in code, but nobody has listened to it yet. Do a 5-minute VoiceOver pass on an iPhone before demo day.
- **200% browser zoom** was covered only by the 320px layout check, not tested on its own.
