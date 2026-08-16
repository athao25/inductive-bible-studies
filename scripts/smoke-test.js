/* Smoke test every screen in jsdom against an in-memory Supabase stub:
 * create an account, work through a lesson, then assert each page renders what
 * that account's rows say. Run: npm test */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const { createStub } = require('./supabase-stub');

const ROOT = path.join(__dirname, '..');

global.window = {};
require(path.join(ROOT, 'assets', 'data', 'courses.js'));
const COURSES = global.window.COURSES;
delete global.window;

const stub = createStub(COURSES);

let fails = 0;
function ok(cond, msg) {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg);
  if (!cond) fails++;
}

// One localStorage and one Supabase client shared across "page loads".
const mem = {};
const storage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
  clear: () => { for (const k of Object.keys(mem)) delete mem[k]; }
};

async function load(rel) {
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(e.message));
  vc.on('error', (...a) => errors.push(a.join(' ')));

  const dom = await JSDOM.fromFile(path.join(ROOT, rel), {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
      Object.defineProperty(window, 'sessionStorage', { value: { getItem: () => null, setItem() {}, removeItem() {} }, configurable: true });
      // Non-writable, so the vendored bundle cannot replace the stub.
      Object.defineProperty(window, 'supabase', { value: stub, writable: false, configurable: false });
      // Same trick for the config values, so assets/config.js cannot blank them.
      Object.defineProperty(window, 'SUPABASE_URL', { value: 'http://stub.local', writable: false, configurable: false });
      Object.defineProperty(window, 'SUPABASE_ANON_KEY', { value: 'stub-anon-key', writable: false, configurable: false });
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r));
  await new Promise((r) => setTimeout(r, 250));
  return { dom, doc: dom.window.document, win: dom.window, errors };
}

