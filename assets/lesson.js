/* Lesson page behaviour on top of the existing lesson HTML.
 *
 * The 214 lesson files keep their own prose, scripture blocks and quizzes. This
 * script adds the redesign chrome around them: breadcrumb and kicker, the notes
 * panel, the completion toggle, prev/next footer, resume tracking and quiz
 * recording. Everything it writes goes to Supabase through assets/store.js.
 * Include after store.js, ui.js, data/courses.js, course.js, notes.js, shell.js. */
window.Page = async function (ctx) {
  var el = UI.el;
  var course = window.COURSE;
  if (!course) return;
  var key = course.key;
  var c = window.COURSES[key];
  var file = location.pathname.split('/').pop();
  var lesson = c && c.lessons.find(function (l) { return l.f === file; });
  var main = document.querySelector('main');
  if (!c || !lesson || !main) return;

  document.body.classList.add('lesson');

  /* header --------------------------------------------------------------- */
  var h1 = main.querySelector('h1');
  var crumb = el('a', 'crumb', '← ' + c.title);
  crumb.href = UI.courseHref(ctx.root, key);
  var kicker = el('div', 'lesson-kicker',
    'Lesson ' + lesson.n + ' of ' + c.lessons.length + ' · ' + UI.unitShort(lesson.unit) + ' · ~' + lesson.mins + ' min');
  main.insertBefore(crumb, main.firstChild);
  main.insertBefore(kicker, h1);

  /* notes panel ---------------------------------------------------------- */
  if (window.LessonNotes) await LessonNotes.mount(course, file);

  /* footer --------------------------------------------------------------- */
  var idx = lesson.n - 1;
  var prev = c.lessons[idx - 1];
  var nextLesson = c.lessons[idx + 1];
  var foot = el('div', 'lesson-foot');

  if (prev) {
    var pa = el('a', 'prev', '← ' + (prev.ref || prev.title));
    pa.href = UI.lessonHref(ctx.root, key, prev.f);
    foot.appendChild(pa);
  } else {
    foot.appendChild(el('span'));
  }

  var toggle = el('button', 'complete-toggle');
  toggle.type = 'button';
  function paintToggle() {
    var done = Store.isComplete(key, file);
    toggle.textContent = done ? '✓ Completed' : 'Mark lesson complete';
    toggle.classList.toggle('done', done);
  }
  toggle.addEventListener('click', async function () {
    var want = !Store.isComplete(key, file);
    toggle.disabled = true;
    var res = await Store.setComplete(key, file, want);
    toggle.disabled = false;
    paintToggle();
    if (res && res.error) toggle.textContent = 'Not saved — ' + res.error;
  });
  paintToggle();
  foot.appendChild(toggle);

  if (nextLesson) {
    var na = el('a', 'next', (nextLesson.ref || nextLesson.title) + ' →');
    na.href = UI.lessonHref(ctx.root, key, nextLesson.f);
    foot.appendChild(na);
  } else {
    foot.appendChild(el('span'));
  }
  main.appendChild(foot);

  /* resume position ------------------------------------------------------ */
  var stages = ['Observation', 'Interpretation', 'Application'];
  function currentSection() {
    var seen = '';
    main.querySelectorAll('h2').forEach(function (h) {
      if (h.getBoundingClientRect().top < 140) {
        var text = h.textContent.trim();
        var hit = stages.find(function (s) { return text.indexOf(s) === 0; });
        if (hit) seen = hit;
      }
    });
    return seen;
  }

  Store.touchLesson(key, file, currentSection());

  // One write per pause in scrolling, not one per scroll event.
  var pending = null;
  var lastSection = currentSection();
  window.addEventListener('scroll', function () {
    if (pending) return;
    pending = setTimeout(function () {
      pending = null;
      var section = currentSection();
      if (section === lastSection) return;
      lastSection = section;
      Store.touchLesson(key, file, section);
    }, 1200);
  }, { passive: true });

  /* quiz attempts -------------------------------------------------------- */
  document.addEventListener('quiz:complete', async function (e) {
    if (e.detail.id !== 'quiz') return;
    var host = document.getElementById('quiz');
    var strip = host.parentNode.querySelector('.quiz-result') || el('div', 'quiz-result');
    strip.textContent = 'Score: ' + e.detail.score + '/' + e.detail.total + ' — saving…';
    if (!strip.parentNode) host.parentNode.insertBefore(strip, host.nextSibling);

    var res = await Store.recordQuiz(key, file, e.detail.score, e.detail.total);
    strip.textContent = res && res.error
      ? 'Score: ' + e.detail.score + '/' + e.detail.total + ' — not saved (' + res.error + ')'
      : 'Score: ' + e.detail.score + '/' + e.detail.total + ' — saved to your grade history.' +
        (e.detail.score === e.detail.total ? ' Well done.' : ' Review the highlighted answers and retake anytime.');
  });
};
