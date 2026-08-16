/* Course page: epigraph, progress, and lessons grouped by unit.
 * The page supplies <body data-course="john">. Units after the first
 * incomplete one are locked, as specified in the redesign handoff:
 * their rows render but do not link. */
window.Page = async function (ctx) {
  var el = UI.el;
  var key = document.body.getAttribute('data-course');
  var c = window.COURSES[key];
  if (!c) return;

  var stats = Store.courseStats(key);
  var lessonsByFile = {};
  c.lessons.forEach(function (l) { lessonsByFile[l.f] = l; });

  document.getElementById('all-courses').href = ctx.url('courses.html');
  document.getElementById('course-title').textContent = c.title;
  document.getElementById('course-epigraph').textContent = c.epigraph;

  var next = c.lessons.find(function (l) { return !Store.isComplete(key, l.f); });
  var resumeBtn = document.getElementById('course-resume');
  if (next) {
    resumeBtn.textContent = 'Resume · Lesson ' + next.n;
    resumeBtn.addEventListener('click', function () {
      location.href = UI.lessonHref(ctx.root, key, next.f);
    });
  } else {
    resumeBtn.textContent = 'Review · Lesson 1';
    resumeBtn.addEventListener('click', function () {
      location.href = UI.lessonHref(ctx.root, key, c.lessons[0].f);
    });
  }

  document.getElementById('course-bar').appendChild(UI.bar(stats.pct));
  var avg = Store.quizAverage(key);
  document.getElementById('course-stats').textContent =
    stats.done + ' of ' + stats.total + ' lessons · ' + stats.pct + '%' + (avg == null ? '' : ' · avg quiz ' + avg + '%');

  /* units ---------------------------------------------------------------- */
  var wrap = document.getElementById('units');
  var currentUnitIndex = -1;
  c.units.forEach(function (u, i) {
    var incomplete = u.lessons.some(function (f) { return !Store.isComplete(key, f); });
    if (incomplete && currentUnitIndex === -1) currentUnitIndex = i;
  });
  if (currentUnitIndex === -1) currentUnitIndex = c.units.length - 1;

  c.units.forEach(function (u, i) {
    var locked = i > currentUnitIndex;
    var section = el('section');
    var doneAll = u.lessons.every(function (f) { return Store.isComplete(key, f); });
    var suffix = locked
      ? ' (locked until ' + (c.units[currentUnitIndex].title.split(':')[0]) + ')'
      : (doneAll ? ' · complete' : (i === currentUnitIndex && stats.done ? ' · in progress' : ''));
    section.appendChild(el('h2', 'unit-title', u.title + suffix));

    var card = el('div', 'unit-card');
    u.lessons.forEach(function (f) {
      var l = lessonsByFile[f];
      var done = Store.isComplete(key, f);
      var isNext = next && next.f === f;
      var row = el(locked ? 'div' : 'a', 'lesson-row' + (done ? ' done' : '') + (isNext && !done ? ' current' : ''));
      if (!locked) row.href = UI.lessonHref(ctx.root, key, f);
      row.appendChild(el('span', 'lesson-dot', done ? '✓' : ''));
      row.appendChild(el('span', 'lesson-num', String(l.n)));
      var name = el('span', 'lesson-name');
      name.appendChild(el('b', null, l.title));
      if (l.ref) name.appendChild(el('span', null, ' · ' + l.ref));
      row.appendChild(name);
      row.appendChild(el('span', 'lesson-right',
        done ? 'Completed' : (isNext ? 'In progress · resume' : '~' + l.mins + ' min')));
      card.appendChild(row);
    });
    section.appendChild(card);
    wrap.appendChild(section);
  });

  /* reference pages ------------------------------------------------------ */
  var refs = document.getElementById('course-refs');
  if (refs && c.refs.length) {
    c.refs.forEach(function (r) {
      var a = el('a', 'chip', r.t);
      a.href = ctx.root + key + '/reference/' + r.f;
      refs.appendChild(a);
    });
  }
};
