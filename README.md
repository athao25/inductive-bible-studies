# Inductive Bible Studies

Verse-by-verse inductive study courses, published as a static LMS on GitHub Pages:
**https://athao25.github.io/inductive-bible-studies/**

| Course | Lessons | Status |
| --- | --- | --- |
| [Matthew](matthew/) | 79 | Complete, all 28 chapters |
| [Isaiah](isaiah/) | 51 | In progress, through Isaiah 40:11 |
| [John](john/) | 60 | Complete, all 21 chapters |
| [The Trinity](trinity/) | 24 | Complete, doctrine course |

Courses come in two kinds: **book studies** (verse by verse through one book) and **doctrine
studies** (one doctrine walked through the passages it comes from, same inductive method; the
Trinity course is the first). Doctrine courses read alongside a companion book, cited with brief
attributed excerpts only.

## The LMS shell

The site is an account-based LMS: sign in, resume where you stopped, mark lessons complete, take
the lesson quiz into a grade history, keep a notebook, and pin a favourite verse to the dashboard.

The redesign handoff specified Node + Express + SQLite. GitHub Pages serves static files only, so
the same data model runs client-side: `assets/store.js` keeps one `localStorage` document
(`ibs-lms-v1`) shaped like the handoff's tables — users, session, lesson_progress, quiz_attempts,
favourite verse, dark mode. Accounts are per browser and nothing is sent anywhere; the password is
only obscured, not protected, and the sign-in screen says so.

Screens:

```
signin.html      sign in / create account (#signup)
index.html       dashboard: favourite verse, resume, courses, quiz history, recent notes
courses.html     course catalog + the 66-book canon map
<course>/        course page: epigraph, progress, lessons grouped by unit
<course>/lessons/*.html   lesson: prose, notes panel, quiz, completion toggle
notebook.html    every note, filtered by stage, with Markdown / JSON / print exports
settings.html    favourite verse + profile
```

Units after the first incomplete one are locked (rows render, but do not link), per the handoff.
Completing the current unit unlocks the next. To turn that off, drop the `locked` branch in
`assets/course-page.js`.

## Layout

```
index.html, courses.html, notebook.html, settings.html, signin.html
assets/
  lms.css                 design tokens, app shell, every screen (light + dark)
  course.css              long-form lesson prose; its legacy vars point at the new tokens
  theme.js                applies the saved theme before first paint
  store.js                accounts, progress, quiz attempts, notes, favourite verse
  shell.js                sidebar, auth guard, dark-mode toggle; calls window.Page
  ui.js                   shared element / date / progress-bar helpers
  dashboard.js catalog.js course-page.js lesson.js notebook-page.js settings.js auth.js
  notes.js                per-lesson notebook panel (observation/interpretation/application)
  quiz.js                 quiz widget; emits `quiz:complete` for the grade history
  data/courses.js         GENERATED lesson index (units, references, scripture, minutes)
  icons/<course>/         per-course icon art
<course>/
  index.html              course page
  course.js               course data: key, title, lessons, refs
  lessons/                one HTML file per lesson
  reference/              glossary, book map, memory verses, notes
  docs/                   mission, curriculum, notes, learning records
scripts/
  build-course-data.js    regenerates assets/data/courses.js from the lesson HTML
  retrofit-pages.js       puts lesson/reference pages on the shell (idempotent)
  smoke-test.js           jsdom checks across every screen
```

Each page names its own screen script by assigning `window.Page`; `assets/shell.js` runs it after
the sidebar is built and the visitor is known to be signed in.

## Adding a lesson

1. Add the HTML file to `<course>/lessons/`. Copy an existing lesson for the head block and structure.
2. Add one entry to `lessons` in `<course>/course.js`.
3. `npm run build:data` to refresh the lesson index.

Prev/next links, unit grouping and the course page come from that index, so nothing else changes.

## Adding a course

Create `<course>/` with `index.html` (copy another course's), `course.js`, `lessons/` and
`reference/`, add the icon art under `assets/icons/<course>/`, add the course to the `META` block
and the course list in `scripts/build-course-data.js`, then `npm run build:data`. The catalog,
dashboard and sidebar pick it up automatically.

## Local preview and tests

```
npm run serve      # http://localhost:8000
npm test           # jsdom smoke test of every screen
```

Course data loads via plain script tags rather than `fetch`, so `file://` works too.

## Not in this repo

Each course keeps a personal copy of the owner's MacArthur Study Bible notes at
`<course>/reference/macarthur-notes.html`. That is copyrighted material for private use, so it is
gitignored and never reaches the public site. The files stay on local disk only.

## Storage keys

| Key | What |
| --- | --- |
| `ibs-lms-v1` | accounts, session, progress, quiz attempts, favourite verse, dark mode |
| `<course>-study-notes` | lesson notes, written by `assets/notes.js` |
| `study-theme` | `light` / `dark`, applied before first paint |
| `<course>-study-progress` | pre-redesign progress; imported once on first sign-in |

Notes stay in the pre-redesign keys, so notebooks written before the redesign survive it. They are
per browser rather than per account.

## Theme

Light by default, dark via the sidebar toggle, stored on the account and mirrored into
`study-theme` so it applies before first paint through `html[data-theme="dark"]`. The OS colour
scheme is ignored; printing always uses the light palette.

## Notes

Every lesson page carries a notebook panel (`assets/notes.js`), injected before the "Observation
check" heading so you write before you read the answers. Three stages mirror the method:
observation and interpretation take verse-stamped lines (Enter starts the next one), application
takes God / Me / Do. Selecting any line in the lesson offers "Clip to notes", which drops the text
into observation with the reference attached. It autosaves; `⌘↵` saves and marks the lesson
complete.

`notebook.html` compiles everything written, newest first, filtered by stage or by highlights
(clipped passages), with Markdown export, a JSON backup of every course's notes, and print.

## History

Consolidated from two separate repositories, which remain as the historical record:
[gospel-of-matthew-induction-study](https://github.com/athao25/gospel-of-matthew-induction-study)
and [isaiah-induction-bible-study](https://github.com/athao25/isaiah-induction-bible-study).
