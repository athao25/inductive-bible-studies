# Learning record 0002: John course completed, all 60 lessons

Date: 2026-08-13

## What was built

Lessons 0009-0060, finishing the course begun in record 0001. The whole Gospel is now covered
verse by verse across 8 units:

| Unit | Lessons | Chapters | Theme |
| --- | --- | --- | --- |
| 1 | 0001-0008 | 1-2 | The Word made flesh (built earlier) |
| 2 | 0009-0015 | 3-4 | New birth and living water |
| 3 | 0016-0023 | 5-6 | The Son's authority and the bread of life |
| 4 | 0024-0030 | 7-8 | Light in conflict |
| 5 | 0031-0035 | 9-10 | The Shepherd gives sight |
| 6 | 0036-0042 | 11-12 | The resurrection and the hour |
| 7 | 0043-0051 | 13-17 | The Upper Room |
| 8 | 0052-0060 | 18-21 | Cross, resurrection, restoration, capstone |

All ten memory verses activate on schedule (1:14, 3:16, 6:35, 8:12, 10:27-28, 11:25-26, 14:6,
15:5, 16:33, 20:30-31), and all five doctrine checkpoints are handled in place:

- 3:5, water and Spirit (lesson 0009): Ezekiel 36 reading taken, baptismal and natural-birth readings stated fairly.
- 6:53-58, eating flesh and blood (lesson 0021): believing in the crucified Christ, later pictured at the Table.
- 7:53-8:11, the pericope adulterae (lesson 0026): manuscript evidence laid out honestly; not preached doctrinally.
- 15:1-8, the fruitless branches (lesson 0047): attachment without life, with Judas as the in-context example.
- 20:22-23, breathing and forgiveness (lesson 0057): new-creation vocabulary; announcing a verdict, not absolving.

## Conventions held

Every lesson keeps the established shape: "Did you read it?" card, spaced recall quiz drawing on the
previous lesson, observation check, interpretation with ESV blockquotes, three-part application
(About God / About you / Do), self-quiz, before-next card, primary source card citing the owned
MacArthur Study Bible notes generically plus the gty.org John archive, church prompt, questions
footnote, and lesson-nav. No em dashes anywhere. Reformed frame throughout, with MacArthur, White,
and Durbin named where they converge (chapter 6, chapter 10, 8:58, 20:28).

## Verification run

Script checked all 66 John HTML files plus the root index:

- `course.js` lessons array matches the `lessons/` directory exactly (60 entries).
- Every internal href and src resolves on disk.
- Every glossary and memory-verse anchor referenced exists in the target page.
- Lesson-nav Next chain unbroken from 0001 to 0060; capstone closes the chain.
- No em or en dashes; no stray non-ASCII characters.
- Every inline `Quiz.render` block passes `node --check`.

Result: 0 errors.

## Notes for later

- `john/reference/macarthur-notes.html` still does not exist, since the user has not pasted their
  MSB John notes. Lessons cite the notes generically by chapter and verse, so adding that file later
  only requires converting those citations to deep links. The path stays gitignored.
- Quiz option word counts are near-parity rather than exact, matching the precedent already set in
  the Matthew course and in John Unit 1.