(async () => {
  // Sign-up screen drives account creation, exactly as a visitor would.
  const signin = await load('signin.html');
  signin.win.location.hash = '#signup';
  await new Promise((r) => setTimeout(r, 30));
  signin.doc.getElementById('name').value = 'Andrew';
  signin.doc.getElementById('email').value = 'andrew@example.com';
  signin.doc.getElementById('password').value = 'correct horse battery';
  const res = await signin.win.Store.signUp('andrew@example.com', 'Andrew', 'correct horse battery');
  ok(res.ok === true, 'sign-up creates an account');
  ok(signin.win.Store.signedIn(), 'sign-up leaves the visitor signed in');
  ok(signin.win.Store.user().name === 'Andrew', 'display name comes from the profile row');
  ok(stub._db.profiles.length === 1, 'a profile row is created with the account');

  await signin.win.Store.setComplete('john', '0001-how-to-study-scripture.html', true);
  await signin.win.Store.setComplete('john', '0002-john-big-picture.html', true);
  await signin.win.Store.touchLesson('john', '0003-john-1-1-18-the-word-made-flesh.html', 'Interpretation');
  await signin.win.Store.recordQuiz('john', '0001-how-to-study-scripture.html', 5, 6);
  ok(stub._db.lesson_progress.length === 3, 'progress rows are written to the database');

  // Dashboard
  const dash = await load('index.html');
  ok(!!dash.doc.querySelector('.lms-sidebar'), 'dashboard renders the shell');
  ok(dash.doc.querySelectorAll('.lms-nav-item').length === 4, 'sidebar has 4 nav items');
  ok(/Good (morning|afternoon|evening), Andrew/.test(dash.doc.getElementById('greeting').textContent), 'greeting shows the display name');
  ok(dash.doc.getElementById('fav-ref').textContent.includes('2 Timothy 2:15'), 'favourite verse defaults to 2 Timothy 2:15');
  ok(dash.doc.getElementById('resume-title').textContent.includes('The Word Made Flesh'), 'resume points at the touched lesson');
  ok(dash.doc.getElementById('resume-meta').textContent.includes('you stopped at Interpretation'), 'resume shows the saved section');
  ok(dash.doc.querySelectorAll('#course-rows .course-row').length === 4, 'dashboard lists 4 courses');
  ok(dash.doc.querySelector('#course-rows .pct').textContent === '3%', 'John reads 3% after 2 of 60');
  ok(dash.doc.querySelectorAll('#quiz-rows .quiz-row').length === 1, 'quiz history shows the recorded attempt');
  ok(!dash.errors.length, 'dashboard has no script errors' + (dash.errors[0] ? ': ' + dash.errors[0] : ''));

  // Catalog
  const cat = await load('courses.html');
  ok(cat.doc.querySelectorAll('#catalog .catalog-card').length === 4, 'catalog renders 4 course cards');
  ok(cat.doc.querySelectorAll('.book').length === 71, 'canon map still lists 66 books + 5 doctrine courses');
  ok(!cat.errors.length, 'catalog has no script errors' + (cat.errors[0] ? ': ' + cat.errors[0] : ''));

  // Course page
  const course = await load('john/index.html');
  ok(course.doc.getElementById('course-title').textContent === 'John Study', 'course page shows the course title');
  ok(course.doc.querySelectorAll('#units section').length === 10, 'course page groups 10 units');
  ok(course.doc.querySelectorAll('#units .lesson-row').length === 60, 'course page lists all 60 lessons');
  ok(course.doc.querySelectorAll('#units .lesson-row.done').length === 2, 'two lessons render as complete');
  ok(course.doc.getElementById('course-stats').textContent.includes('2 of 60 lessons'), 'course stats line is right');
  ok(course.doc.getElementById('course-resume').textContent === 'Resume · Lesson 3', 'resume button targets lesson 3');
  ok(course.doc.querySelectorAll('#units div.lesson-row').length > 0, 'later units render locked rows');
  ok(!course.errors.length, 'course page has no script errors' + (course.errors[0] ? ': ' + course.errors[0] : ''));

  // Lesson page
  const lesson = await load('john/lessons/0020-john-6-22-40-the-bread-of-life.html');
  ok(!!lesson.doc.querySelector('.lms-sidebar'), 'lesson page renders the shell');
  ok(lesson.doc.querySelector('.lesson-kicker').textContent === 'Lesson 20 of 60 · Unit 3 · ~30 min', 'lesson kicker matches the design');
  ok(lesson.doc.querySelector('.crumb').textContent === '← John Study', 'lesson breadcrumb links back to the course');
  ok(!!lesson.doc.querySelector('.notebook'), 'the notes panel mounts');

  const toggle = lesson.doc.querySelector('.complete-toggle');
  ok(!!toggle && toggle.textContent === 'Mark lesson complete', 'completion toggle starts unchecked');
  toggle.dispatchEvent(new lesson.win.Event('click'));
  await new Promise((r) => setTimeout(r, 60));
  ok(toggle.textContent === '✓ Completed', 'completion toggle flips to completed');
  ok(lesson.win.Store.isComplete('john', '0020-john-6-22-40-the-bread-of-life.html'), 'completion is persisted');

  // Write a note through the panel and confirm it reaches the notes table.
  const firstRow = lesson.doc.querySelector('.nb-row[data-stage="o"]');
  firstRow.querySelector('.nb-ref').value = 'v.35';
  firstRow.querySelector('.nb-text').value = 'coming to Jesus IS believing in him';
  firstRow.querySelector('.nb-text').dispatchEvent(new lesson.win.Event('input'));
  await new Promise((r) => setTimeout(r, 900));
  const noteRows = stub._db.notes.filter((n) => n.body.startsWith('coming to Jesus'));
  ok(noteRows.length === 1, 'a note written in the panel is saved as a row');
  ok(noteRows[0] && noteRows[0].kind === 'observation' && noteRows[0].reference === 'v.35', 'the note keeps its stage and verse reference');

  ok(lesson.doc.querySelectorAll('#quiz .q').length === 6, 'lesson quiz renders its 6 questions');
  lesson.doc.querySelectorAll('#quiz .q').forEach((q) => {
    q.querySelectorAll('button.opt')[0].dispatchEvent(new lesson.win.Event('click'));
  });
  await new Promise((r) => setTimeout(r, 80));
  const strip = lesson.doc.querySelector('.quiz-result');
  ok(!!strip && strip.textContent.startsWith('Score: 6/6'), 'quiz result strip reports the score');
  ok(stub._db.quiz_attempts.some((a) => a.score === 6 && a.total === 6), 'quiz attempt is saved to the grade history');
  ok(!lesson.errors.length, 'lesson page has no script errors' + (lesson.errors[0] ? ': ' + lesson.errors[0] : ''));

  // Notebook
  const nb = await load('notebook.html');
  ok(nb.doc.querySelectorAll('#nb-filters .chip').length === 5, 'notebook renders 5 filter chips');
  ok(nb.doc.querySelectorAll('.nb-note').length === 1, 'the note written in the lesson shows in the notebook');
  ok(nb.doc.querySelector('.nb-note-ref').textContent === 'v.35', 'notebook shows the verse reference');
  ok(!nb.errors.length, 'notebook has no script errors' + (nb.errors[0] ? ': ' + nb.errors[0] : ''));

  // Settings
  const set = await load('settings.html');
  ok(set.doc.getElementById('fav-ref-input').value === '2 Timothy 2:15', 'settings prefills the favourite verse');
  set.doc.getElementById('fav-ref-input').value = 'John 6:35';
  set.doc.getElementById('fav-text-input').value = 'I am the bread of life.';
  set.doc.getElementById('fav-save').dispatchEvent(new set.win.Event('click'));
  await new Promise((r) => setTimeout(r, 60));
  ok(set.doc.getElementById('fav-saved').textContent === 'Saved ✓', 'saving the verse confirms');
  ok(stub._db.profiles[0].fav_verse_ref === 'John 6:35', 'favourite verse is persisted to the profile');

  set.doc.getElementById('profile-name').value = 'Adam';
  set.doc.getElementById('profile-save').dispatchEvent(new set.win.Event('click'));
  await new Promise((r) => setTimeout(r, 60));
  ok(stub._db.profiles[0].display_name === 'Adam', 'display name is persisted');
  ok(set.doc.getElementById('profile-email').disabled, 'email is read-only here (auth owns it)');
  ok(!set.errors.length, 'settings has no script errors' + (set.errors[0] ? ': ' + set.errors[0] : ''));

  // A second account sees none of the first account's rows.
  await set.win.Store.signOut();
  const second = await set.win.Store.signUp('beth@example.com', 'Beth', 'another password');
  ok(second.ok === true, 'a second account can be created');
  ok((await set.win.Store.allNotes()).length === 0, "a second account sees none of the first account's notes");
  ok(set.win.Store.quizHistory().length === 0, 'a second account has an empty quiz history');
  ok(set.win.Store.courseStats('john').done === 0, 'a second account starts at zero progress');

  await set.win.Store.signOut();
  const back = await set.win.Store.signIn('andrew@example.com', 'correct horse battery');
  ok(back.ok === true, 'the first account can sign back in');
  ok(set.win.Store.courseStats('john').done === 3, 'its progress is still there');
  ok((await set.win.Store.allNotes()).length === 1, 'its note is still there');

  const bad = await set.win.Store.signIn('andrew@example.com', 'wrong');
  ok(!!bad.error, 'a wrong password is rejected');

  // Signed-out guard
  await set.win.Store.signOut();
  const guarded = await load('index.html');
  ok(!guarded.doc.querySelector('.lms-sidebar'), 'signed-out dashboard does not render the shell');

  console.log(fails ? '\n' + fails + ' FAILURES' : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})();
