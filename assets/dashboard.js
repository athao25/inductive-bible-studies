/* Dashboard: favourite-verse banner, resume card, course progress, quiz
 * history and recent notes. Rendered by Shell once the user is signed in. */
window.Page = async function (ctx) {
  var el = UI.el;
  var user = Store.user();
  var state = Store.state();
  var courses = window.COURSES;

  document.getElementById('date-line').textContent = UI.dateLine();
  document.getElementById('greeting').textContent = UI.greeting() + ', ' + user.name;

  /* favourite verse ------------------------------------------------------ */
  document.getElementById('fav-text').textContent = '"' + (state.favText || Store.DEFAULT_FAV_TEXT) + '"';
  document.getElementById('fav-ref').textContent = '— ' + (state.favRef || Store.DEFAULT_FAV_REF);
  document.getElementById('fav-edit').addEventListener('click', function () {
    location.href = ctx.url('settings.html');
  });

  /* resume --------------------------------------------------------------- */
  var resume = Store.resume();
  if (resume) {
    var c = courses[resume.course];
    var l = resume.lesson;
    document.getElementById('resume-title').textContent = (l.ref ? l.ref + ' · ' : '') + l.title;
    var meta = ['Lesson ' + l.n + ' of ' + c.lessons.length, UI.unitShort(l.unit), '~' + l.mins + ' min'];
    if (resume.section) meta.push('you stopped at ' + resume.section);
    document.getElementById('resume-meta').textContent = meta.join(' · ');
    document.getElementById('resume-btn').addEventListener('click', function () {
      location.href = UI.lessonHref(ctx.root, resume.course, l.f);
    });
  } else {
    document.getElementById('resume').style.display = 'none';
  }

  /* my courses ----------------------------------------------------------- */
  var rows = document.getElementById('course-rows');
  Object.keys(courses).forEach(function (key) {
    var course = courses[key];
    var stats = Store.courseStats(key);
    var next = course.lessons.find(function (x) { return !Store.isComplete(key, x.f); });
    var a = el('a', 'course-row');
    a.href = UI.courseHref(ctx.root, key);
    a.appendChild(el('div', 'course-tile', course.initial));
    var mid = el('div');
    mid.appendChild(el('div', 'course-row-name', course.name));
    var metaText = stats.done === stats.total
      ? 'Complete · ' + stats.total + ' lessons'
      : (next ? UI.unitShort(next.unit) + ' · ' + stats.done + ' of ' + stats.total + ' lessons'
              : stats.done + ' of ' + stats.total + ' lessons');
    mid.appendChild(el('div', 'course-row-meta', metaText));
    a.appendChild(mid);
    a.appendChild(UI.bar(stats.pct));
    a.appendChild(el('div', 'pct', stats.pct + '%'));
    rows.appendChild(a);
  });

  document.getElementById('browse').href = ctx.url('courses.html');

  /* quiz history --------------------------------------------------------- */
  var quizWrap = document.getElementById('quiz-rows');
  var history = Store.quizHistory(6);
  if (!history.length) {
    quizWrap.appendChild(el('div', 'empty', 'No quiz attempts yet. Every lesson ends with one.'));
  }
  history.forEach(function (a) {
    var course = courses[a.course];
    var lesson = course && course.lessons.find(function (x) { return x.f === a.file; });
    var row = el('div', 'quiz-row');
    var pct = a.total ? a.score / a.total : 0;
    row.appendChild(el('span', 'quiz-score ' + (pct >= 0.8 ? 'good' : 'warn'), a.score + '/' + a.total));
    row.appendChild(el('span', 'quiz-lesson', lesson ? course.name + ' · ' + lesson.title : a.file));
    row.appendChild(el('span', 'quiz-when', UI.relTime(a.at)));
    quizWrap.appendChild(row);
  });

  /* recent notes --------------------------------------------------------- */
  var notesWrap = document.getElementById('note-briefs');
  var notes = (await Store.allNotes()).slice(0, 3);
  if (!notes.length) {
    notesWrap.appendChild(el('div', 'empty', 'Notes you write inside a lesson show up here.'));
  }
  notes.forEach(function (n) {
    var box = el('div', 'note-brief');
    box.appendChild(el('div', 'note-brief-text', n.text));
    box.appendChild(el('div', 'note-brief-src', [n.ref, n.kind.toLowerCase(), UI.relTime(n.when)].filter(Boolean).join(' · ')));
    notesWrap.appendChild(box);
  });
  document.getElementById('open-notebook').href = ctx.url('notebook.html');
};
