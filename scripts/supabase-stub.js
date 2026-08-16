/* In-memory stand-in for @supabase/supabase-js, used by scripts/smoke-test.js.
 *
 * Implements only the surface assets/store.js touches: password auth and the
 * PostgREST chains (select/insert/update/upsert/delete + eq/order/maybeSingle).
 * Row scoping mirrors the RLS policies — every per-user table is filtered to the
 * signed-in user — so a test that passes here would also pass against the real
 * database, and a query that ignores ownership fails the same way. */
const path = require('path');

function createStub(courses) {
  const users = new Map();            // email -> { id, email, password, meta }
  const db = {
    profiles: [],
    lesson_progress: [],
    quiz_attempts: [],
    notes: [],
    lessons: []
  };
  let session = null;
  let seq = 1;
  const listeners = [];

  // Seed content the way supabase/migrations/0002_seed_content.sql does.
  Object.keys(courses).forEach((key) => {
    courses[key].lessons.forEach((l) => {
      db.lessons.push({ id: seq++, course_id: key, slug: l.f, n: l.n, title: l.title });
    });
  });

  const now = () => new Date().toISOString();
  const uid = () => (session ? session.user.id : null);

  const OWNED = { profiles: 1, lesson_progress: 1, quiz_attempts: 1, notes: 1 };

  function visible(table) {
    const rows = db[table] || [];
    if (!OWNED[table]) return rows;
    const me = uid();
    return me ? rows.filter((r) => r.user_id === me) : [];
  }

  function builder(table) {
    const filters = [];
    let order = null;
    let single = false;
    let op = { kind: 'select' };

    const chain = {
      select() { op = { kind: 'select' }; return chain; },
      insert(rows) { op = { kind: 'insert', rows: [].concat(rows) }; return chain; },
      upsert(rows) { op = { kind: 'upsert', rows: [].concat(rows) }; return chain; },
      update(row) { op = { kind: 'update', row }; return chain; },
      delete() { op = { kind: 'delete' }; return chain; },
      eq(col, val) { filters.push([col, val]); return chain; },
      order(col, opts) { order = { col, asc: !opts || opts.ascending !== false }; return chain; },
      maybeSingle() { single = true; return chain; },
      // Await once, run once: a second await returns the same result rather than
      // replaying the insert.
      then(resolve, reject) {
        if (!settled) settled = Promise.resolve(run());
        return settled.then(resolve, reject);
      }
    };
    let settled = null;

    function matches(row) {
      return filters.every(([col, val]) => row[col] === val);
    }

    function run() {
      const me = uid();
      if (OWNED[table] && !me && op.kind !== 'select') {
        return { data: null, error: { message: 'new row violates row-level security policy' } };
      }

      if (op.kind === 'insert' || op.kind === 'upsert') {
        for (const row of op.rows) {
          // RLS: WITH CHECK (auth.uid() = user_id)
          if (OWNED[table] && row.user_id !== me) {
            return { data: null, error: { message: 'new row violates row-level security policy' } };
          }
          if (op.kind === 'upsert' && table === 'lesson_progress') {
            const found = db[table].find((r) => r.user_id === row.user_id && r.lesson_id === row.lesson_id);
            if (found) { Object.assign(found, row); continue; }
          }
          db[table].push(Object.assign({ id: seq++, created_at: now(), updated_at: now() }, row));
        }
        return { data: op.rows, error: null };
      }

      if (op.kind === 'update') {
        visible(table).filter(matches).forEach((row) => Object.assign(row, op.row, { updated_at: now() }));
        return { data: null, error: null };
      }

      if (op.kind === 'delete') {
        const doomed = new Set(visible(table).filter(matches));
        db[table] = db[table].filter((r) => !doomed.has(r));
        return { data: null, error: null };
      }

      let rows = visible(table).filter(matches);
      if (order) {
        rows = rows.slice().sort((a, b) => {
          const x = a[order.col], y = b[order.col];
          if (x === y) return 0;
          return (x > y ? 1 : -1) * (order.asc ? 1 : -1);
        });
      }
      return { data: single ? (rows[0] || null) : rows, error: null };
    }

    return chain;
  }

  function emit(event) { listeners.forEach((fn) => fn(event, session)); }

  const auth = {
    async getSession() { return { data: { session }, error: null }; },

    async signUp({ email, password, options }) {
      if (users.has(email)) return { data: {}, error: { message: 'User already registered' } };
      const user = { id: 'user-' + (users.size + 1), email, password, meta: (options && options.data) || {} };
      users.set(email, user);
      // Mirrors the on_auth_user_created trigger.
      db.profiles.push({
        user_id: user.id,
        display_name: user.meta.display_name || email.split('@')[0],
        fav_verse_ref: '2 Timothy 2:15',
        fav_verse_text: 'Do your best to present yourself to God as one approved, a worker who has no need to be ashamed, rightly handling the word of truth.',
        dark_mode: false
      });
      session = { user: { id: user.id, email } };
      emit('SIGNED_IN');
      return { data: { session, user }, error: null };
    },

    async signInWithPassword({ email, password }) {
      const user = users.get(email);
      if (!user || user.password !== password) {
        return { data: {}, error: { message: 'Invalid login credentials' } };
      }
      session = { user: { id: user.id, email } };
      emit('SIGNED_IN');
      return { data: { session, user }, error: null };
    },

    async resetPasswordForEmail() { return { data: {}, error: null }; },

    async signOut() { session = null; emit('SIGNED_OUT'); return { error: null }; },

    onAuthStateChange(fn) {
      listeners.push(fn);
      return { data: { subscription: { unsubscribe() {} } } };
    }
  };

  return {
    createClient() { return { auth, from: builder }; },
    _db: db,
    _users: users
  };
}

module.exports = { createStub };
