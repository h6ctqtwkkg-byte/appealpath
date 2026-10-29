# One-page description

The submission PDF is **`prep/AppealPath-one-pager.pdf`**, built from `prep/one-pager.html`, with the numbers measured on Oct 28, 2026.

Before submitting:
1. Replace the yellow "add the link here before submitting" text in `one-pager.html` with the demo video link.
2. If you measure real phone photos, add a row to its "How well it works" table with those numbers.
3. Re-render the PDF:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --print-to-pdf="$PWD/prep/AppealPath-one-pager.pdf" "file://$PWD/prep/one-pager.html"
```

It must stay one page: shorten text rather than shrinking the font further.
