# Learning Record 0001: Romans Course Built, All 52 Lessons (2026-08-17)

## What happened
Romans was added to the inductive-bible-studies monorepo as its fifth course and its fourth book study, following the "Adding a course" recipe in the root README and the conventions set by Matthew, Isaiah, John and the Trinity doctrine course. The whole course was written in one pass rather than unit by unit.

## Built in this pass
- `romans/` scaffold: `index.html`, `course.js` (52 lessons, 4 reference pages), icons at `assets/icons/romans/` ("Ro" in Liberation Serif, cream on a plum gradient, with the framed 512 variant matching Isaiah).
- All four reference pages: inductive method (adapted for argument rather than narrative, with the connector and diatribe skills), Romans book map (setting, seven movements, unit map, paragraph-by-paragraph spine, themes, OT usage, teacher-lens card), glossary (Paul's vocabulary plus the theological terms the letter forces), memory verses (12, ESV, with activation points).
- Course docs: MISSION, CURRICULUM (complete 52-lesson map, memory verse table, 14 doctrine checkpoints), NOTES (conventions, Romans-specific teaching decisions, pacing ledger), RESOURCES.
- All 52 lessons: orientation (0001-0002), Unit 1 (0003-0011), Unit 2 (0012-0020), Unit 3 (0021-0031), Unit 4 (0032-0040), Unit 5 (0041-0051), capstone (0052).
- Shared-file wiring: META entry and course list in `scripts/build-course-data.js`, ORDER in `scripts/build-seed-sql.js`, COURSES in `scripts/retrofit-pages.js`, the canon-map link in `courses.html`, and the README table row.

## Decisions
- 52 lessons across 5 units, with boundaries set by the argument rather than chapter numbers: Unit 1 ends at 3:20 and Unit 2 opens at "But now" in 3:21. Kickers name the ranges ("Unit 1: Chapters 1:1-3:20") so the generated unit titles stay unambiguous.
- Lesson 0001 teaches two extra skills beyond the standard method, because Romans argues rather than narrates: reading the connectors, and identifying the diatribe objector. Both are then used constantly in the observation checks.
- Twelve memory verses rather than the ten used in Matthew and John, because the letter's load-bearing sentences are unusually quotable and unusually easy to misquote. Two verses (3:23-24 and 8:28-30) are deliberately taught as multi-verse units so the popular half cannot detach from its ground.
- Fourteen doctrine checkpoints. Where the three teachers agree (justification, imputation, inability, election in ch. 9, security in ch. 8) the lessons say so; where they differ (7:14-25, and MacArthur's dispensational reading of 11:25-27) the lessons name the difference and argue from the text.
- Romans 1:26-27 is taught by stating what the passage says and then holding it inside its own paragraph, which runs on into envy and gossip and then into 2:1. The lesson says both halves plainly and includes a church prompt about speaking to a gay friend without either dishonesty or cruelty.
- The capstone names the three places the course argued a position (7:14-25, ch. 9, 11:26) rather than presenting them as settled, and closes with a written self-assessment instead of a summary quiz alone.

## Corrections made during the build
- Em dashes: the first draft used them heavily, which violates the standing user rule recorded in the other courses' NOTES.md. All 602 occurrences across the lessons and reference pages were converted to colons, commas, semicolons or parentheses, and about eighty awkward results were hand-corrected afterwards. Rule now recorded in this course's NOTES.md as well.

## Next
- Nothing outstanding for the course itself. When the user pastes their owned MacArthur Study Bible Romans notes into `reference/macarthur-notes.html` (gitignored), the "Primary source" cards can be upgraded from generic citations to per-chapter deep links.
- Optional follow-on courses that pair naturally with this one: Galatians (the same doctrine at half the length) and Ephesians.
