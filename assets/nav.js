/* Shared left sidebar: course navigation + mark-completed progress.
 * Course-agnostic. Reads window.COURSE from the course's own course.js,
 * so include that first. On a lesson or reference page:
 *   <script src="../course.js" defer></script>
 *   <script src="../../assets/nav.js" defer></script>
 * On a course index page the paths are 'course.js' and '../assets/nav.js'.
 * To add a lesson, edit that course's course.js only.
 * Progress lives in localStorage under '<course.key>-study-progress'.
 */
(function () {
  var COURSE = window.COURSE;
  if (!COURSE) return;

  var LESSONS = COURSE.lessons;
  var REFS = COURSE.refs;

  var KEY = COURSE.key + '-study-progress';
  var HIDE_KEY = COURSE.key + '-study-hide-done';
  var here = location.pathname.split('/').pop();
  var inLessons = location.pathname.indexOf('/lessons/') !== -1;
  var inReference = location.pathname.indexOf('/reference/') !== -1;
  var inSub = inLessons || inReference;
  var lessonPrefix = inLessons ? '' : (inReference ? '../lessons/' : 'lessons/');
  var refPrefix = inReference ? '' : (inLessons ? '../reference/' : 'reference/');
  var homePrefix = inSub ? '../../' : '../';
  var coursePrefix = inSub ? '../' : '';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode etc. */ }
  }
  var progress = load();
  var hideDone = false;
  try { hideDone = localStorage.getItem(HIDE_KEY) === '1'; } catch (e) { /* private mode etc. */ }

  function doneCount() {
    return LESSONS.filter(function (l) { return progress[l.f]; }).length;
  }

  function toggle(file) {
    if (progress[file]) delete progress[file]; else progress[file] = true;
    save(progress);
    refresh();
  }

  var aside, pageBtn;

  function refresh() {
    var n = doneCount();
    aside.querySelector('.nav-count').textContent = n + ' / ' + LESSONS.length + ' complete';
    aside.querySelector('.nav-bar-fill').style.width = (n / LESSONS.length * 100) + '%';
    LESSONS.forEach(function (l) {
      var li = aside.querySelector('[data-file="' + l.f + '"]');
      li.classList.toggle('done', !!progress[l.f]);
      li.classList.toggle('hidden-done', hideDone && !!progress[l.f] && l.f !== here);
      li.querySelector('.done-toggle').setAttribute('aria-label',
        (progress[l.f] ? 'Mark lesson not completed: ' : 'Mark lesson completed: ') + l.t);
    });
    var hideBox = aside.querySelector('.nav-hide-done input');
    if (hideBox) hideBox.checked = hideDone;
    if (pageBtn) {
      pageBtn.textContent = progress[here] ? 'Completed ✓ (click to undo)' : 'Mark this lesson complete';
      pageBtn.classList.toggle('is-done', !!progress[here]);
    }
  }

  function buildItem(l) {
    var li = document.createElement('li');
    li.setAttribute('data-file', l.f);
    if (l.f === here) li.classList.add('current');

    var btn = document.createElement('button');
    btn.className = 'done-toggle';
    btn.type = 'button';
    btn.addEventListener('click', function () { toggle(l.f); });
    li.appendChild(btn);

    var a = document.createElement('a');
    a.href = lessonPrefix + l.f;
    a.textContent = l.t;
    li.appendChild(a);
    return li;
  }

  function build() {
    aside = document.createElement('aside');
    aside.className = 'sidenav';
    aside.innerHTML =
      '<div class="nav-head">' +
      '  <a class="nav-home" href="' + homePrefix + 'index.html">← All Studies</a>' +
      '  <div class="nav-title"></div>' +
      '  <div class="nav-count"></div>' +
      '  <div class="nav-bar"><div class="nav-bar-fill"></div></div>' +
      '  <label class="nav-hide-done"><input type="checkbox"> Hide completed</label>' +
      '  <a class="nav-note" href="' + homePrefix + 'notebook.html">My notebook →</a>' +
      '</div>' +
      '<div class="nav-section">Lessons</div>' +
      '<ul class="nav-lessons"></ul>' +
      '<div class="nav-section">Reference</div>' +
      '<ul class="nav-refs"></ul>';

    var titleEl = aside.querySelector('.nav-title');
    var titleLink = document.createElement('a');
    titleLink.href = coursePrefix + 'index.html';
    titleLink.textContent = COURSE.title;
    titleEl.appendChild(titleLink);

    var ul = aside.querySelector('.nav-lessons');
    LESSONS.forEach(function (l) { ul.appendChild(buildItem(l)); });

    aside.querySelector('.nav-hide-done input').addEventListener('change', function () {
      hideDone = this.checked;
      try { localStorage.setItem(HIDE_KEY, hideDone ? '1' : '0'); } catch (e) { /* private mode etc. */ }
      refresh();
    });

    var rul = aside.querySelector('.nav-refs');
    REFS.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'ref';
      if (r.f === here) li.classList.add('current');
      var a = document.createElement('a');
      a.href = refPrefix + r.f;
      a.textContent = r.t;
      li.appendChild(a);
      rul.appendChild(li);
    });

    document.body.insertBefore(aside, document.body.firstChild);
    document.body.classList.add('has-sidenav');

    var burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Toggle course navigation');
    burger.textContent = '☰';
    burger.addEventListener('click', function () { aside.classList.toggle('open'); });
    document.body.appendChild(burger);

    // On lesson pages, add a completion button at the end of the content.
    var isLessonPage = LESSONS.some(function (l) { return l.f === here; });
    var main = document.querySelector('main');
    if (isLessonPage && main) {
      pageBtn = document.createElement('button');
      pageBtn.className = 'mark-complete';
      pageBtn.type = 'button';
      pageBtn.addEventListener('click', function () { toggle(here); });
      var nav = main.querySelector('.lesson-nav');
      main.insertBefore(pageBtn, nav || null);
    }

    var cur = aside.querySelector('.current');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
