/* Generates assets/data/courses.js from the lesson HTML + per-course course.js.
 * Run: node scripts/build-course-data.js   (no deps) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

const META = {
  matthew: {
    name: 'Matthew',
    initial: 'M',
    tagline: 'The King and his kingdom',
    epigraph: '"Go therefore and make disciples of all nations." — Matthew 28:19',
    detail: 'lessons · verse-by-verse · all 28 chapters',
    status: 'complete'
  },
  john: {
    name: 'John',
    initial: 'J',
    tagline: 'Seven signs, seven "I am" claims',
    epigraph: '"These are written so that you may believe that Jesus is the Christ, the Son of God." — John 20:31',
    detail: 'lessons · verse-by-verse · all 21 chapters',
    status: 'complete'
  },
  isaiah: {
    name: 'Isaiah',
    initial: 'I',
    tagline: 'The Holy One of Israel',
    epigraph: '"Holy, holy, holy is the LORD of hosts; the whole earth is full of his glory." — Isaiah 6:3',
    detail: 'lessons · verse-by-verse · judgment, remnant, Servant',
    status: 'in progress'
  },
  trinity: {
    name: 'The Trinity',
    initial: 'T',
    tagline: 'One God, three persons',
    epigraph: '"The grace of the Lord Jesus Christ and the love of God and the fellowship of the Holy Spirit be with you all." — 2 Corinthians 13:14',
    detail: 'lessons · doctrine course · from the Shema to the benediction',
    status: 'complete'
  }
};

function readCourseJs(key) {
  const src = fs.readFileSync(path.join(ROOT, key, 'course.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.COURSE;
}

function decode(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? decode(m[1]) : '';
}

function extractQuiz(html, id) {
  const re = new RegExp("Quiz\\.render\\(\\s*'" + id + "'\\s*,", '');
  const start = html.search(re);
  if (start === -1) return [];
  const open = html.indexOf('[', start);
  if (open === -1) return [];
  // Walk to the matching bracket, ignoring brackets inside strings.
  let depth = 0, i = open, quote = null;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) break; }
  }
  const literal = html.slice(open, i + 1);
  try {
    return vm.runInNewContext('(' + literal + ')');
  } catch (e) {
    return [];
  }
}

function build(key) {
  const course = readCourseJs(key);
  const meta = META[key];
  const lessons = course.lessons.map((l, idx) => {
    const html = fs.readFileSync(path.join(ROOT, key, 'lessons', l.f), 'utf8');
    const kicker = firstMatch(html, /<p class="kicker">([\s\S]*?)<\/p>/);
    const lessonMeta = firstMatch(html, /<p class="lesson-meta">([\s\S]*?)<\/p>/);
    const title = firstMatch(html, /<h1>([\s\S]*?)<\/h1>/);

    const unitPart = (kicker.split('·')[1] || 'Orientation').trim();
    const minsMatch = lessonMeta.match(/~(\d+)\s*min/);
    const passageMatch = lessonMeta.match(/(?:Passage|Texts today|Text)\s*:\s*([^(]+)\(/);

    const bq = html.match(/<blockquote class="scripture">([\s\S]*?)<\/blockquote>/);
    let verseText = '', verseRef = '';
    if (bq) {
      const inner = bq[1];
      verseRef = firstMatch(inner, /<span class="ref">([\s\S]*?)<\/span>/);
      verseText = decode(inner.replace(/<span class="ref">[\s\S]*?<\/span>/, ''));
    }

    const ref = passageMatch
      ? passageMatch[1].trim().replace(/\s*,\s*$/, '')
      : (title.split(':').length > 1 ? title.split('·')[0].trim() : '');

    return {
      f: l.f,
      n: idx + 1,
      title: (l.t.split('·').slice(1).join('·').trim() || l.t).trim(),
      short: l.t,
      ref: ref,
      unit: unitPart,
      mins: minsMatch ? Number(minsMatch[1]) : 30,
      verseRef: verseRef,
      verseText: verseText,
      // Question counts only: the questions themselves stay inline in the lesson
      // pages, so this index stays small enough to load on every screen.
      q: extractQuiz(html, 'quiz').length,
      r: extractQuiz(html, 'recall').length
    };
  });

  const units = [];
  lessons.forEach((l) => {
    const name = l.unit.replace(/\s*·\s*Recap$/, '');
    let u = units.find((x) => x.title === name);
    if (!u) { u = { title: name, lessons: [] }; units.push(u); }
    u.lessons.push(l.f);
  });

  return {
    key: key,
    name: meta.name,
    initial: meta.initial,
    title: course.title,
    tagline: meta.tagline,
    epigraph: meta.epigraph,
    detail: lessons.length + ' ' + meta.detail,
    status: meta.status,
    refs: course.refs || [],
    units: units,
    lessons: lessons
  };
}

const out = {};
['john', 'matthew', 'isaiah', 'trinity'].forEach((k) => { out[k] = build(k); });

const banner = '/* GENERATED by scripts/build-course-data.js — do not edit by hand.\n' +
  ' * Course + lesson metadata (units, references, scripture, quizzes) parsed out of\n' +
  ' * the lesson HTML so the LMS shell can render catalog, course and dashboard views. */\n';

fs.mkdirSync(path.join(ROOT, 'assets', 'data'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'assets', 'data', 'courses.js'),
  banner + 'window.COURSES = ' + JSON.stringify(out) + ';\n'
);

const totals = Object.values(out).map((c) => c.key + ':' + c.lessons.length + 'L/' + c.units.length + 'U/' +
  c.lessons.filter((l) => l.q).length + 'Q');
console.log('wrote assets/data/courses.js —', totals.join(' '));
