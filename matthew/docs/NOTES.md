# Working Notes

## User preferences (from the study interview, 2026-08-01)
- Mission: personal depth, not teaching prep or apologetics mastery.
- New to serious study: teach method foundations, define terms, no assumed vocabulary. Glossary adherence matters.
- 20-30 min daily. Keep lessons small: one passage unit, one win.
- ESV quotations throughout. Owned: MacArthur Study Bible + Olive Tree.
- Theological frame: Reformed. Postmil (Durbin) is the home lens; MacArthur (premil/futurist) and White (amil) alternatives flagged honestly at the big passages. Fork checkpoints: Matt 5:17-20 (law), ch. 13 (kingdom parables), 16:18-19 (church and keys), ch. 24-25 (Olivet Discourse, the big one: postmil partial-preterist home reading vs the MSB's consistently futurist reading, argued from the text), 28:18-20 (Great Commission).
- Workflow: user reads passage in ESV FIRST, jots observations, then opens lesson. Lessons open by asking what they observed, then check.
- Retention: memory verses (10, one per unit, listed in reference/memory-verses.html) + spaced recall quiz at the top of each lesson.
- Community prompts: yes, tied to church life.
- Build each lesson fully (no stubs). Curriculum map in reference/matthew-book-map.html covers all 28 chapters up front.
- No em dashes in any written content (user global rule). MacArthur quoted text kept verbatim, including its own punctuation.

## Course conventions
- Lesson files: lessons/NNNN-slug.html, numbered sequentially.
- Every lesson links assets/course.css and assets/quiz.js, opens with a recall quiz, ends with: application, memory verse work (when active), primary source recommendation, "ask your teacher" reminder, and links to reference docs.
- Quiz answer options: keep all options the same word count so formatting gives no clue.
- Reference docs are the durable artifacts; lessons point into them.
- reference/macarthur-notes.html = user's personal copy of their owned MacArthur Study Bible Matthew notes (pasted by user 2026-08-01), per-chapter anchors ch01-ch28. PRIVATE USE ONLY: never publish as an Artifact or share beyond this workspace; it is copyrighted material the user owns. Lessons may deep-link (#chNN) and should engage its futurist readings critically per the course's postmil home lens (caveat card is in the file header). Quoted text kept verbatim, including its own punctuation. NOT PUBLISHED: gitignored in the consolidated repo so it never reaches the public GitHub Pages site; lesson deep-links to it were removed when the courses were merged.
- Shared left sidebar: /assets/nav.js (course-agnostic) + styles in /assets/course.css, both shared across all courses. Every lesson and reference page includes `<script src="../course.js" defer></script>` then `<script src="../../assets/nav.js" defer></script>`. When adding a lesson: add one entry to the lessons array in matthew/course.js, nothing else. Mark-complete progress persists in localStorage key `matthew-study-progress` (per browser).
- Theme color #2e3a7a (royal blue, the King motif). Icons generated locally (letter M).
- This is a standalone course. It assumes no prior study track and teaches the inductive method from zero in lesson 0001.

## Pacing ledger
- STATUS 2026-08-01: all 79 lessons built and deployed. The course is complete end to end, Matthew 1:1 through 28:20 plus a capstone.
- Full course is 79 lessons across 8 units; see CURRICULUM.md for the complete lesson-by-lesson map.
- Unit 1 (ch. 1-4): lessons 0001-0010. Orientation is 0001 (how to study Scripture) and 0002 (big picture of Matthew); exposition starts at 0003.
- Unit 2 (ch. 5-7): 0011-0021. Unit 3 (ch. 8-10): 0022-0029. Unit 4 (ch. 11-13): 0030-0038. Unit 5 (ch. 14-18): 0039-0050. Unit 6 (ch. 19-23): 0051-0061. Unit 7 (ch. 24-25): 0062-0069. Unit 8 (ch. 26-28): 0070-0079.
- Each unit closes with a recap lesson (0010, 0021, 0029, 0038, 0050, 0061, 0069) and the course closes with a capstone (0079).
- Memory verse activation points: v1 (1:21) in 0002, v2 (4:4) in 0009, v3 (5:17) in 0013, v4 (6:33) in 0017, v5 (9:13) in 0024, v6 (11:28-30) in 0031, v7 (16:24-25) in 0045, v8 (22:37-39) in 0058, v9 (24:35) in 0064, v10 (28:18-20) in 0078.
- Eschatology forks: #1 at 5:17-20 (lesson 0013), #2 at ch. 13 parables (0036), #3 at 16:18-19 (0044), #4 the Olivet Discourse (0062-0069, the main one, argued at 0064), #5 at 28:18-20 (0078).
- Estimated full course: ~79 lessons over ~4-6 months at daily cadence.

## Repo consolidation (2026-08-02)
- This course moved from its own repo into the shared `inductive-bible-studies` monorepo, published at https://athao25.github.io/inductive-bible-studies/ under `/matthew/`.
- CSS, quiz widget, and sidebar logic are now shared at `/assets/`; only lesson/reference HTML, `course.js`, and icon art are course-specific.
- Course docs (this file, MISSION, CURRICULUM, RESOURCES, learning-records) live under `matthew/docs/`.
