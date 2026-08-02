# Working Notes

## User preferences (from initial interview, 2026-07-17)
- Mission: personal depth, not teaching prep or apologetics mastery
- New to serious study: teach method foundations, define terms, no assumed vocabulary. Glossary adherence matters.
- 20-30 min daily. Keep lessons small: one passage unit, one win.
- ESV quotations throughout. Owned: MacArthur Study Bible + Olive Tree.
- Theological frame: Reformed. Postmil (Durbin) is the home lens for kingdom passages; flag MacArthur (premil) and White (amil) alternatives honestly at Isa 2, 11, 24-27, 60, 65-66.
- Workflow: user reads passage in ESV FIRST, jots observations, then opens lesson. Lessons should open by asking what they observed, then check.
- Retention: memory verses (~15, one per section, listed in reference/memory-verses.html) + spaced recall quiz at the top of each lesson.
- Community prompts: yes, tied to church life.
- User asked for "complete entire lessons": build each lesson fully (no stubs). Course generated in batches as the learner progresses (zone of proximal development requires seeing learning records first); curriculum map in reference/isaiah-book-map.html covers all 66 chapters up front.
- No em dashes in any written content (user global rule).

## Course conventions
- Lesson files: lessons/NNNN-slug.html, numbered sequentially.
- Every lesson links assets/course.css and assets/quiz.js, opens with a recall quiz, ends with: application, memory verse work (when active), primary source recommendation, "ask your teacher" reminder, and links to reference docs.
- Quiz answer options: keep all options the same word count so formatting gives no clue.
- Reference docs are the durable artifacts; lessons point into them.
- reference/macarthur-notes.html = user's personal copy of their owned MacArthur Study Bible Isaiah notes (pasted by user 2026-07-17), per-chapter anchors ch01-ch66. PRIVATE USE ONLY: never publish as an Artifact or share; it is copyrighted material the user owns. Lessons may deep-link (#chNN) and should engage its premil readings critically per the course's postmil home lens (caveat card is in the file header). Quoted text kept verbatim, including its own punctuation. NOT PUBLISHED: gitignored in the consolidated repo so it never reaches the public GitHub Pages site; lesson deep-links to it were removed when the courses were merged.
- Shared left sidebar: /assets/nav.js (course-agnostic) + styles in /assets/course.css, both shared across all courses. Every lesson and reference page includes `<script src="../course.js" defer></script>` then `<script src="../../assets/nav.js" defer></script>`. When adding a lesson: add one entry to the lessons array in isaiah/course.js, nothing else. Mark-complete progress persists in localStorage key `isaiah-study-progress` (per browser).

## Pacing ledger
- Lessons 0001-0051 built: orientation (0001-0002), Isaiah 1:1 through 10:34 (0003-0019), Isaiah 11-16 (0020-0026), Isaiah 17-27 (0027-0036), Isaiah 28-40:11 (0037-0051). Unit 2 (ch. 7-12) complete at 0022; Unit 3 (ch. 13-23) complete at 0032 (with unit recap); Unit 4 (ch. 24-27) complete at 0036 (with unit recap); Unit 5 (ch. 28-35) complete at 0046 (Isaiah 35, with unit recap; ch. 29 split 0038/0039, ch. 30 split 0040/0041); Unit 6 (ch. 36-39) complete at 0050 (Isaiah 39, with unit recap); Unit 7 (ch. 40-48) open at 0051 (Isaiah 40:1-11).
- Memory verses 1-9 activated (1:18, 6:3, 7:9b, 9:6, 11:9, 25:8, 26:3, 30:15, 40:8). Verse 8 (30:15) activated in 0040; verse 9 (40:8) activated in 0051; all-eight review cards in 0046 and 0050. Next verse: 10 (40:31), activates at lesson 0052 (Isaiah 40:12-31).
- Eschatology fork #1 at 2:1-5 (lesson 0005); fork #2 at 11:1-10 (lesson 0020); fork #3 at ch. 24 (lesson 0033, how to read apocalyptic, premil/amil/postmil argued from text, held open through ch. 25-27). Next fork checkpoints: ch. 60, 65-66.
- Lucifer question (14:12) handled in 0024: primary referent human king, satanic pride pattern acknowledged, MacArthur engaged.
- Key texts covered in 0027-0036: 19:24-25 (Egypt my people, postmil flagship), 21:9 (Fallen, fallen is Babylon, Rev echo), 22:22 (key of David, Eliakim typology), 23:9 (section thesis), 24:5 (broken everlasting covenant), 25:8 (death swallowed), 26:19 (resurrection), 27:1 (Leviathan slain), 27:2-6 (vineyard song answered, 27:6 postmil flagship), 27:12-13 (gleaned one by one, great trumpet).
- Key texts covered in 0037-0051: 28:16 (cornerstone, Rom 9:33 / 1 Pet 2:6), 29:13 (lips/heart, Matt 15), 29:16 (potter/clay, Rom 9), 30:15 (returning and rest, memory verse 8), 30:18 (LORD waits to be gracious), 31:3 (flesh not spirit), 31:5 (Passover hovering), 32:1-2 (king in righteousness), 32:15-17 (Spirit poured, quietness and trust as fruit; postmil-flagged, MacArthur millennial flagged), 33:17/33:22 (king in beauty; judge, lawgiver, king), 34:8 (day of vengeance) + 34/35 two-deserts diptych, 35:5-6 (Messiah's ID card, Matt 11), 35:8 (Way of Holiness), 36:2 = 7:3 (same test spot, Ahaz vs Hezekiah), 37:14 (letter spread before the LORD), 37:36 (angel, 185,000, cashes 31:8/30:33), 38:17 (sins behind your back), 39:6-7 (Babylon exile decreed, Daniel 1 link), 40:1-2 (comfort doubled), 40:3-5 (voice in wilderness, John the Baptist in all four Gospels), 40:8 (word stands forever, memory verse 9), 40:10-11 (ruling arm, shepherd arm).
- Fork #3 recapped and held open at 0036 unit close; next fork checkpoints unchanged (ch. 60, 65-66). Unit 6 framed as history hinge: two Hezekiah tests (letter passed, flattery failed); Sennacherib prism + Lachish reliefs used as corroboration in 0047-0048.
- Next lesson: 0052, Isaiah 40:12-31 (whom will you compare me to; wings like eagles; memory verse 10 = 40:31 activates; 0051 assigns the reading, next-nav is an ask-your-teacher span).
- Estimated full course: ~140 lessons over ~9-12 months at daily cadence.

## Repo consolidation (2026-08-02)
- This course moved from its own repo into the shared `inductive-bible-studies` monorepo, published at https://athao25.github.io/inductive-bible-studies/ under `/isaiah/`.
- CSS, quiz widget, and sidebar logic are now shared at `/assets/`; only lesson/reference HTML, `course.js`, and icon art are course-specific.
- Course docs (this file, MISSION, RESOURCES, learning-records) live under `isaiah/docs/`.
