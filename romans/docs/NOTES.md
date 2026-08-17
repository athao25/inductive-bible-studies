# Working Notes

## User preferences (carried over from the Matthew, Isaiah and John studies)
- Mission: personal depth, not teaching prep or apologetics mastery.
- Teach method foundations, define terms, no assumed vocabulary. Glossary adherence matters.
- 20-30 min daily. Keep lessons small: one passage unit, one win.
- ESV quotations throughout. Owned: MacArthur Study Bible + Olive Tree.
- Theological frame: Reformed. In Romans the three teachers (MacArthur, White, Durbin) agree on the central doctrines (justification by faith alone, imputation, total inability, unconditional election in ch. 9, the security of the believer in ch. 8), and lessons say so. Live checkpoints handled from the text: 2:6-16 (judgment by works), 7:14-25 (the identity of the "I"), 8:29 (foreknew), 10:4 (end of the law), 11:26 ("all Israel"), 13:1-7 (limits of submission), 14 (disputable matters), 16:7 (Junia). Where MacArthur's dispensationalism shapes 11:25-27 more than the others', the lesson says so.
- White is the specialist witness for Romans 9; his written and spoken work on it is the fullest defence of the reading the course takes.
- Workflow: user reads passage in ESV FIRST, jots observations, then opens lesson. Lessons open by asking what they observed, then check.
- Retention: memory verses (12, listed in reference/memory-verses.html) + spaced recall quiz at the top of each lesson.
- Community prompts: yes, tied to church life.
- Build each lesson fully (no stubs). Curriculum map in docs/CURRICULUM.md covers all 16 chapters up front.
- No em dashes in any written content (user global rule). Colons, commas, semicolons and parentheses do the work instead.

## Course conventions
- Lesson files: lessons/NNNN-slug.html, numbered sequentially.
- Every lesson links assets/course.css + assets/lms.css and assets/quiz.js, opens with a recall quiz over the previous three lessons, and ends with: application (God / you / do), "Check yourself" quiz, "Before next lesson" reading assignment, primary source recommendation, church prompt, an "ask your teacher" footnote, and prev/next nav.
- Quiz answer options: keep all options roughly the same word count so formatting gives no clue.
- Recap lessons carry "· Recap" on the kicker so `scripts/build-course-data.js` folds them into the unit above; the capstone carries its own kicker ("Course capstone: Chapters 1-16") and therefore forms its own group, matching Matthew.
- Reference docs are the durable artifacts; lessons point into them by anchor (`glossary.html#justification`, `memory-verses.html#v7`).
- reference/macarthur-notes.html would be the user's personal copy of their owned MSB Romans notes. NOT YET CREATED. The repo gitignore already excludes `*/reference/macarthur-notes.html`, so it stays private once added. Until then lessons cite "your MacArthur Study Bible notes on N:N" generically (Olive Tree) instead of deep-linking, and never quote the MSB verbatim.
- Theme color #5a2e7a (plum, distinct from Matthew blue, John green, Isaiah maroon, Trinity cream). Icons generated locally: "Ro" in Liberation Serif, cream #f3eee8 on a plum gradient, with the framed "ROMANS" 512 variant matching the Isaiah pattern.
- This is a standalone course. It assumes no prior study track and reteaches the inductive method from zero in lesson 0001, with Romans 1:16-17 as the practice text.

## Romans-specific teaching decisions
- Two extra method skills are taught in lesson 0001 because the letter is argument rather than narrative: reading the connectors ("for", "therefore", "but now", "much more") and identifying the diatribe objector ("What shall we say then?" / "By no means!").
- Unit boundaries follow the argument rather than the chapter numbers, so Unit 1 ends at 3:20 and Unit 2 begins at 3:21. The kickers name the ranges explicitly ("Unit 1: Chapters 1:1-3:20").
- Romans 1:26-27 is handled in lesson 0006 by stating what the text says and then insisting on the paragraph's own trajectory into 1:29-31 and 2:1, so the passage cannot be used as a weapon. The lesson says both things plainly.
- Romans 7:14-25 (lesson 0025) presents three readings and states where the course lands (the believer attempting sanctification by law), noting that MacArthur differs, and grounding the argument in the paragraph's missing Spirit.
- Romans 9 (lessons 0032-0033) argues the individual-election reading primarily from the objections Paul anticipates at 9:14 and 9:19, and holds it together with 9:32 and 10:21 rather than letting either side win by silencing the other. The recap at 0040 tabulates the two truths side by side without offering a formula.
- Romans 14 is treated as the pastoral payoff of chapters 9-11, not as an appendix; the disputable-matters test is drawn from 14:6 ("both can give thanks") rather than from a list of modern issues.

## Pacing ledger
- STATUS 2026-08-17: COURSE COMPLETE. All 52 lessons written (0001-0052), covering all 16 chapters, 5 units plus orientation and capstone, all 12 memory verses, and all 14 doctrine checkpoints. Verified: course.js matches disk, `scripts/build-course-data.js` parses every lesson (52L/7U/52Q), lesson-nav chain unbroken 0001 to 0052, every glossary and memory-verse anchor resolves, no em dashes, inline quiz scripts pass `node --check`.
- Full course plan: 52 lessons; see CURRICULUM.md for the lesson-by-lesson map. Built to that map with no deviations in slugs or passage divisions.
- Orientation 0001-0002. Unit 1 (1:1-3:20): 0003-0011. Unit 2 (3:21-5:21): 0012-0020. Unit 3 (6-8): 0021-0031. Unit 4 (9-11): 0032-0040. Unit 5 (12-16): 0041-0051. Capstone: 0052.
- Each unit closes with a recap lesson (0011, 0020, 0031, 0040, 0051).
- Estimated full course: ~52 lessons over ~2-3 months at daily cadence.

## Repo notes
- Course lives in the shared `inductive-bible-studies` monorepo, published at https://athao25.github.io/inductive-bible-studies/ under `/romans/`.
- CSS, quiz widget, store and shell logic are shared at `/assets/`; only lesson/reference HTML, `course.js`, and icon art are course-specific.
- Adding the course touched four shared files: `scripts/build-course-data.js` (META entry + course list), `scripts/build-seed-sql.js` (ORDER), `scripts/retrofit-pages.js` (COURSES), and `courses.html` (canon map link), plus the README table.
- Course docs (this file, MISSION, CURRICULUM, RESOURCES, learning-records) live under `romans/docs/`.
