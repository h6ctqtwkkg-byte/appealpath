# VoiceOver check: 5–10 minutes on an iPhone

The accessibility tree was checked by tool (`ACCESSIBILITY.md`), but nobody has listened to the app yet. This pass is that. Use the sample letters only.

## Set up (1 minute)

1. **Turn on VoiceOver:** Settings → Accessibility → VoiceOver → on, or say "Hey Siri, turn on VoiceOver." The screen works differently while it's on:
   - **Swipe right / left:** next / previous item
   - **Double-tap anywhere:** activate the item in the box
   - **Two-finger swipe up:** read the whole screen from the top
   - **Two-finger double-tap:** stop talking
2. Open **https://appealpath.7zhvt4rjzh.workers.dev** in Safari.
3. Turn VoiceOver off the same way when you're done.

## What to listen for

Mark each line ✓ (fine), ✗ (wrong, skipped or confusing) or **?** (not sure), and write down what you heard for any ✗.

**First screen**
- [ ] The first things read are a "Skip to content" link, then the prototype banner: "Prototype. Not medical or legal advice."
- [ ] The language button is read in Spanish, as "Ver esta página en español, button".
- [ ] Each question is read with its options, like "What kind of plan is it? … Through a job, radio button, 1 of 5".
- [ ] Choose **Medicare**. The new note ("Medicare has its own appeal rules…") is read without you having to find it.
- [ ] Choose **Through a job** again. Questions 2–4 come back.
- [ ] "Take or choose a photo" is a button you can double-tap. Cancel the camera or photo picker.

**A sample letter**
- [ ] Find the sample "Physical therapy: not medically necessary" and double-tap it.
- [ ] On the new screen, VoiceOver starts at the heading "Check what we read". It shouldn't stay on the old screen or start at the top banner.
- [ ] After a few seconds, a summary like "Second check finished: 3 of 3 match your photo" is read.
- [ ] Each field reads its label, then its check result, like "Your appeal deadline … Matches your photo."
- [ ] "Show me" opens the full letter, and "Close" brings you back.
- [ ] Double-tap into "Why it was denied", type one letter with the keyboard, then swipe on. The note "You changed the reason…" and its "Yes, it still fits" button are reachable.
- [ ] Double-tap "Looks right, show my next step" without answering the note. The warning is read out, and VoiceOver moves to "Yes, it still fits". Double-tap it, then continue.

**The result**
- [ ] VoiceOver starts at the headline "Next step: file an appeal".
- [ ] The steps are read as a numbered list ("list, 4 items").
- [ ] Phone numbers are links. Double-tapping one offers to call. Cancel the call.
- [ ] "Print my appeal letter" and "Add this deadline to my calendar" are buttons with those names.

**Spanish**
- [ ] Double-tap the language button. The screen switches, and VoiceOver reads it with a Spanish voice. The button now says "View this page in English".
- [ ] Words quoted from the letter, like the deadline, are read with an English voice, not a Spanish accent on English words.

## Afterward

Send me the ✗ and ? lines with what you heard. If it all passes, I'll update `ACCESSIBILITY.md`'s "Not tested" section to say a person checked it with VoiceOver on [date, iPhone model, iOS version]. Until then, the write-up shouldn't say it's been screen-reader tested.
