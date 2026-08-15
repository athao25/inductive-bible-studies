/* Smoke test the LMS pages in jsdom: sign up, complete a lesson, then assert
   each screen renders the redesign chrome. */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let fails = 0;
function ok(cond, msg) {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg);
  if (!cond) fails++;
}

// Shared localStorage across "pages"
const mem = {};
const storage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
  clear: () => { for (const k of Object.keys(mem)) delete mem[k]; }
};

async function load(rel) {
  const file = path.join(ROOT, rel);
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(e.message));
  vc.on('error', (...a) => errors.push(a.join(' ')));
  const dom = await JSDOM.fromFile(file, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
    }
  });
  await new Promise((r) => dom.window.addEventListener('load', r));
  await new Promise((r) => setTimeout(r, 120));
  return { dom, doc: dom.window.document, win: dom.window, errors };
}

(async () => {
  // Seed an account + progress directly, mirroring what store.js writes.
  const seedDom = await load('signin.html');
  seedDom.win.Store.signUp('andrew@example.com', 'Andrew', 'pw');
  seedDom.win.Store.setComplete('john', '0001-how-to-study-scripture.html', true);
  seedDom.win.Store.setComplete('john', '0002-john-big-picture.html', true);
  seedDom.win.Store.touchLesson('john', '0003-john-1-1-18-the-word-made-flesh.html', 'Interpretation');
  seedDom.win.Store.recordQuiz('john', '0001-how-to-study-scripture.html', 5, 6);
  ok(!!storage.getItem('ibs-lms-v1'), 'signup persisted account document');

  // Dashboard
  const dash = await load('index.html');
  ok(!!dash.doc.querySelector('.lms-sidebar'), 'dashboard renders sidebar');
  ok(dash.doc.querySelectorAll('.lms-nav-item').length === 4, 'sidebar has 4 nav items');
  ok(/Good (morning|afternoon|evening), Andrew/.test(dash.doc.getElementById('greeting').textContent), 'greeting shows the user name');
  ok(dash.doc.getElementById('fav-ref').textContent.includes('2 Timothy 2:15'), 'favourite verse defaults to 2 Timothy 2:15');
  ok(dash.doc.getElementById('resume-title').textContent.includes('The Word Made Flesh'), 'resume points at the touched lesson');
  ok(dash.doc.getElementById('resume-meta').textContent.includes('you stopped at Interpretation'), 'resume shows the saved section');
  ok(dash.doc.querySelectorAll('#course-rows .course-row').length === 4, 'dashboard lists 4 courses');
  ok(dash.doc.querySelector('#course-rows .pct').textContent === '3%', 'John progress reads 3% after 2 of 60');
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
  ok(course.doc.querySelectorAll('#course-refs .chip').length === 4, 'reference chips render');
  const locked = course.doc.querySelectorAll('#units div.lesson-row').length;
  ok(locked > 0, 'later units render locked rows (' + locked + ')');
  ok(!course.errors.length, 'course page has no script errors' + (course.errors[0] ? ': ' + course.errors[0] : ''));

  // Lesson page
  const lesson = await load('john/lessons/0020-john-6-22-40-the-bread-of-life.html');
  ok(!!lesson.doc.querySelector('.lms-sidebar'), 'lesson page renders the shell');
  ok(lesson.doc.querySelector('.lesson-kicker').textContent === 'Lesson 20 of 60 · Unit 3 · ~30 min', 'lesson kicker matches the design');
  ok(lesson.doc.querySelector('.crumb').textContent === '← John Study', 'lesson breadcrumb links back to the course');
  const toggle = lesson.doc.querySelector('.complete-toggle');
  ok(!!toggle && toggle.textContent === 'Mark lesson complete', 'completion toggle starts unchecked');
  toggle.dispatchEvent(new lesson.win.Event('click'));
  ok(toggle.textContent === '✓ Completed', 'completion toggle flips to completed');
  ok(lesson.win.Store.isComplete('john', '0020-john-6-22-40-the-bread-of-life.html'), 'completion persists to the store');
  ok(!!lesson.doc.querySelector('.notebook'), 'per-lesson notes panel still builds');
  ok(lesson.doc.querySelectorAll('#quiz .q').length === 6, 'lesson quiz renders its 6 questions');

  // Answer the whole quiz; every first option is the correct one in this lesson.
  lesson.doc.querySelectorAll('#quiz .q').forEach((q) => {
    q.querySelectorAll('button.opt')[0].dispatchEvent(new lesson.win.Event('click'));
  });
  await new Promise((r) => setTimeout(r, 50));
  const strip = lesson.doc.querySelector('.quiz-result');
  ok(!!strip && strip.textContent.startsWith('Score: 6/6'), 'quiz result strip reports the score');
  const attempts = lesson.win.Store.quizHistory().filter((a) => a.file.startsWith('0020'));
  ok(attempts.length === 1 && attempts[0].score === 6, 'quiz attempt saved to grade history');
  ok(!lesson.errors.length, 'lesson page has no script errors' + (lesson.errors[0] ? ': ' + lesson.errors[0] : ''));

  // Notebook + settings
  const nb = await load('notebook.html');
  ok(nb.doc.querySelectorAll('#nb-filters .chip').length === 5, 'notebook renders 5 filter chips');
  ok(!nb.errors.length, 'notebook has no script errors' + (nb.errors[0] ? ': ' + nb.errors[0] : ''));

  const set = await load('settings.html');
  ok(set.doc.getElementById('fav-ref-input').value === '2 Timothy 2:15', 'settings prefills the favourite verse');
  set.doc.getElementById('fav-ref-input').value = 'John 6:35';
  set.doc.getElementById('fav-text-input').value = 'I am the bread of life.';
  set.doc.getElementById('fav-save').dispatchEvent(new set.win.Event('click'));
  ok(set.doc.getElementById('fav-saved').textContent === 'Saved ✓', 'saving the verse confirms');
  ok(set.win.Store.state().favRef === 'John 6:35', 'favourite verse persisted');
  ok(!set.errors.length, 'settings has no script errors' + (set.errors[0] ? ': ' + set.errors[0] : ''));

  // Notes are per account -----------------------------------------------
  const noteDoc = { '0020-john-6-22-40-the-bread-of-life.html': { o: [{ r: 'v.35', t: 'bread = person' }], i: [], a: {}, u: Date.now() } };
  storage.setItem(set.win.Store.notesKey('john'), JSON.stringify(noteDoc));
  ok(set.win.Store.notesKey('john') === 'ibs-notes/andrew@example.com/john', 'notes key is namespaced by account');
  ok(set.win.Store.notes().length === 1, 'the signed-in account sees its own note');

  set.win.Store.signOut();
  set.win.Store.signUp('beth@example.com', 'Beth', 'pw2');
  ok(set.win.Store.notes().length === 0, "a second account does not see the first account's notes");
  set.win.Store.signOut();
  set.win.Store.signIn('andrew@example.com', 'pw');
  ok(set.win.Store.notes().length === 1, 'notes come back when the first account signs in again');

  // Renaming the account carries its notes across
  set.win.Store.setProfile('Andrew', 'drew@example.com');
  ok(set.win.Store.notesKey('john') === 'ibs-notes/drew@example.com/john', 'renaming the account moves the notes key');
  ok(set.win.Store.notes().length === 1, 'notes survive an email change');

  // Signed-out guard
  set.win.Store.signOut();
  ok(!set.win.Store.signedIn(), 'sign out clears the session');
  const guarded = await load('index.html');
  ok(!guarded.doc.querySelector('.lms-sidebar'), 'signed-out dashboard does not render the shell');

  console.log(fails ? '\n' + fails + ' FAILURES' : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})();
