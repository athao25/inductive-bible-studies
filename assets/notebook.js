/* My Notebook: every note you have written, compiled per course.
 * Powers notebook.html, which loads each course.js into window.COURSES first.
 * Reads the same localStorage written by assets/notes.js:
 *   '<course.key>-study-notes' -> { '<lesson-file>': { o, i, a, u } }
 * Three views: by lesson (a journal), by stage (columns), highlights (clipped
 * passages). Filter, search, print, export. Read-only: editing happens in the
 * lesson, never here.
 */
(function () {
  var COURSES = window.COURSES || [];
  var root = document.getElementById('notebook');
  if (!root || !COURSES.length) return;

  var STAGES = [
    { k: 'o', name: 'Observation', cls: 'obs' },
    { k: 'i', name: 'Interpretation', cls: 'int' },
    { k: 'a', name: 'Application', cls: 'app' }
  ];
  var APPLY_LABEL = { god: 'God', me: 'Me', do: 'Do' };

  var state = {
    course: COURSES[0].key,
    view: 'lesson',
    stages: { o: true, i: true, a: true },
    q: ''
  };

  function courseByKey(key) {
    return COURSES.filter(function (c) { return c.key === key; })[0];
  }

  function rawNotes(course) {
    try { return JSON.parse(localStorage.getItem(course.key + '-study-notes')) || {}; }
    catch (e) { return {}; }
  }

  /* One flat, sorted model per course; every view is a projection of this. */
  function read(course) {
    var stored = rawNotes(course);
    var lessons = [];
    course.lessons.forEach(function (l, i) {
      var n = stored[l.f];
      if (!n) return;
      var groups = [];
      ['o', 'i'].forEach(function (k) {
        var lines = (n[k] || []).filter(function (x) { return x && x.t; });
        if (lines.length) groups.push({ stage: k, lines: lines });
      });
      var app = Object.keys(APPLY_LABEL)
        .filter(function (k) { return n.a && n.a[k]; })
        .map(function (k) { return { r: APPLY_LABEL[k], t: n.a[k] }; });
      if (app.length) groups.push({ stage: 'a', lines: app });
      if (!groups.length) return;
      lessons.push({
        file: l.f, title: l.t, n: i + 1, u: n.u || 0, groups: groups
      });
    });
    return lessons;
  }

  function matches(line, lesson) {
    if (!state.q) return true;
    var q = state.q.toLowerCase();
    return (line.t || '').toLowerCase().indexOf(q) !== -1 ||
      (line.r || '').toLowerCase().indexOf(q) !== -1 ||
      lesson.title.toLowerCase().indexOf(q) !== -1;
  }

  /* Apply the stage filter and the search box. */
  function filtered(lessons) {
    return lessons.map(function (l) {
      var groups = l.groups
        .filter(function (g) { return state.stages[g.stage]; })
        .map(function (g) {
          return { stage: g.stage, lines: g.lines.filter(function (x) { return matches(x, l); }) };
        })
        .filter(function (g) { return g.lines.length; });
      return { file: l.file, title: l.title, n: l.n, u: l.u, groups: groups };
    }).filter(function (l) { return l.groups.length; });
  }

  function countLines(lessons) {
    var n = 0;
    lessons.forEach(function (l) {
      l.groups.forEach(function (g) { n += g.lines.length; });
    });
    return n;
  }

  function stageCount(lessons, stage) {
    var n = 0;
    lessons.forEach(function (l) {
      l.groups.forEach(function (g) { if (g.stage === stage) n += g.lines.length; });
    });
    return n;
  }

  function highlights(lessons) {
    var out = [];
    lessons.forEach(function (l) {
      l.groups.forEach(function (g) {
        g.lines.forEach(function (line) {
          if (line.h) out.push({ ref: line.r, text: line.h, note: line.t === line.h ? '' : line.t, lesson: l });
        });
      });
    });
    return out;
  }

  function fmtDate(ms) {
    if (!ms) return '';
    return new Date(ms).toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---- exports ---------------------------------------------------------- */

  function toMarkdown(course, lessons) {
    var out = ['# ' + course.title + ' · my notebook', ''];
    lessons.forEach(function (l) {
      out.push('## Lesson ' + l.n + ' · ' + l.title);
      if (l.u) out.push('_' + new Date(l.u).toLocaleDateString() + '_');
      out.push('');
      l.groups.forEach(function (g) {
        var s = STAGES.filter(function (x) { return x.k === g.stage; })[0];
        out.push('### ' + s.name);
        g.lines.forEach(function (line) {
          out.push('- ' + (line.r ? '**' + line.r + '** ' : '') + line.t);
        });
        out.push('');
      });
    });
    return out.join('\n');
  }

  function download(name, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function stamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function backup() {
    var all = {};
    COURSES.forEach(function (c) { all[c.key] = rawNotes(c); });
    download('inductive-notes-' + stamp() + '.json',
      JSON.stringify({ exported: new Date().toISOString(), notes: all }, null, 2),
      'application/json');
  }

  /* ---- views ------------------------------------------------------------ */

  function viewLesson(lessons) {
    var wrap = el('div', 'nbk-journal');
    lessons.forEach(function (l) {
      var card = el('div', 'nbk-entry');
      var head = el('div', 'nbk-entry-head');
      head.appendChild(el('span', 'nbk-tag', 'Lesson ' + l.n));
      var link = el('a', 'nbk-entry-title', l.title);
      link.href = state.course + '/lessons/' + l.file;
      head.appendChild(link);
      head.appendChild(el('span', 'nbk-date', fmtDate(l.u)));
      card.appendChild(head);

      var body = el('div', 'nbk-entry-body');
      l.groups.forEach(function (g) {
        var s = STAGES.filter(function (x) { return x.k === g.stage; })[0];
        var row = el('div', 'nbk-group');
        row.appendChild(el('div', 'nbk-stage nbk-' + s.cls, s.name));
        var lines = el('div', 'nbk-lines');
        g.lines.forEach(function (line) {
          var item = el('div', 'nbk-line nbk-' + s.cls);
          item.appendChild(el('span', 'nbk-dot', '·'));
          item.appendChild(el('span', 'nbk-ref', line.r || ''));
          item.appendChild(el('span', 'nbk-text', line.t));
          lines.appendChild(item);
        });
        row.appendChild(lines);
        body.appendChild(row);
      });
      card.appendChild(body);
      wrap.appendChild(card);
    });
    return wrap;
  }

  function viewStage(lessons) {
    var wrap = el('div', 'nbk-columns');
    STAGES.forEach(function (s) {
      if (!state.stages[s.k]) return;
      var items = [];
      lessons.forEach(function (l) {
        l.groups.forEach(function (g) {
          if (g.stage !== s.k) return;
          g.lines.forEach(function (line) { items.push({ line: line, lesson: l }); });
        });
      });
      var col = el('div', 'nbk-col');
      col.appendChild(el('div', 'nbk-col-head nbk-' + s.cls, s.name + ' · ' + items.length));
      items.forEach(function (it) {
        var card = el('div', 'nbk-chip nbk-' + s.cls);
        var meta = it.line.r ? it.line.r + ' · lesson ' + it.lesson.n : 'lesson ' + it.lesson.n;
        card.appendChild(el('div', 'nbk-chip-ref', meta));
        card.appendChild(el('div', 'nbk-chip-body', it.line.t));
        col.appendChild(card);
      });
      if (!items.length) col.appendChild(el('div', 'nbk-empty-col', 'Nothing here yet.'));
      wrap.appendChild(col);
    });
    return wrap;
  }

  function viewMarks(lessons) {
    var marks = highlights(lessons);
    if (!marks.length) {
      return el('div', 'nbk-empty',
        'No highlights yet. In a lesson, select any line and choose “Clip to notes” — it lands here with the reference attached.');
    }
    var wrap = el('div', 'nbk-marks');
    marks.forEach(function (m) {
      var row = el('div', 'nbk-mark');
      row.appendChild(el('div', 'nbk-mark-ref', m.ref || 'lesson ' + m.lesson.n));
      var body = el('div');
      var quote = el('div', 'nbk-mark-text');
      quote.appendChild(el('mark', null, m.text));
      body.appendChild(quote);
      if (m.note) body.appendChild(el('div', 'nbk-mark-note', m.note));
      row.appendChild(body);
      wrap.appendChild(row);
    });
    return wrap;
  }

  /* ---- chrome ----------------------------------------------------------- */

  function railEl() {
    var rail = el('aside', 'nbk-rail');

    rail.appendChild(el('div', 'nbk-rail-head', 'Notebooks'));
    var list = el('div', 'nbk-books');
    COURSES.forEach(function (c) {
      var all = read(c);
      var btn = el('button', 'nbk-book' + (c.key === state.course ? ' current' : ''));
      btn.type = 'button';
      var img = el('img');
      img.src = 'assets/icons/' + c.key + '/icon-192.png';
      img.alt = '';
      btn.appendChild(img);
      btn.appendChild(el('span', 'nbk-book-name', c.title.replace(/ Study$/, '')));
      btn.appendChild(el('span', 'nbk-book-count', String(countLines(all))));
      btn.addEventListener('click', function () { state.course = c.key; render(); });
      list.appendChild(btn);
    });
    rail.appendChild(list);

    var course = courseByKey(state.course);
    var all = read(course);

    var filter = el('div', 'nbk-rail-block');
    filter.appendChild(el('div', 'nbk-rail-head', 'Filter'));
    STAGES.forEach(function (s) {
      var btn = el('button', 'nbk-filter nbk-' + s.cls + (state.stages[s.k] ? '' : ' off'));
      btn.type = 'button';
      btn.setAttribute('aria-pressed', state.stages[s.k] ? 'true' : 'false');
      btn.appendChild(el('span', 'nbk-swatch'));
      btn.appendChild(el('span', null, s.name + ' · ' + stageCount(all, s.k)));
      btn.addEventListener('click', function () {
        state.stages[s.k] = !state.stages[s.k];
        render();
      });
      filter.appendChild(btn);
    });
    var marks = el('button', 'nbk-filter nbk-mark-filter' + (state.view === 'marks' ? '' : ' off'));
    marks.type = 'button';
    marks.appendChild(el('span', 'nbk-swatch'));
    marks.appendChild(el('span', null, 'Highlights · ' + highlights(all).length));
    marks.addEventListener('click', function () {
      state.view = state.view === 'marks' ? 'lesson' : 'marks';
      render();
    });
    filter.appendChild(marks);
    rail.appendChild(filter);

    var actions = el('div', 'nbk-rail-block nbk-actions');
    [
      ['Print notebook', function () { window.print(); }],
      ['Export as Markdown', function () {
        download(course.key + '-notebook-' + stamp() + '.md',
          toMarkdown(course, all), 'text/markdown');
      }],
      ['Download backup (.json)', backup]
    ].forEach(function (pair) {
      var b = el('button', 'nbk-action', pair[0]);
      b.type = 'button';
      b.addEventListener('click', pair[1]);
      actions.appendChild(b);
    });
    rail.appendChild(actions);

    return rail;
  }

  function headEl(all, shown) {
    var course = courseByKey(state.course);
    var head = el('div', 'nbk-head');

    var left = el('div');
    left.appendChild(el('h1', 'nbk-title', course.title.replace(/ Study$/, '') + ' · my notebook'));
    var times = all.map(function (l) { return l.u; }).filter(Boolean).sort();
    var total = countLines(all);
    var meta = total === 0 ? 'nothing written yet'
      : total + (total === 1 ? ' note' : ' notes') + ' across ' + all.length +
        (all.length === 1 ? ' lesson' : ' lessons') +
        (times.length ? ' · first written ' + fmtDate(times[0]) +
          ' · last ' + fmtDate(times[times.length - 1]) : '');
    var shownTotal = countLines(shown);
    if (shownTotal !== total) meta += ' · showing ' + shownTotal;
    left.appendChild(el('p', 'nbk-meta', meta));
    head.appendChild(left);

    var tabs = el('div', 'nbk-tabs');
    [['lesson', 'By lesson'], ['stage', 'By stage'], ['marks', 'Highlights']].forEach(function (t) {
      var b = el('button', 'nbk-tab' + (state.view === t[0] ? ' current' : ''), t[1]);
      b.type = 'button';
      b.addEventListener('click', function () { state.view = t[0]; render(); });
      tabs.appendChild(b);
    });
    head.appendChild(tabs);
    return head;
  }

  function topEl() {
    var bar = el('div', 'nbk-top');
    var home = el('a', 'nbk-home', '← All Studies');
    home.href = 'index.html';
    bar.appendChild(home);
    bar.appendChild(el('span', 'nbk-brand', 'Notebook'));

    var search = el('input', 'nbk-search');
    search.type = 'search';
    search.placeholder = 'Search my notes';
    search.value = state.q;
    search.setAttribute('aria-label', 'Search my notes');
    search.addEventListener('input', function () {
      state.q = search.value;
      render(true);
    });
    bar.appendChild(search);
    return bar;
  }

  /* ---- render ----------------------------------------------------------- */

  function render(keepFocus) {
    var course = courseByKey(state.course);
    var all = read(course);
    var shown = filtered(all);

    root.textContent = '';
    root.appendChild(topEl());

    var body = el('div', 'nbk-body');
    body.appendChild(railEl());

    var pane = el('div', 'nbk-pane');
    pane.appendChild(headEl(all, shown));

    if (!all.length) {
      var empty = el('div', 'nbk-empty');
      empty.appendChild(document.createTextNode(
        'Nothing written yet. Open a lesson and use the notebook panel — every line you write compiles here. '));
      var go = el('a', null, 'Start with ' + course.lessons[0].t + ' →');
      go.href = course.key + '/lessons/' + course.lessons[0].f;
      empty.appendChild(go);
      pane.appendChild(empty);
    } else if (!shown.length) {
      pane.appendChild(el('div', 'nbk-empty', 'No notes match that filter.'));
    } else if (state.view === 'stage') {
      pane.appendChild(viewStage(shown));
    } else if (state.view === 'marks') {
      pane.appendChild(viewMarks(shown));
    } else {
      pane.appendChild(viewLesson(shown));
    }

    body.appendChild(pane);
    root.appendChild(body);

    if (keepFocus) {
      var s = root.querySelector('.nbk-search');
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      var s = root.querySelector('.nbk-search');
      if (s) s.focus();
    }
  });

  render();
})();
