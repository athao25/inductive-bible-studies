/* Course catalog: one card per course plus the canon map already in the page. */
window.Page = function (ctx) {
  var el = UI.el;
  var courses = window.COURSES;
  var grid = document.getElementById('catalog');

  Object.keys(courses).forEach(function (key) {
    var c = courses[key];
    var stats = Store.courseStats(key);
    var complete = stats.done === stats.total;

    var card = el('a', 'catalog-card');
    card.href = UI.courseHref(ctx.root, key);

    var top = el('div', 'catalog-top');
    top.appendChild(el('span', 'catalog-name', c.name));
    top.appendChild(el('span', 'catalog-status ' + (complete ? 'good' : 'warn'),
      complete ? 'Complete' : (stats.done ? 'In progress' : 'Not started')));
    card.appendChild(top);

    card.appendChild(el('div', 'catalog-tag', c.tagline));
    card.appendChild(el('div', 'catalog-detail', c.detail));

    var foot = el('div', 'catalog-foot');
    foot.appendChild(UI.bar(stats.pct));
    foot.appendChild(el('span', 'pct', stats.pct + '%'));
    card.appendChild(foot);

    grid.appendChild(card);
  });
};
