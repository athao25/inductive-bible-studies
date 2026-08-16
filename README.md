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

Accounts are **Supabase Auth** (email + password) and every row lives in **Supabase Postgres**, so
progress, quiz history and notes follow you across devices. The pages stay static — GitHub Pages
serves plain HTML, and the browser talks to Supabase directly with the anon key. There is no server
tier, so **row-level security is the only thing standing between accounts**: every per-user table is
scoped to `auth.uid()` in the database itself, and `assets/store.js` never filters by user.

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
  config.js               Supabase URL + anon key (public values)
  vendor/supabase.js      vendored supabase-js UMD build, so nothing loads from a CDN
  store.js                Supabase-backed accounts, progress, quiz attempts, notes
  shell.js                sidebar, auth guard, dark-mode toggle; awaits Store.init(), calls window.Page
  ui.js                   shared element / date / progress-bar helpers
  dashboard.js catalog.js course-page.js lesson.js notebook-page.js settings.js auth.js
  notes.js                per-lesson notebook panel, mounted by lesson.js and saved to the notes table
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
  build-seed-sql.js       regenerates the course/unit/lesson seed migration
  retrofit-pages.js       puts every page on the current script stack (idempotent)
  smoke-test.js           jsdom checks across every screen
  supabase-stub.js        in-memory Supabase double used by the tests
supabase/migrations/      0001 schema + RLS, 0002 content seed, 0003 grant tightening
```

## Setup

1. Put the project's **anon (publishable) key** in `assets/config.js`. It is public by design — RLS
   is what protects the data. The `service_role` key and the database password must never go here.
2. In the Supabase dashboard under Authentication, decide whether email confirmation is required.
   With it on, sign-up returns no session and the screen says to check your email first.
3. `npm run db:migrate` to create the schema and seed the 214 lessons.

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
npm test           # 58 jsdom checks across every screen
```

The tests run against `scripts/supabase-stub.js`, an in-memory double that mirrors the RLS rules, so
they need neither network nor credentials. Serve over http rather than `file://`: Supabase Auth
stores its session per origin.

## Not in this repo

Each course keeps a personal copy of the owner's MacArthur Study Bible notes at
`<course>/reference/macarthur-notes.html`. That is copyrighted material for private use, so it is
gitignored and never reaches the public site. The files stay on local disk only.

## Database

Supabase project `bdkelzvemcoavpmezdeo` (ca-central-1), Postgres 17.

| Table | Rows | Access |
| --- | --- | --- |
| `courses`, `units`, `lessons` | 4 / 35 / 214 | world-readable, seeded from `assets/data/courses.js` |
| `profiles` | one per account | display name, favourite verse, dark mode |
| `lesson_progress` | one per lesson touched | resume section + completion, PK `(user_id, lesson_id)` |
| `quiz_attempts` | append-only | every attempt; the UI shows the latest per lesson |
| `notes` | one row per note line | stage, verse reference, body, clipped passage |
| `my_course_progress` | view | per-course completion for the caller (`security_invoker`) |

RLS is on for every table. Content is `select` for `anon` and `authenticated`; per-user tables are
`(select auth.uid()) = user_id` per command, with the `select auth.uid()` wrapper so it is evaluated
once per query rather than once per row. Supabase's permissive default grants are revoked in
`0003_tighten_grants.sql`, so `anon` holds `select` on content and nothing else, and quiz attempts
cannot be updated or deleted by anyone.

Migrations live in `supabase/migrations/` and are plain SQL, applied with psql:

```
npm run build:seed   # regenerate 0002 from the lesson files
npm run db:migrate   # apply all three, in order
```

Connecting: the dashboard's `db.<ref>.supabase.co` host is IPv6-only. On an IPv4-only network use
the session pooler — `aws-0-ca-central-1.pooler.supabase.com:5432`, user `postgres.<ref>`. A
`[ibs]` entry in `~/.pg_service.conf` plus `~/.pgpass` makes that `psql service=ibs`.

The only local storage left is `study-theme` (`light` / `dark`), mirrored from the profile so the
theme paints before JavaScript runs, and a session-scoped cache of the lesson id lookup.

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
(clipped passages), with Markdown export, a JSON backup, and print.

Saving replaces that lesson's note rows rather than diffing them: the panel is the whole editing
surface for one lesson, so delete-then-insert keeps the rows and the UI in step.

## History

Consolidated from two separate repositories, which remain as the historical record:
[gospel-of-matthew-induction-study](https://github.com/athao25/gospel-of-matthew-induction-study)
and [isaiah-induction-bible-study](https://github.com/athao25/isaiah-induction-bible-study).
