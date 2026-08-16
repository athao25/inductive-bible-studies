/* Notebook: every note written in a lesson, newest first, filtered by stage.
 * Keeps the pre-redesign exports (Markdown, JSON backup, print) as actions. */
window.Page = async function (ctx) {
  var el = UI.el;
  var notes = await Store.allNotes();
  var filters = ['All', 'Observation', 'Interpretation', 'Application', 'Highlights'];
  var active = 'All';

  var courseCount = {};
  notes.forEach(function (n) { courseCount[n.course] = 1; });
  var nCourses = Object.keys(courseCount).length;
  document.getElementById('nb-count').textContent =
    notes.length + (notes.length === 1 ? ' note' : ' notes') + ' across ' +
    nCourses + ' course' + (nCourses === 1 ? '' : 's') + ' · synced to your account';

  var list = document.getElementById('nb-list');
  var chips = document.getElementById('nb-filters');

  function rowsFor(kind) {
    if (kind === 'All') return notes;
    if (kind === 'Highlights') return notes.filter(function (n) { return n.clip; });
    return notes.filter(function (n) { return n.kind === kind; });
  }

  function paint() {
    list.textContent = '';
    var rows = rowsFor(active);
    if (!rows.length) {
      list.appendChild(el('div', 'empty', active === 'All'
        ? 'No notes yet. Open a lesson and write in the notes panel; everything lands here.'
        : 'Nothing under ' + active.toLowerCase() + ' yet.'));
      return;
    }
    rows.forEach(function (n) {
      var card = el('div', 'nb-note');
      var top = el('div', 'nb-note-top');
      top.appendChild(el('span', 'nb-note-ref', n.ref || n.lesson.ref || n.lesson.title));
      top.appendChild(el('span', 'nb-note-when', UI.relTime(n.when)));
      card.appendChild(top);
      if (n.clip) card.appendChild(el('div', 'nb-clip-text', '“' + n.clip + '”'));
      card.appendChild(el('div', 'nb-note-text', n.text));
      var foot = el('div', 'nb-note-foot');
      foot.appendChild(el('span', 'nb-tag', n.kind));
      var open = el('a', 'nb-open', 'Open lesson →');
      open.href = UI.lessonHref(ctx.root, n.course, n.file);
      foot.appendChild(open);
      card.appendChild(foot);
      list.appendChild(card);
    });
  }

  filters.forEach(function (f) {
    var b = el('button', 'chip' + (f === active ? ' active' : ''), f);
    b.type = 'button';
    b.addEventListener('click', function () {
      active = f;
      chips.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('active', x.textContent === f); });
      paint();
    });
    chips.appendChild(b);
  });

  /* exports -------------------------------------------------------------- */

  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function markdown() {
    var byCourse = {};
    rowsFor(active).forEach(function (n) { (byCourse[n.course] = byCourse[n.course] || []).push(n); });
    var out = ['# My notebook', ''];
    Object.keys(byCourse).forEach(function (key) {
      out.push('## ' + window.COURSES[key].name, '');
      var byLesson = {};
      byCourse[key].forEach(function (n) { (byLesson[n.file] = byLesson[n.file] || []).push(n); });
      Object.keys(byLesson).forEach(function (file) {
        var lesson = byLesson[file][0].lesson;
        out.push('### Lesson ' + lesson.n + ' · ' + lesson.title + (lesson.ref ? ' (' + lesson.ref + ')' : ''), '');
        byLesson[file].forEach(function (n) {
          if (n.clip) out.push('> ' + n.clip);
          out.push('- **' + n.kind + '**' + (n.ref ? ' _' + n.ref + '_' : '') + ' — ' + n.text);
        });
        out.push('');
      });
    });
    return out.join('\n');
  }

  var actions = document.getElementById('nb-actions');
  [
    ['Markdown', function () { download('notebook.md', markdown(), 'text/markdown'); }],
    ['Backup JSON', function () {
      var dump = notes.map(function (n) {
        return {
          course: n.course, lesson: n.file, lessonTitle: n.lesson.title,
          kind: n.kind, slot: n.slot, reference: n.ref, body: n.text,
          clip: n.clip, updatedAt: new Date(n.when).toISOString()
        };
      });
      download('notebook-backup.json', JSON.stringify(dump, null, 2), 'application/json');
    }],
    ['Print', function () { window.print(); }]
  ].forEach(function (pair) {
    var b = el('button', 'chip', pair[0]);
    b.type = 'button';
    b.addEventListener('click', pair[1]);
    actions.appendChild(b);
  });

  paint();
};
