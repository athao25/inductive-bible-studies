/* Small helpers shared by the LMS page scripts: element building, relative
 * dates, and the URL shapes for courses and lessons. Include after store.js. */
window.UI = (function () {
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function frag() { return document.createDocumentFragment(); }

  function courseHref(root, key) { return root + key + '/index.html'; }
  function lessonHref(root, key, file) { return root + key + '/lessons/' + file; }

  var DAY = 86400000;

  function relTime(ms) {
    if (!ms) return '';
    var now = Date.now();
    var diff = now - ms;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.round(diff / 60000) + ' min ago';
    var today = new Date(now); today.setHours(0, 0, 0, 0);
    var then = new Date(ms); then.setHours(0, 0, 0, 0);
    var days = Math.round((today - then) / DAY);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    if (days < 14) return 'Last week';
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function dateLine(d) {
    return (d || new Date()).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function greeting(d) {
    var h = (d || new Date()).getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function bar(pct) {
    var b = el('div', 'bar');
    var i = el('i');
    i.style.width = Math.max(0, Math.min(100, pct)) + '%';
    b.appendChild(i);
    return b;
  }

  /* "Unit 3: Chapters 5-6" -> "Unit 3" for tight meta lines. */
  function unitShort(unit) { return (unit || '').split(':')[0].trim(); }

  return {
    el: el, frag: frag, bar: bar,
    courseHref: courseHref, lessonHref: lessonHref,
    relTime: relTime, dateLine: dateLine, greeting: greeting, unitShort: unitShort
  };
})();
