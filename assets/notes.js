/* Per-lesson notebook: observation / interpretation / application.
 * Course-agnostic. Reads window.COURSE, so include course.js first:
 *   <script src="../course.js" defer></script>
 *   <script src="../../assets/nav.js" defer></script>
 *   <script src="../../assets/notes.js" defer></script>
 * Only builds on lesson pages. Notes live in localStorage under
 * '<course.key>-study-notes' as { '<lesson-file>': { o, i, a, u } }:
 *   o / i  observation + interpretation lines, [{ r: 'v.14', t: 'text', h: 'clipped' }]
 *          h is present only on clipped lines: the passage text as selected, kept
 *          so the notebook can show it as a highlight even after the line is edited
 *   a      application, { god, me, do }
 *   u      last-saved epoch ms
 * Nothing is synced anywhere; it is the same browser-local store as progress.
 */
(function () {
  var COURSE = window.COURSE;
  if (!COURSE) return;

  var here = location.pathname.split('/').pop();
  var index = -1;
  COURSE.lessons.forEach(function (l, i) { if (l.f === here) index = i; });
  if (index === -1) return;

  var main = document.querySelector('main');
  if (!main) return;

  var KEY = COURSE.key + '-study-notes';
  var STAGES = [
    { k: 'o', label: 'Observation', gloss: 'what it says', cls: 'obs', add: 'add an observation' },
    { k: 'i', label: 'Interpretation', gloss: 'what it means', cls: 'int', add: 'add an interpretation' }
  ];
  var APPLY = [
    { k: 'god', label: 'God', hint: 'what this shows about him\u2026' },
    { k: 'me', label: 'Me', hint: 'one line about where this lands\u2026' },
    { k: 'do', label: 'Do', hint: 'one thing this week\u2026' }
  ];

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function lesson() {
    var all = loadAll();
    var n = all[here] || {};
    return { o: n.o || [], i: n.i || [], a: n.a || {}, u: n.u || 0 };
  }

  var panel, saveBtn, statusEl, countEl;
  var saveTimer = null;
  var lastSaved = lesson().u;

  /* Read the whole panel back out of the DOM. Cheaper than tracking indexes,
     and it can never drift from what the user sees. */
  function collect() {
    var data = { o: [], i: [], a: {}, u: Date.now() };
    STAGES.forEach(function (s) {
      panel.querySelectorAll('.nb-row[data-stage="' + s.k + '"]').forEach(function (row) {
        var t = row.querySelector('.nb-text').value.trim();
        if (!t) return;
        var line = { r: row.querySelector('.nb-ref').value.trim(), t: t };
        if (row.dataset.h) line.h = row.dataset.h;
        data[s.k].push(line);
      });
    });
    APPLY.forEach(function (a) {
      var v = panel.querySelector('.nb-apply[data-key="' + a.k + '"]').value.trim();
      if (v) data.a[a.k] = v;
    });
    return data;
  }

  function noteCount(d) {
    return d.o.length + d.i.length + Object.keys(d.a).length;
  }

  function save() {
    var data = collect();
    var all = loadAll();
    all[here] = data;
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* private mode etc. */ }
    lastSaved = data.u;
    stamp();
  }

  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 600);
  }

  function stamp() {
    var d = collect();
    var n = noteCount(d);
    countEl.textContent = n === 0 ? 'nothing written yet'
      : n + (n === 1 ? ' note' : ' notes') + ' saved';
    if (!lastSaved) { statusEl.textContent = ''; return; }
    var mins = Math.floor((Date.now() - lastSaved) / 60000);
    statusEl.textContent = mins < 1 ? 'saved just now'
      : mins < 60 ? 'saved ' + mins + 'm ago'
      : 'saved ' + new Date(lastSaved).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function grow(ta) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }

  function rowsOf(stage) {
    return Array.prototype.slice.call(
      panel.querySelectorAll('.nb-row[data-stage="' + stage + '"]'));
  }

  function isBlank(row) {
    return !row.querySelector('.nb-text').value.trim() && !row.querySelector('.nb-ref').value.trim();
  }

  function makeRow(stage, entry) {
    var s = STAGES.filter(function (x) { return x.k === stage; })[0];
    var row = document.createElement('div');
    row.className = 'nb-row';
    row.setAttribute('data-stage', stage);
    if (entry && entry.h) row.dataset.h = entry.h;

    var ref = document.createElement('input');
    ref.className = 'nb-ref';
    ref.type = 'text';
    ref.placeholder = 'v.';
    ref.value = entry ? entry.r : '';
    ref.setAttribute('aria-label', s.label + ' verse reference');

    var text = document.createElement('textarea');
    text.className = 'nb-text';
    text.rows = 1;
    text.placeholder = s.add + ' \u00b7 \u21b5 for the next line';
    text.value = entry ? entry.t : '';
    text.setAttribute('aria-label', s.label + ' note');

    row.appendChild(ref);
    row.appendChild(text);

    [ref, text].forEach(function (el) {
      el.addEventListener('input', function () {
        if (el === text) grow(text);
        ensureBlank(stage);
        queueSave();
      });
    });

    text.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        nextRow(stage, row);
      }
    });

    text.addEventListener('blur', function () {
      // Drop rows the user emptied out, but always keep one open line.
      var rows = rowsOf(stage);
      if (isBlank(row) && rows.length > 1 && row !== rows[rows.length - 1]) {
        row.remove();
        queueSave();
      }
    });

    return row;
  }

  function ensureBlank(stage) {
    var rows = rowsOf(stage);
    if (!rows.length) return;
    var last = rows[rows.length - 1];
    if (!isBlank(last)) last.parentNode.appendChild(makeRow(stage));
  }

  function nextRow(stage, row) {
    var rows = rowsOf(stage);
    var at = rows.indexOf(row);
    ensureBlank(stage);
    rows = rowsOf(stage);
    var next = rows[at + 1] || rows[rows.length - 1];
    next.querySelector('.nb-text').focus();
  }

  function markComplete() {
    var btn = document.querySelector('button.mark-complete');
    if (btn && !btn.classList.contains('is-done')) btn.click();
  }

  function build() {
    var d = lesson();
    panel = document.createElement('aside');
    panel.className = 'notebook';
    panel.setAttribute('aria-label', 'My notes for this lesson');

    var head = document.createElement('div');
    head.className = 'nb-head';
    head.innerHTML =
      '<span class="nb-title">My notes \u00b7 Lesson ' + (index + 1) + '</span>' +
      '<span class="nb-status"></span>';
    panel.appendChild(head);
    statusEl = head.querySelector('.nb-status');

    STAGES.forEach(function (s) {
      var block = document.createElement('div');
      block.className = 'nb-block nb-' + s.cls;
      block.innerHTML =
        '<div class="nb-label"><span>' + s.label + '</span>' +
        '<span class="nb-gloss">' + s.gloss + '</span></div>' +
        '<div class="nb-rows"></div>';
      var rows = block.querySelector('.nb-rows');
      d[s.k].forEach(function (entry) { rows.appendChild(makeRow(s.k, entry)); });
      rows.appendChild(makeRow(s.k));
      panel.appendChild(block);
    });

    var app = document.createElement('div');
    app.className = 'nb-block nb-app';
    app.innerHTML =
      '<div class="nb-label"><span>Application</span>' +
      '<span class="nb-gloss">what I\u2019ll do</span></div>' +
      '<div class="nb-rows"></div>';
    var appRows = app.querySelector('.nb-rows');
    APPLY.forEach(function (a) {
      var row = document.createElement('div');
      row.className = 'nb-row';
      var label = document.createElement('span');
      label.className = 'nb-key';
      label.textContent = a.label;
      var ta = document.createElement('textarea');
      ta.className = 'nb-apply nb-text';
      ta.rows = 1;
      ta.placeholder = a.hint;
      ta.value = d.a[a.k] || '';
      ta.setAttribute('data-key', a.k);
      ta.setAttribute('aria-label', 'Application \u2014 ' + a.label);
      ta.addEventListener('input', function () { grow(ta); queueSave(); });
      row.appendChild(label);
      row.appendChild(ta);
      appRows.appendChild(row);
    });
    panel.appendChild(app);

    var foot = document.createElement('div');
    foot.className = 'nb-foot';
    saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'nb-save';
    saveBtn.textContent = 'Save & mark complete';
    saveBtn.addEventListener('click', function () { save(); markComplete(); });
    countEl = document.createElement('span');
    countEl.className = 'nb-count';
    foot.appendChild(saveBtn);
    foot.appendChild(countEl);
    panel.appendChild(foot);

    // Fields sit above the answers, not below: write before you read the notes.
    var anchor = null;
    main.querySelectorAll('h2').forEach(function (h) {
      if (!anchor && /^observation/i.test(h.textContent)) anchor = h;
    });
    if (!anchor) anchor = main.querySelector('h2');
    main.insertBefore(panel, anchor);
    document.body.classList.add('has-notebook');

    panel.querySelectorAll('.nb-text').forEach(grow);
    stamp();
    setInterval(stamp, 30000);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { save(); markComplete(); }
    });

    clipping();
  }

  /* Select any line in the lesson to clip it into the notebook, reference attached. */
  function clipping() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nb-clip';
    btn.textContent = 'Clip to notes';
    btn.hidden = true;
    document.body.appendChild(btn);

    var pending = null;

    function refFor(node) {
      var el = node.nodeType === 1 ? node : node.parentNode;
      var quote = el.closest && el.closest('blockquote.scripture');
      if (quote) {
        var cite = quote.querySelector('.ref');
        if (cite) {
          var m = cite.textContent.match(/(\d+:\d+(?:[-\u2013]\d+)?)/);
          if (m) return m[1];
        }
      }
      var host = el.closest && el.closest('li, p, div');
      var vm = host && host.textContent.match(/\(v{1,2}\.\s*([\d:\u2013-]+)\)/);
      return vm ? 'v.' + vm[1] : '';
    }

    document.addEventListener('mouseup', function () {
      setTimeout(function () {
        var sel = window.getSelection();
        var text = sel ? String(sel).trim() : '';
        if (!text || text.length < 3 || !sel.rangeCount) { btn.hidden = true; return; }
        var range = sel.getRangeAt(0);
        var host = range.commonAncestorContainer;
        var el = host.nodeType === 1 ? host : host.parentNode;
        if (!main.contains(el) || panel.contains(el)) { btn.hidden = true; return; }
        pending = { t: text.replace(/\s+/g, ' '), r: refFor(host) };
        var box = range.getBoundingClientRect();
        btn.style.top = (box.bottom + window.scrollY + 6) + 'px';
        btn.style.left = (box.left + window.scrollX) + 'px';
        btn.hidden = false;
      }, 0);
    });

    document.addEventListener('mousedown', function (e) {
      if (e.target !== btn) btn.hidden = true;
    });

    btn.addEventListener('click', function () {
      if (!pending) return;
      var rows = rowsOf('o');
      var row = rows[rows.length - 1];
      row.dataset.h = pending.t;
      row.querySelector('.nb-ref').value = pending.r;
      row.querySelector('.nb-text').value = pending.t;
      grow(row.querySelector('.nb-text'));
      ensureBlank('o');
      save();
      btn.hidden = true;
      panel.scrollIntoView({ block: 'nearest' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
