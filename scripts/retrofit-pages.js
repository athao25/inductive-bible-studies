/* Rewrites the head of every lesson and reference page onto the LMS shell:
 * adds assets/lms.css after course.css and swaps the old assets/nav.js sidebar
 * for the store + shell stack. Idempotent. Run: node scripts/retrofit-pages.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COURSES = ['john', 'matthew', 'isaiah', 'trinity'];

let touched = 0, skipped = 0;

function stack(prefix, isLesson) {
  const lines = [
    `<script src="${prefix}assets/data/courses.js" defer></script>`,
    `<script src="${prefix}assets/store.js" defer></script>`,
    `<script src="${prefix}assets/ui.js" defer></script>`
  ];
  if (isLesson) lines.push(`<script src="${prefix}assets/lesson.js" defer></script>`);
  lines.push(`<script src="${prefix}assets/shell.js" defer></script>`);
  return lines.join('\n');
}

function retrofit(file, prefix, isLesson) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('assets/shell.js')) { skipped++; return; }

  html = html.replace(
    new RegExp(`<link rel="stylesheet" href="${prefix.replace(/\./g, '\\.')}assets/course\\.css">`),
    `<link rel="stylesheet" href="${prefix}assets/course.css">\n<link rel="stylesheet" href="${prefix}assets/lms.css">`
  );

  // The old sidebar script becomes the LMS stack; lesson.js only on lessons.
  html = html.replace(
    new RegExp(`<script src="${prefix.replace(/\./g, '\\.')}assets/nav\\.js" defer></script>`),
    stack(prefix, isLesson)
  );

  fs.writeFileSync(file, html);
  touched++;
}

COURSES.forEach((key) => {
  ['lessons', 'reference'].forEach((dir) => {
    const full = path.join(ROOT, key, dir);
    if (!fs.existsSync(full)) return;
    fs.readdirSync(full).filter((f) => f.endsWith('.html')).forEach((f) => {
      retrofit(path.join(full, f), '../../', dir === 'lessons');
    });
  });
});

console.log('retrofitted', touched, 'pages,', skipped, 'already current');
