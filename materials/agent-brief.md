# Agent brief - shared by every fan-out page of learn-focus-with-phoebe

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk with more than 20 lines, do not write it; report that and stop.** (A one-line
`<!-- placeholder -->` file is NOT a finished page: overwrite it.) Write the file, return its path
and one line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page. Copy its structure, classes, SVG grammar and quiz markup EXACTLY, including
   four options per question:
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-focus-with-phoebe/courses/01-what-attention-is.html`
   For rhythm only (do not copy its content): the bench page
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-focus-with-phoebe/courses/04-the-attention-bench.html`
2. The source map: every verified number, its evidence tier, per-session coverage, the seams, the
   bench canon. Use ONLY its numbers; never invent a statistic; if a fact is missing, teach the
   uncertainty. `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-focus-with-phoebe/materials/official-course-map.md`
3. The stylesheet `:root` block (first 30 lines) for the palette tokens:
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-focus-with-phoebe/assets/style.css`

## Page skeleton (keep every component)

toolbar (crumb EXACTLY `<a href="../index.html">learn-focus-with-phoebe</a> / Session N of 6`,
#toggle-all, #zoom-toggle) · masthead (eyebrow "Learn Focus with Phoebe · Session N of 6", h1 with
one `<span class="accent">`, .sub, .chip-row with the level chip given in your outline, two
`.chip.audience`, `.chip.time` "45 min", .agenda a1-a4) · main.wrap · section#intro (Part 0: kicker,
.lede that names Tomas as constructed, .legend pills as in the template, .callout.win "★ What you
walk out with tonight.") · 3 Parts, each `section.section#part-N` with section-kicker (klabel
"Part N · covers ...", h2, `.tag.concept "N min live"`), a `.lede`, ONE figure, `details.card`
accordions (summary: `.mode.live` or `.mode.self`, title, `.mini`, `.caret ▶`), at least one
`.callout.example` with `span.ex-pill` "Real world" on the page · section#demo-1 Build-along
(kicker `.tag.demo "★ 22 min · everyone builds"`, .lede, ONE figure, `.steps > .step`, each with a
`p` then a `.prompt-box.good` carrying a `span.label` "★ Step N · ..."; six steps) ·
section#exercise Homework (ol, 4 items) · section#quiz (3 x `.quiz-q data-answer="0-based"`,
`p.qtext`, four `button.qopt` "A · ...", `p.qwhy`; one `p.quiz-score` after the last) ·
section#official, h2 EXACTLY "What this session teaches, and where it came from",
`.covered > .covered-row` (pill solid ✓ / light ◐ + name + note), then the `.mono` line EXACTLY
"Every fact on this page, and its verification tier, is recorded in the course's source map." ·
section.cheat#cheatsheet (h3 "Session N cheat sheet <span>· pin this</span>", .grid-2 of six
.cheat-item) · `.callout.next` with `.nx-pill` "Next session" · footer.pagefoot ·
`<script src="../assets/app.js?v=1"></script>`.

Head: the template's social meta block with this page's own title/description/url;
`<title>Session N · <Title> - learn focus with phoebe</title>`;
`<link rel="stylesheet" href="../assets/style.css?v=1">`. Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm
practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<` `>`. 450 to 650 lines
is guidance about depth, never a target: never collapse whitespace, dissolve a list into a
paragraph, or drop a component to fit.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact estate phrases above are the only
  self-references; "session 5" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or is labelled constructed. Tomas's numbers say constructed. For
  bench numbers quote only the canon table in the map, and call them modelled.
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not.
- Citations in the exact form of the map's appendix; anything tiered R is "reported".
- NEVER "lottery" or "lotteries"; say the mechanism. Default to English words; no Chinese terms.
- Titles, widget ids and class names must not collide with siblings. Banned titles: "A system you
  keep", "The one-page marketing plan", "Is it worth the time?", "Where your week actually goes",
  "The wandering mind: the actual skill you are training". Use exactly the title in your outline.
- Health: NOT medical advice. Never diagnose, never dose, never promise a symptom outcome. Where a
  page touches health (fatigue, sleepiness, persistent inattention, ADHD-like symptoms), say once
  when to see a doctor. Session 1 and the landing page already carry the full notice.
- Learner-recorded data stays with the learner (paper, their own notes); never ask them to submit.
- Quiz answer letters: use exactly the data-answer values given in your outline.
- Never use the words "demo" for a movement or person; no AI images; figures are inline SVG only.
- Wellbeing myths in the map's "kept off the pages" list stay off the pages.

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): ink #15232D · muted #4D5F6B · primary #2B5C78 ·
deep #1B3E54 · mid #3D7699 · soft #BED4E3 · tint #EEF4F8 · faint #C8D5DE · hairline #E1E9EF ·
saffron solid #9A5B00 (white text on it is fine) · saffron ink #6A3F00 (text) · saffron tint
#FDF3DF · light saffron #E0A030 (fill ONLY, never under text, never as text) · `#FFFFFF` ·
universal reds `#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="the data, not the shape">` > `<defs>` + `<style>` + content, then
  `<figcaption>🔍 Click to zoom - takeaway</figcaption>`. Grow H, never W.
