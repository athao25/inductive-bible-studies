/* Account + study data, backed by Supabase.
 *
 * Auth is Supabase Auth (email + password); every row is scoped by row-level
 * security to auth.uid(), so this file never filters by user itself — it asks
 * for what it needs and the database returns only that account's rows.
 *
 * Load order on every page:
 *   assets/config.js  assets/vendor/supabase.js  assets/data/courses.js  assets/store.js
 *
 * Everything here is async. Call `await Store.init()` once (assets/shell.js
 * does it) before any other method; after that the cached reads below are
 * synchronous and the writes return promises.
 *
 * Lessons are addressed the way the site already addresses them — course key
 * plus lesson file name — and mapped to lesson ids through an index cached in
 * sessionStorage, so a page load costs one round trip, not 214.
 */
window.Store = (function () {
  var LESSON_CACHE = 'ibs-lesson-index-v1';
  var THEME_KEY = 'study-theme';           // mirrored so theme.js can paint before JS runs
  var DEFAULT_FAV_REF = '2 Timothy 2:15';
  var DEFAULT_FAV_TEXT = 'Do your best to present yourself to God as one approved, a worker ' +
    'who has no need to be ashamed, rightly handling the word of truth.';

  var client = null;
  var session = null;
  var profile = null;
  var index = null;        // { 'john/0020-....html': lessonId, ... } plus reverse
  var progress = {};       // 'john/0020-....html' -> { section, updated, completed }
  var attempts = [];       // { course, file, score, total, at }
  var ready = null;

  function local(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function setLocal(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode etc. */ }
  }

  function fail(error) {
    if (!error) return null;
    return { error: error.message || String(error) };
  }

  /* ------------------------------------------------------------- client */

  function build() {
    if (client) return client;
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return null;
    client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }

  /* Lesson id lookup. Content is world-readable and changes only when lessons
     are added, so it is cached for the tab rather than refetched per page. */
  async function loadIndex() {
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(LESSON_CACHE)); } catch (e) { /* ignore */ }
    if (cached && cached.byKey && Object.keys(cached.byKey).length) { index = cached; return; }

    var res = await client.from('lessons').select('id, course_id, slug');
    if (res.error) { index = { byKey: {}, byId: {} }; return; }
    var byKey = {}, byId = {};
    res.data.forEach(function (row) {
      var key = row.course_id + '/' + row.slug;
      byKey[key] = row.id;
      byId[row.id] = key;
    });
    index = { byKey: byKey, byId: byId };
    try { sessionStorage.setItem(LESSON_CACHE, JSON.stringify(index)); } catch (e) { /* ignore */ }
  }

  async function loadUserData() {
    progress = {};
    attempts = [];
    profile = null;
    if (!session) return;

    var results = await Promise.all([
      client.from('profiles').select('display_name, fav_verse_ref, fav_verse_text, dark_mode').maybeSingle(),
      client.from('lesson_progress').select('lesson_id, section, completed_at, updated_at'),
      client.from('quiz_attempts').select('lesson_id, score, total, created_at').order('created_at', { ascending: false })
    ]);

    var p = results[0].data;
    profile = {
      name: (p && p.display_name) || session.user.email.split('@')[0],
      favRef: (p && p.fav_verse_ref) || DEFAULT_FAV_REF,
      favText: (p && p.fav_verse_text) || DEFAULT_FAV_TEXT,
      dark: !!(p && p.dark_mode)
    };
    setLocal(THEME_KEY, profile.dark ? 'dark' : 'light');

    (results[1].data || []).forEach(function (row) {
      var key = index.byId[row.lesson_id];
      if (!key) return;
      progress[key] = {
        section: row.section || '',
        updated: Date.parse(row.updated_at) || 0,
        completed: row.completed_at ? Date.parse(row.completed_at) : 0
      };
    });

    (results[2].data || []).forEach(function (row) {
      var key = index.byId[row.lesson_id];
      if (!key) return;
      var parts = key.split('/');
      attempts.push({
        course: parts[0], file: parts[1],
        score: row.score, total: row.total, at: Date.parse(row.created_at) || 0
      });
    });
  }

  function lessonId(course, file) {
    return index && index.byKey[course + '/' + file];
  }

  /* ---------------------------------------------------------------- api */

  var api = {
    DEFAULT_FAV_REF: DEFAULT_FAV_REF,
    DEFAULT_FAV_TEXT: DEFAULT_FAV_TEXT,

    /* Resolves once the session, lesson index and this account's rows are in
       hand. Safe to await repeatedly; the work happens once. */
    init: function () {
      if (ready) return ready;
      ready = (async function () {
        if (!build()) return { error: 'Supabase is not configured. Set SUPABASE_ANON_KEY in assets/config.js.' };
        var got = await client.auth.getSession();
        session = got.data.session || null;
        await loadIndex();
        await loadUserData();
        client.auth.onAuthStateChange(function (event, next) {
          session = next || null;
        });
        return { ok: true };
      })();
      return ready;
    },

    configured: function () { return !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY); },
    client: function () { return client; },

    /* --------------------------------------------------------- accounts */

    signedIn: function () { return !!session; },

    user: function () {
      if (!session) return null;
      return {
        id: session.user.id,
        email: session.user.email,
        name: (profile && profile.name) || session.user.email.split('@')[0]
      };
    },

    signUp: async function (email, name, password) {
      if (!build()) return { error: 'Supabase is not configured.' };
      var res = await client.auth.signUp({
        email: String(email || '').trim(),
        password: password,
        options: { data: { display_name: (name || '').trim() } }
      });
      if (res.error) return fail(res.error);
      // With email confirmation on, Supabase returns a user but no session.
      if (!res.data.session) return { ok: true, needsConfirmation: true };
      session = res.data.session;
      await loadUserData();
      return { ok: true };
    },

    signIn: async function (email, password) {
      if (!build()) return { error: 'Supabase is not configured.' };
      var res = await client.auth.signInWithPassword({
        email: String(email || '').trim(),
        password: password
      });
      if (res.error) return fail(res.error);
      session = res.data.session;
      await loadUserData();
      return { ok: true };
    },

    resetPassword: async function (email, redirectTo) {
      if (!build()) return { error: 'Supabase is not configured.' };
      var res = await client.auth.resetPasswordForEmail(String(email || '').trim(), { redirectTo: redirectTo });
      return res.error ? fail(res.error) : { ok: true };
    },

    signOut: async function () {
      if (client) await client.auth.signOut();
      session = null;
      profile = null;
      progress = {};
      attempts = [];
      return { ok: true };
    },

    /* ---------------------------------------------------------- profile */

    state: function () {
      return profile || { name: '', favRef: DEFAULT_FAV_REF, favText: DEFAULT_FAV_TEXT, dark: false };
    },

    updateProfile: async function (patch) {
      if (!session) return { error: 'Not signed in.' };
      var row = {};
      if ('name' in patch) row.display_name = patch.name;
      if ('favRef' in patch) row.fav_verse_ref = patch.favRef;
      if ('favText' in patch) row.fav_verse_text = patch.favText;
      if ('dark' in patch) row.dark_mode = !!patch.dark;

      var res = await client.from('profiles').update(row).eq('user_id', session.user.id);
      if (res.error) return fail(res.error);
      Object.keys(patch).forEach(function (k) { profile[k] = patch[k]; });
      if ('dark' in patch) setLocal(THEME_KEY, patch.dark ? 'dark' : 'light');
      return { ok: true };
    },

    /* --------------------------------------------------------- progress */

    lessonProgress: function (course, file) { return progress[course + '/' + file] || null; },

    isComplete: function (course, file) {
      var p = progress[course + '/' + file];
      return !!(p && p.completed);
    },

    /* Records where the reader is. Called on scroll, so it writes at most one
       row and never blocks rendering. */
    touchLesson: async function (course, file, section) {
      if (!session) return { error: 'Not signed in.' };
      var id = lessonId(course, file);
      if (!id) return { error: 'Unknown lesson.' };
      var key = course + '/' + file;
      var current = progress[key] || { section: '', updated: 0, completed: 0 };
      current.section = section || current.section;
      current.updated = Date.now();
      progress[key] = current;

      var res = await client.from('lesson_progress').upsert({
        user_id: session.user.id,
        lesson_id: id,
        section: current.section,
        completed_at: current.completed ? new Date(current.completed).toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
      return res.error ? fail(res.error) : { ok: true };
    },

    setComplete: async function (course, file, done) {
      if (!session) return { error: 'Not signed in.' };
      var id = lessonId(course, file);
      if (!id) return { error: 'Unknown lesson.' };
      var key = course + '/' + file;
      var current = progress[key] || { section: '', updated: 0, completed: 0 };
      current.completed = done ? Date.now() : 0;
      current.updated = Date.now();
      progress[key] = current;

      var res = await client.from('lesson_progress').upsert({
        user_id: session.user.id,
        lesson_id: id,
        section: current.section,
        completed_at: done ? new Date(current.completed).toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
      return res.error ? fail(res.error) : { ok: true };
    },

    courseStats: function (key) {
      var c = window.COURSES && window.COURSES[key];
      if (!c) return { done: 0, total: 0, pct: 0 };
      var done = c.lessons.filter(function (l) { return api.isComplete(key, l.f); }).length;
      return { done: done, total: c.lessons.length, pct: c.lessons.length ? Math.round(done / c.lessons.length * 100) : 0 };
    },

    /* Newest touched-but-unfinished lesson, else the next uncompleted lesson of
       the most recently touched course, else the first lesson of John. */
    resume: function () {
      var courses = window.COURSES || {};
      var best = null;
      Object.keys(progress).forEach(function (key) {
        var p = progress[key];
        if (p.completed || !p.updated) return;
        if (!best || p.updated > best.updated) best = { key: key, updated: p.updated, section: p.section };
      });

      if (!best) {
        var newest = 0, newestCourse = null;
        Object.keys(progress).forEach(function (key) {
          var p = progress[key];
          var t = Math.max(p.updated || 0, p.completed || 0);
          if (t > newest) { newest = t; newestCourse = key.split('/')[0]; }
        });
        var ck = newestCourse || 'john';
        var course = courses[ck];
        if (!course) return null;
        var next = course.lessons.find(function (l) { return !api.isComplete(ck, l.f); }) || course.lessons[0];
        return { course: ck, lesson: next, section: '' };
      }

      var parts = best.key.split('/');
      var cc = courses[parts[0]];
      if (!cc) return null;
      var lesson = cc.lessons.find(function (l) { return l.f === parts[1]; });
      return lesson ? { course: parts[0], lesson: lesson, section: best.section } : null;
    },

    /* ------------------------------------------------------------- quiz */

    recordQuiz: async function (course, file, score, total) {
      if (!session) return { error: 'Not signed in.' };
      var id = lessonId(course, file);
      if (!id) return { error: 'Unknown lesson.' };
      attempts.unshift({ course: course, file: file, score: score, total: total, at: Date.now() });
      var res = await client.from('quiz_attempts').insert({
        user_id: session.user.id, lesson_id: id, score: score, total: total
      });
      return res.error ? fail(res.error) : { ok: true };
    },

    /* Latest attempt per lesson, newest first. */
    quizHistory: function (limit) {
      var latest = {};
      attempts.forEach(function (a) {
        var key = a.course + '/' + a.file;
        if (!latest[key] || a.at > latest[key].at) latest[key] = a;
      });
      var rows = Object.keys(latest).map(function (k) { return latest[k]; });
      rows.sort(function (a, b) { return b.at - a.at; });
      return limit ? rows.slice(0, limit) : rows;
    },

    quizAverage: function (key) {
      var rows = api.quizHistory().filter(function (a) { return a.course === key; });
      if (!rows.length) return null;
      var pct = rows.reduce(function (n, a) { return n + (a.total ? a.score / a.total : 0); }, 0) / rows.length;
      return Math.round(pct * 100);
    },

    /* ------------------------------------------------------------ notes */

    /* One lesson's notes, in the shape the lesson panel edits:
       { o: [{ r, t, h }], i: [...], a: { god, me, do } } */
    lessonNotes: async function (course, file) {
      var empty = { o: [], i: [], a: {}, u: 0 };
      if (!session) return empty;
      var id = lessonId(course, file);
      if (!id) return empty;
      var res = await client.from('notes')
        .select('id, kind, slot, reference, body, clip, position, updated_at')
        .eq('lesson_id', id)
        .order('position', { ascending: true });
      if (res.error || !res.data) return empty;

      var out = { o: [], i: [], a: {}, u: 0 };
      res.data.forEach(function (row) {
        var when = Date.parse(row.updated_at) || 0;
        if (when > out.u) out.u = when;
        if (row.kind === 'application') { out.a[row.slot] = row.body; return; }
        var line = { r: row.reference || '', t: row.body };
        if (row.clip) line.h = row.clip;
        out[row.kind === 'observation' ? 'o' : 'i'].push(line);
      });
      return out;
    },

    /* Replaces this lesson's notes with what the panel currently holds. The
       panel is the whole editing surface for one lesson, so a delete-then-insert
       keeps the rows and the UI in step without diffing line by line. */
    saveLessonNotes: async function (course, file, data) {
      if (!session) return { error: 'Not signed in.' };
      var id = lessonId(course, file);
      if (!id) return { error: 'Unknown lesson.' };

      var rows = [];
      ['o', 'i'].forEach(function (stage) {
        (data[stage] || []).forEach(function (line, i) {
          if (!line.t) return;
          rows.push({
            user_id: session.user.id, lesson_id: id,
            kind: stage === 'o' ? 'observation' : 'interpretation',
            slot: null, reference: line.r || '', body: line.t, clip: line.h || '', position: i
          });
        });
      });
      ['god', 'me', 'do'].forEach(function (slot, i) {
        var body = (data.a || {})[slot];
        if (!body) return;
        rows.push({
          user_id: session.user.id, lesson_id: id,
          kind: 'application', slot: slot, reference: '', body: body, clip: '', position: i
        });
      });

      var del = await client.from('notes').delete().eq('lesson_id', id);
      if (del.error) return fail(del.error);
      if (!rows.length) return { ok: true, count: 0 };
      var ins = await client.from('notes').insert(rows);
      return ins.error ? fail(ins.error) : { ok: true, count: rows.length };
    },

    /* Every note this account has written, newest first, for the notebook. */
    allNotes: async function () {
      if (!session) return [];
      var res = await client.from('notes')
        .select('lesson_id, kind, slot, reference, body, clip, updated_at')
        .order('updated_at', { ascending: false });
      if (res.error || !res.data) return [];

      var courses = window.COURSES || {};
      var out = [];
      res.data.forEach(function (row) {
        var key = index.byId[row.lesson_id];
        if (!key) return;
        var parts = key.split('/');
        var course = courses[parts[0]];
        var lesson = course && course.lessons.find(function (l) { return l.f === parts[1]; });
        if (!lesson) return;
        out.push({
          course: parts[0], file: parts[1], lesson: lesson,
          kind: row.kind.charAt(0).toUpperCase() + row.kind.slice(1),
          slot: row.slot || '',
          ref: row.reference || lesson.ref,
          text: row.body,
          clip: row.clip || '',
          when: Date.parse(row.updated_at) || 0
        });
      });
      return out;
    },

    /* ------------------------------------------------------------ theme */

    dark: function () {
      if (profile) return !!profile.dark;
      return local(THEME_KEY) === 'dark';
    },

    setDark: function (on) {
      setLocal(THEME_KEY, on ? 'dark' : 'light');
      if (profile) profile.dark = !!on;
      if (session) return api.updateProfile({ dark: !!on });
      return Promise.resolve({ ok: true });
    }
  };

  return api;
})();
