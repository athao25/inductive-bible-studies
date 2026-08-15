/* Account + progress store for the LMS shell.
 *
 * The site is a static GitHub Pages build, so the SQLite schema in the design
 * handoff is modelled client-side: one localStorage document under 'ibs-lms-v1'
 * holding users, the active session, and per-user state (lesson progress, quiz
 * attempts, favourite verse, dark mode). Shape mirrors the handoff tables:
 *
 *   users[email]      = { email, name, hash, salt, created }
 *   session           = email | null
 *   data[email] = {
 *     dark, favRef, favText,
 *     progress['<course>/<lesson-file>'] = { section, updated, completed },
 *     quiz[] = { course, file, score, total, at }
 *   }
 *
 * Lesson notes are per account too: assets/notes.js writes them under
 * 'ibs-notes/<email>/<course>' via Store.notesKey(). The pre-redesign
 * '<course>-study-notes' keys are imported into the first account that signs in
 * on this browser, so notebooks written before the redesign survive it.
 * Include before every other LMS script.
 */
window.Store = (function () {
  var KEY = 'ibs-lms-v1';
  var DEFAULT_FAV_REF = '2 Timothy 2:15';
  var DEFAULT_FAV_TEXT = 'Do your best to present yourself to God as one approved, a worker ' +
    'who has no need to be ashamed, rightly handling the word of truth.';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function write(doc) {
    try { localStorage.setItem(KEY, JSON.stringify(doc)); } catch (e) { /* private mode etc. */ }
  }
  function doc() {
    var d = read();
    if (!d.users) d.users = {};
    if (!d.data) d.data = {};
    if (!('session' in d)) d.session = null;
    return d;
  }

  function blankUserData() {
    return { dark: false, favRef: DEFAULT_FAV_REF, favText: DEFAULT_FAV_TEXT, progress: {}, quiz: [] };
  }

  /* Deliberately light: there is no server to protect, and the store is already
     readable by anyone at this browser. It only keeps the password out of plain
     sight in localStorage. */
  function hash(pass, salt) {
    var s = salt + '|' + pass, h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var i = 0; i < s.length; i++) {
      h1 = ((h1 ^ s.charCodeAt(i)) * 16777619) >>> 0;
      h2 = ((h2 + s.charCodeAt(i) * (i + 7)) * 2654435761) >>> 0;
    }
    return h1.toString(16) + h2.toString(16);
  }
  function newSalt() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function norm(email) { return String(email || '').trim().toLowerCase(); }

  /* Where one course's notes live for one account. Signed out (or before an
     account exists) this is the pre-redesign key, so notes.js still works. */
  function notesKeyFor(email, course) {
    return email ? 'ibs-notes/' + email + '/' + course : course + '-study-notes';
  }

  /* One-off import of the pre-redesign per-course progress and notes keys into
     the first account that claims them on this browser. */
  function migrate(d, email) {
    var courses = window.COURSES ? Object.keys(window.COURSES) : [];
    var bucket = d.data[email];
    if (bucket.migrated) return;
    courses.forEach(function (key) {
      var old = null;
      try { old = JSON.parse(localStorage.getItem(key + '-study-progress')); } catch (e) { /* ignore */ }
      if (old) {
        Object.keys(old).forEach(function (file) {
          if (!old[file]) return;
          var id = key + '/' + file;
          if (bucket.progress[id]) return;
          bucket.progress[id] = { section: '', updated: 0, completed: 1 };
        });
      }

      var oldNotes = null;
      try { oldNotes = JSON.parse(localStorage.getItem(key + '-study-notes')); } catch (e) { /* ignore */ }
      if (!oldNotes || !Object.keys(oldNotes).length) return;
      var target = notesKeyFor(email, key);
      var mine = {};
      try { mine = JSON.parse(localStorage.getItem(target)) || {}; } catch (e) { /* ignore */ }
      Object.keys(oldNotes).forEach(function (file) {
        if (!mine[file]) mine[file] = oldNotes[file];
      });
      try { localStorage.setItem(target, JSON.stringify(mine)); } catch (e) { /* private mode etc. */ }
    });
    bucket.migrated = 1;
  }

  var api = {
    DEFAULT_FAV_REF: DEFAULT_FAV_REF,
    DEFAULT_FAV_TEXT: DEFAULT_FAV_TEXT,

    currentEmail: function () { return doc().session; },

    user: function () {
      var d = doc();
      if (!d.session || !d.users[d.session]) return null;
      var u = d.users[d.session];
      return { email: u.email, name: u.name };
    },

    signedIn: function () { return !!api.user(); },

    signUp: function (email, name, pass) {
      var d = doc();
      var e = norm(email);
      if (!e || !pass) return { error: 'Email and password are required.' };
      if (d.users[e]) return { error: 'That email already has an account on this browser.' };
      var salt = newSalt();
      d.users[e] = { email: e, name: (name || '').trim() || e.split('@')[0], hash: hash(pass, salt), salt: salt, created: Date.now() };
      d.data[e] = blankUserData();
      d.session = e;
      migrate(d, e);
      write(d);
      return { ok: true };
    },

    signIn: function (email, pass) {
      var d = doc();
      var e = norm(email);
      var u = d.users[e];
      if (!u) return { error: 'No account for that email on this browser. Create one below.' };
      if (u.hash !== hash(pass, u.salt)) return { error: 'That password does not match.' };
      if (!d.data[e]) d.data[e] = blankUserData();
      d.session = e;
      migrate(d, e);
      write(d);
      return { ok: true };
    },

    signOut: function () {
      var d = doc();
      d.session = null;
      write(d);
    },

    /* Per-user state ---------------------------------------------------- */

    state: function () {
      var d = doc();
      if (!d.session) return blankUserData();
      if (!d.data[d.session]) { d.data[d.session] = blankUserData(); write(d); }
      return d.data[d.session];
    },

    update: function (fn) {
      var d = doc();
      if (!d.session) return blankUserData();
      if (!d.data[d.session]) d.data[d.session] = blankUserData();
      fn(d.data[d.session]);
      write(d);
      return d.data[d.session];
    },

    setProfile: function (name, email) {
      var d = doc();
      if (!d.session) return { error: 'Not signed in.' };
      var cur = d.session;
      var next = norm(email);
      if (next && next !== cur) {
        if (d.users[next]) return { error: 'That email already has an account on this browser.' };
        d.users[next] = d.users[cur];
        d.users[next].email = next;
        d.data[next] = d.data[cur];
        delete d.users[cur];
        delete d.data[cur];
        d.session = next;
        // Notes are keyed by email, so they move with the account.
        Object.keys(window.COURSES || {}).forEach(function (key) {
          var from = notesKeyFor(cur, key);
          var body = null;
          try { body = localStorage.getItem(from); } catch (e) { /* ignore */ }
          if (!body) return;
          try {
            localStorage.setItem(notesKeyFor(next, key), body);
            localStorage.removeItem(from);
          } catch (e) { /* private mode etc. */ }
        });
      }
      d.users[d.session].name = (name || '').trim() || d.users[d.session].name;
      write(d);
      return { ok: true };
    },

    /* Progress ---------------------------------------------------------- */

    lessonId: function (course, file) { return course + '/' + file; },

    lessonProgress: function (course, file) {
      return api.state().progress[course + '/' + file] || null;
    },

    isComplete: function (course, file) {
      var p = api.lessonProgress(course, file);
      return !!(p && p.completed);
    },

    touchLesson: function (course, file, section) {
      return api.update(function (s) {
        var id = course + '/' + file;
        var p = s.progress[id] || { section: '', updated: 0, completed: 0 };
        p.updated = Date.now();
        if (section) p.section = section;
        s.progress[id] = p;
      });
    },

    setComplete: function (course, file, done) {
      return api.update(function (s) {
        var id = course + '/' + file;
        var p = s.progress[id] || { section: '', updated: 0, completed: 0 };
        p.completed = done ? Date.now() : 0;
        p.updated = Date.now();
        s.progress[id] = p;
      });
    },

    courseStats: function (key) {
      var c = window.COURSES && window.COURSES[key];
      if (!c) return { done: 0, total: 0, pct: 0 };
      var s = api.state();
      var done = c.lessons.filter(function (l) {
        var p = s.progress[key + '/' + l.f];
        return p && p.completed;
      }).length;
      return { done: done, total: c.lessons.length, pct: c.lessons.length ? Math.round(done / c.lessons.length * 100) : 0 };
    },

    /* Resume target: newest touched-but-unfinished lesson, else the first
       uncompleted lesson of the most recently touched course, else lesson 1. */
    resume: function () {
      var s = api.state();
      var courses = window.COURSES || {};
      var best = null;
      Object.keys(s.progress).forEach(function (id) {
        var p = s.progress[id];
        if (p.completed) return;
        if (!p.updated) return;
        if (!best || p.updated > best.updated) best = { id: id, updated: p.updated, section: p.section };
      });
      if (!best) {
        var newest = 0, newestCourse = null;
        Object.keys(s.progress).forEach(function (id) {
          var p = s.progress[id];
          var t = Math.max(p.updated || 0, p.completed || 0);
          if (t > newest) { newest = t; newestCourse = id.split('/')[0]; }
        });
        var key = newestCourse || 'john';
        var c = courses[key];
        if (!c) return null;
        var next = c.lessons.find(function (l) {
          var p = s.progress[key + '/' + l.f];
          return !(p && p.completed);
        }) || c.lessons[0];
        return { course: key, lesson: next, section: '' };
      }
      var parts = best.id.split('/');
      var cc = courses[parts[0]];
      if (!cc) return null;
      var lesson = cc.lessons.find(function (l) { return l.f === parts[1]; });
      if (!lesson) return null;
      return { course: parts[0], lesson: lesson, section: best.section || '' };
    },

    /* Quiz attempts ------------------------------------------------------ */

    recordQuiz: function (course, file, score, total) {
      return api.update(function (s) {
        s.quiz.push({ course: course, file: file, score: score, total: total, at: Date.now() });
        if (s.quiz.length > 500) s.quiz = s.quiz.slice(-500);
      });
    },

    /* Latest attempt per lesson, newest first. */
    quizHistory: function (limit) {
      var s = api.state();
      var latest = {};
      s.quiz.forEach(function (a) {
        var id = a.course + '/' + a.file;
        if (!latest[id] || a.at > latest[id].at) latest[id] = a;
      });
      var rows = Object.keys(latest).map(function (id) { return latest[id]; });
      rows.sort(function (a, b) { return b.at - a.at; });
      return limit ? rows.slice(0, limit) : rows;
    },

    quizAverage: function (key) {
      var rows = api.quizHistory().filter(function (a) { return a.course === key; });
      if (!rows.length) return null;
      var pct = rows.reduce(function (n, a) { return n + (a.total ? a.score / a.total : 0); }, 0) / rows.length;
      return Math.round(pct * 100);
    },

    /* Notes -------------------------------------------------------------- */

    /* Storage key holding one course's notes for the signed-in account. */
    notesKey: function (course) { return notesKeyFor(doc().session, course); },

    /* Flattens the per-course notes written by assets/notes.js into notebook rows. */
    notes: function () {
      var out = [];
      var courses = window.COURSES || {};
      Object.keys(courses).forEach(function (key) {
        var all = {};
        try { all = JSON.parse(localStorage.getItem(api.notesKey(key))) || {}; } catch (e) { /* ignore */ }
        var course = courses[key];
        Object.keys(all).forEach(function (file) {
          var lesson = course.lessons.find(function (l) { return l.f === file; });
          if (!lesson) return;
          var n = all[file] || {};
          var when = n.u || 0;
          (n.o || []).forEach(function (line) {
            out.push({ course: key, file: file, lesson: lesson, kind: 'Observation', ref: line.r || lesson.ref, text: line.t, when: when, clip: line.h || '' });
          });
          (n.i || []).forEach(function (line) {
            out.push({ course: key, file: file, lesson: lesson, kind: 'Interpretation', ref: line.r || lesson.ref, text: line.t, when: when, clip: line.h || '' });
          });
          var a = n.a || {};
          ['god', 'me', 'do'].forEach(function (k) {
            if (!a[k]) return;
            out.push({ course: key, file: file, lesson: lesson, kind: 'Application', ref: lesson.ref, text: a[k], when: when, sub: k });
          });
        });
      });
      out.sort(function (x, y) { return y.when - x.when; });
      return out;
    },

    /* Theme -------------------------------------------------------------- */

    dark: function () {
      if (api.signedIn()) return !!api.state().dark;
      try { return localStorage.getItem('study-theme') === 'dark'; } catch (e) { return false; }
    },

    setDark: function (on) {
      if (api.signedIn()) api.update(function (s) { s.dark = !!on; });
      try { localStorage.setItem('study-theme', on ? 'dark' : 'light'); } catch (e) { /* ignore */ }
    }
  };

  return api;
})();
