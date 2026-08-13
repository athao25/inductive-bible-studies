# Inductive Bible Studies

Verse-by-verse inductive study courses, published as a static site on GitHub Pages:
**https://athao25.github.io/inductive-bible-studies/**

| Course | Lessons | Status |
| --- | --- | --- |
| [Matthew](matthew/) | 79 | Complete, all 28 chapters |
| [Isaiah](isaiah/) | 51 | In progress, through Isaiah 40:11 |
| [John](john/) | 8 | In progress, through John 2 |

## Layout

```
index.html                 hub, links to each course
assets/                    shared across every course
  course.css               all styling
  nav.js                   sidebar + progress, reads window.COURSE
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

## History

Consolidated from two separate repositories, which remain as the historical record:
[gospel-of-matthew-induction-study](https://github.com/athao25/gospel-of-matthew-induction-study)
and [isaiah-induction-bible-study](https://github.com/athao25/isaiah-induction-bible-study).
