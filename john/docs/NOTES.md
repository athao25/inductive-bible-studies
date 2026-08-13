# Working Notes

## User preferences (carried over from the Matthew study interview, 2026-08-01)
- Mission: personal depth, not teaching prep or apologetics mastery.
- Teach method foundations, define terms, no assumed vocabulary. Glossary adherence matters.
- 20-30 min daily. Keep lessons small: one passage unit, one win.
- ESV quotations throughout. Owned: MacArthur Study Bible + Olive Tree.
- Theological frame: Reformed. In John the three teachers (MacArthur, White, Durbin) agree on the big doctrines (deity of Christ, sovereign grace in ch. 6 and 10); lessons say so. Checkpoints handled from the text: 3:5 (water and Spirit), 6:52-58 (bread and the Supper), 7:53-8:11 (manuscript question; White is the specialist witness), 15:1-8 (fruitless branches), 20:22-23 (Spirit and forgiveness). Eschatology forks from the Matthew course barely surface; John's accent is realized eschatology plus "the last day".
- Workflow: user reads passage in ESV FIRST, jots observations, then opens lesson. Lessons open by asking what they observed, then check.
- Retention: memory verses (10, listed in reference/memory-verses.html) + spaced recall quiz at the top of each lesson.
- Community prompts: yes, tied to church life.
- Build each lesson fully (no stubs). Curriculum map in docs/CURRICULUM.md covers all 21 chapters up front.
- No em dashes in any written content (user global rule). MacArthur quoted text kept verbatim, including its own punctuation.

## Course conventions
- Lesson files: lessons/NNNN-slug.html, numbered sequentially.
- Every lesson links assets/course.css and assets/quiz.js, opens with a recall quiz, ends with: application, memory verse work (when active), primary source recommendation, "ask your teacher" reminder, and links to reference docs.
- Quiz answer options: keep all options the same word count so formatting gives no clue.
- Reference docs are the durable artifacts; lessons point into them.
- reference/macarthur-notes.html would be the user's personal copy of their owned MSB John notes. NOT YET CREATED: the user has not pasted their John notes. The gitignore already excludes `*/reference/macarthur-notes.html`, so it stays private once added. Until then, lessons cite "your MacArthur Study Bible notes on John N" generically (Olive Tree) instead of deep-linking a local file, and quote the MSB sparingly from memory only when confident, marked as MacArthur's view rather than verbatim.
- Shared left sidebar: /assets/nav.js (course-agnostic) + styles in /assets/course.css. Every lesson and reference page includes `<script src="../course.js" defer></script>` then `<script src="../../assets/nav.js" defer></script>`. When adding a lesson: add one entry to the lessons array in john/course.js and update the previous lesson's `.lesson-nav` Next link. Progress persists in localStorage key `john-study-progress` (per browser).
- Theme color #2e7a4a (deep green, the vine-and-life motif). Icons generated locally (letter J, Georgia Bold, same cream #f0ece0 on solid ground as the other courses).
- This is a standalone course. It assumes no prior study track and reteaches the inductive method from zero in lesson 0001, with John 20:30-31 as the practice text.

## Pacing ledger
- STATUS 2026-08-13: course scaffolded and Unit 1 built (lessons 0001-0008, John 1-2), deployed with all four reference pages. Next lesson to write: 0009 (John 3:1-15, born again).
- Full course plan: 60 lessons across 8 units; see CURRICULUM.md for the complete lesson-by-lesson map.
- Unit 1 (ch. 1-2): 0001-0008. Orientation is 0001 (how to study Scripture) and 0002 (big picture of John); exposition starts at 0003. Unit 2 (ch. 3-4): 0009-0015. Unit 3 (ch. 5-6): 0016-0023. Unit 4 (ch. 7-8): 0024-0030. Unit 5 (ch. 9-10): 0031-0035. Unit 6 (ch. 11-12): 0036-0042. Unit 7 (ch. 13-17): 0043-0051. Unit 8 (ch. 18-21): 0052-0060.
- Each unit closes with a recap lesson (0008, 0015, 0023, 0030, 0035, 0042, 0051) and the course closes with a capstone (0060).
- Memory verse activation points: v1 (1:14) in 0002, v2 (3:16) in 0010, v3 (6:35) in 0020, v4 (8:12) in 0027, v5 (10:27-28) in 0033, v6 (11:25-26) in 0037, v7 (14:6) in 0045, v8 (15:5) in 0047, v9 (16:33) in 0049, v10 (20:30-31) in 0057.
- Doctrine checkpoints: #1 at 3:5 (lesson 0009), #2 at 6:41-59 (0021), #3 at 7:53-8:11 (0026), #4 at 15:1-8 (0047), #5 at 20:22-23 (0057).
- Estimated full course: ~60 lessons over ~3-4 months at daily cadence.

## Repo notes
- Course lives in the shared `inductive-bible-studies` monorepo, published at https://athao25.github.io/inductive-bible-studies/ under `/john/`.
- CSS, quiz widget, and sidebar logic are shared at `/assets/`; only lesson/reference HTML, `course.js`, and icon art are course-specific.
- Course docs (this file, MISSION, CURRICULUM, RESOURCES, learning-records) live under `john/docs/`.
