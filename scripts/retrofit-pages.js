/* Keeps every page's <head> on the current script stack: design stylesheet,
 * Supabase client + config, course index, store, and the shell. Idempotent —
 * run it after changing the stack. Run: node scripts/retrofit-pages.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COURSES = ['john', 'matthew', 'isaiah', 'trinity'];

let touched = 0, skipped = 0;

/* Order matters: config and the vendored client define the globals store.js
   needs; the page script registers window.Page; shell.js runs last and calls it. */
function stack(prefix, pageScripts) {
  return [
    `<script src="${prefix}assets/config.js" defer></script>`,
    `<script src="${prefix}assets/vendor/supabase.js" defer></script>`,
    `<script src="${prefix}assets/data/courses.js" defer></script>`,
    `<script src="${prefix}assets/store.js" defer></script>`,
    `<script src="${prefix}assets/ui.js" defer></script>`
  ].concat(pageScripts.map((s) => `<script src="${s.startsWith('.') ? s : prefix + s}" defer></script>`))
    .concat([`<script src="${prefix}assets/shell.js" defer></script>`])
    .join('\n');
}

const BLOCK_RE = /<script src="[^"]*assets\/(?:config|vendor\/supabase|data\/courses|store|ui|notes|lesson|shell|dashboard|catalog|course-page|notebook-page|settings)\.js" defer><\/script>\n?/g;
const COURSE_JS_RE = /<script src="(\.\.\/course\.js|course\.js)" defer><\/script>\n?/;

function retrofit(file, prefix, pageScripts, keepCourseJs) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  if (!html.includes('assets/lms.css')) {
    html = html.replace(
      new RegExp(`<link rel="stylesheet" href="${prefix.replace(/\./g, '\\.')}assets/course\\.css">`),
      `<link rel="stylesheet" href="${prefix}assets/course.css">\n<link rel="stylesheet" href="${prefix}assets/lms.css">`
    );
  }

  let courseTag = '';
  if (keepCourseJs) {
    const m = html.match(COURSE_JS_RE);
    if (m) { courseTag = m[0].trim(); html = html.replace(COURSE_JS_RE, ''); }
  }

  html = html.replace(BLOCK_RE, '\x00');
  const block = (courseTag ? courseTag + '\n' : '') + stack(prefix, pageScripts);
  html = html.replace('\x00', block + '\n').replace(/\x00/g, '');

  if (html === before) { skipped++; return; }
  fs.writeFileSync(file, html);
  touched++;
}

COURSES.forEach((key) => {
  ['lessons', 'reference'].forEach((dir) => {
    const full = path.join(ROOT, key, dir);
    if (!fs.existsSync(full)) return;
    fs.readdirSync(full).filter((f) => f.endsWith('.html')).forEach((f) => {
      const pageScripts = dir === 'lessons'
        ? ['assets/notes.js', 'assets/lesson.js']
        : [];
      retrofit(path.join(full, f), '../../', pageScripts, true);
    });
  });
});

console.log('retrofitted', touched, 'pages,', skipped, 'already current');
