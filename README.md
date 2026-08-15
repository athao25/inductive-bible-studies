# Inductive Bible Studies

Verse-by-verse inductive study courses, published as a static site on GitHub Pages:
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

## Layout

```
index.html                 hub, links to each course
notebook.html              My Notebook: every note, compiled per course
assets/                    shared across every course
  course.css               all styling; warm paper light + dark palettes, Newsreader
  theme.js                 light/dark toggle, saved in localStorage
  nav.js                   sidebar + progress, reads window.COURSE
  notes.js                 per-lesson notebook (observation/interpretation/application)
  notebook.js              powers notebook.html
  quiz.js                  recall quiz widget
  icons/<course>/          per-course icon art
<course>/
  index.html               course landing page
  course.js                course data: key, title, lessons, refs
  lessons/                 one HTML file per lesson
  reference/               glossary, book map, memory verses, notes
  docs/                    mission, curriculum, notes, learning records
```

## Adding a lesson

1. Add the HTML file to `<course>/lessons/`. Copy an existing lesson for the head block and structure.
2. Add one entry to `lessons` in `<course>/course.js`.
3. Update the previous lesson's `.lesson-nav` "Next" link.

Nothing in `assets/` needs to change.

## Adding a course

Create `<course>/` with `index.html`, `course.js`, `lessons/`, and `reference/`, add the icon art
under `assets/icons/<course>/`, then add a card to the root `index.html`. The shared assets pick it
up automatically.

## Local preview

Open `index.html` directly in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Course data loads via a plain script tag rather than `fetch`, so `file://` works too.

## Not in this repo

Each course keeps a personal copy of the owner's MacArthur Study Bible notes at
`<course>/reference/macarthur-notes.html`. That is copyrighted material for private use, so it is
gitignored and never reaches the public site. The files stay on local disk only.

## Progress tracking

Lesson completion is stored in `localStorage` under `<course-key>-study-progress`, per browser and
per course. It is not synced anywhere.

## Theme

Every page has a light/dark toggle (the round button at the bottom right, injected by
`assets/theme.js`). The choice is stored in `localStorage` under `study-theme` and applied before
first paint via `html[data-theme="dark"]`; light is the default and printing always uses the light
palette. The OS colour scheme is ignored either way.

## Notes

Every lesson page carries a notebook panel (`assets/notes.js`), injected before the "Observation
check" heading so you write before you read the answers. Three stages mirror the method:
observation and interpretation take verse-stamped lines (Enter starts the next one), application
takes God / Me / Do. Selecting any line in the lesson offers "Clip to notes", which drops the text
into observation with the reference attached. It autosaves; `⌘↵` saves and marks the lesson
complete. On screens from 1400px the panel sits as a sticky right-hand column, otherwise inline.

Notes live in `localStorage` under `<course-key>-study-notes`, keyed by lesson filename:

```
{ "0003-john-1-1-18-the-word-made-flesh.html": {
    "o": [{ "r": "v.14", "t": "tabernacled = pitched his tent" }],
    "i": [], "a": { "god": "", "me": "", "do": "" }, "u": 1755100000000 } }
```

Same as progress: per browser, per course, never synced. Print the lesson and the notebook prints
with it.

## My Notebook

`notebook.html` compiles everything you have written, one notebook per course. It loads every
course's `course.js` file (each assigns `window.COURSE`; the page collects them into `window.COURSES`) and
reads the same `localStorage` keys. It is read-only: editing happens in the lesson.

Three views:

- **By lesson** — a journal, newest notes grouped under the lesson that produced them.
- **By stage** — all your observations in one column, interpretations in the next, applications in
  the third.
- **Highlights** — lines you clipped from the passage, shown as the passage text with your edit
  underneath as a note.

The rail switches course, filters by stage, and offers print, Markdown export, and a JSON backup.
Print and the stage filter act on what is on screen; Markdown and the JSON backup always write
everything (the backup covers all courses).

## History

Consolidated from two separate repositories, which remain as the historical record:
[gospel-of-matthew-induction-study](https://github.com/athao25/gospel-of-matthew-induction-study)
and [isaiah-induction-bible-study](https://github.com/athao25/isaiah-induction-bible-study).