- Prefix unique per figure, used for every class and id: `f<session><letter>` (session 2 uses
  f2a, f2b, f2c, f2d; session 3 f3a...; never reuse the template's f1*).
- `<defs>` holds with the figure prefix P: a wobble filter `id="PSk"` (`feTurbulence
  type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="<int>"` + `feDisplacementMap
  scale="2.4" xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%" width="106%"
  height="106%"`), optionally a hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one
  #2B5C78 line, opacity .5), an open arrowhead `id="PAr"` (path `M1 1 L9 5 L1 9`, fill none, ink
  stroke 1.6). ALL shapes sit inside ONE `<g filter="url(#PSk)" fill="none" stroke="#15232D"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`; rects carry a tiny rotation
  (-4 to 4 degrees for hand-placed items, under 1 for panels). Fills: white, tint, the hachure for
  "the pile" or "the data", and saffron ONLY for the one thing the figure is about. One doodle
  anchor per figure (a stick figure, a phone outline, a clock), simple strokes, never a mascot.
- Text classes (copy the template's `<style>` lines with your prefix): `.PH` 800 12px ink heading
  · `.PL` 600 12px ink label · `.PS` 400 11px muted · `.PB` 800 11px #6A3F00 · `.PV` 800 13-20px
  #1B3E54 value · `.PW` 800 11px white on a #2B5C78 or #9A5B00 fill · `.PA` 700 11px #2B5C78 axis
  caption · `.PN` 400 12px muted note · `.PR` 800 11-12px #991B1B for a wrong-way label.
- ALL `<text>` outside the filtered group, never below 10.5px, never inside a shape whose fill is
  #E0A030.
- Fit: max chars about (box width - 20) / 7 at 12px, 6.4px/char at 11px; full-width note under
  110 chars; 40px between neighbouring point labels; bottom note 22px below the last row, H clears
  it by 8px. No path, arrow or gridline may cross a label (the gate flags line-through-text). When
  in doubt, shorten.
- Floor: one figure per Part plus one in the build-along (four figures). Draw the MECHANISM, never a
  metaphor literally, never decoration.

## Voice and honesty

Every Part gets a real-world story (a `.callout.example` "Real world" on at least one Part; the
others can be cards): use only the map's studies or generic, clearly hypothetical workplace
situations, never invented statistics. Tomas is constructed: say so in Part 0 and in the build-along
lede. Tomas works in an open-plan office as a data engineer; colleagues Priya, Marco and Ana appear
in his chat (all constructed).

## Cross-links (absolute URLs)

- Time Management session 5 (owns interruption and switching costs; link, never re-teach its
  numbers): https://phoebefu6.github.io/learn-time-management-with-phoebe/courses/05-interruptions-and-switching.html
- AI Productivity (owns AI triage of messages): https://phoebefu6.github.io/learn-ai-productivity-with-phoebe/
- Meditation session 4 (owns mind-wandering as a meditation skill):
  https://phoebefu6.github.io/learn-meditation-with-phoebe/courses/04-wandering-mind.html
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chain and session titles

1 `01-what-attention-is.html` What attention is, and what it is not
2 `02-when-the-mind-leaves.html` When the mind leaves the task
3 `03-why-focus-fades.html` Why focus fades over an hour
4 `04-the-attention-bench.html` The attention bench
5 `05-the-room-and-the-phone.html` Designing the room and the phone
6 `06-a-focus-block-you-keep.html` A focus block you can keep

Footer left: `Session N of 6 · learn-focus-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>`
Footer right: `<a href="0(N-1)-....html">← Prev: <title></a> &nbsp;·&nbsp; <a href="0(N+1)-....html">Next: <title> →</a>`
(last page: "← Prev: ..." and `<a href="../index.html">Course home</a>`).

## Self-check before you finish

Count `<details` vs `</details>`, `<section` vs `</section>`, `<figure` vs `</figure>`; grep your
file for the characters U+2014 and U+2013 (must be zero) and for "this course" (must be zero).
