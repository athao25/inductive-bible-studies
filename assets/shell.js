/* Persistent app shell: left sidebar, theme toggle, auth guard.
 *
 * Include on every signed-in screen, after assets/store.js and the course
 * index (assets/data/courses.js):
 *   <script src="assets/store.js" defer></script>
 *   <script src="assets/data/courses.js" defer></script>
 *   <script src="assets/shell.js" defer></script>
 * Path depth is read off this script's own src, so the same tag works from the
 * root, a course folder or a lessons/ folder.
 *
 * Mark the active nav item with <body data-nav="dashboard|courses|notebook|settings">.
 */
window.Shell = (function () {
  var NAV = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard', href: 'index.html' },
    { id: 'courses', icon: '▤', label: 'Courses', href: 'courses.html' },
    { id: 'notebook', icon: '✎', label: 'Notebook', href: 'notebook.html' },
    { id: 'settings', icon: '⚙', label: 'Settings', href: 'settings.html' }
  ];

  function rootPrefix() {
    var tags = document.getElementsByTagName('script');
    for (var i = 0; i < tags.length; i++) {
      var src = tags[i].getAttribute('src') || '';
      var at = src.indexOf('assets/shell.js');
      if (at !== -1) return src.slice(0, at);
    }
    return '';
  }

  var root = rootPrefix();

  function url(path) { return root + path; }

  function applyTheme() {
    var dark = Store.dark();
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    return dark;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function guard() {
    if (Store.signedIn()) return true;
    var here = location.pathname + location.search + location.hash;
    location.replace(url('signin.html') + '?next=' + encodeURIComponent(here));
    return false;
  }

  function build() {
    var user = Store.user();
    if (!user) return;

    var active = document.body.getAttribute('data-nav') || '';
    var side = el('aside', 'lms-sidebar');

    var brand = el('a', 'lms-brand');
    brand.href = url('index.html');
    brand.appendChild(el('div', 'lms-mark', 'ℬ'));
    var name = el('div', 'lms-brand-name');
    name.innerHTML = 'Inductive<br>Bible Studies';
    brand.appendChild(name);
    side.appendChild(brand);

    NAV.forEach(function (item) {
      var a = el('a', 'lms-nav-item' + (item.id === active ? ' active' : ''));
      a.href = url(item.href);
      a.appendChild(el('span', 'ico', item.icon));
      a.appendChild(document.createTextNode(item.label));
      side.appendChild(a);
    });

    side.appendChild(el('div', 'lms-spacer'));

    var themeBtn = el('button', 'lms-theme');
    themeBtn.type = 'button';
    var themeIco = el('span', 'ico');
    var themeLabel = document.createTextNode('');
    themeBtn.appendChild(themeIco);
    themeBtn.appendChild(themeLabel);
    function paintTheme(dark) {
      themeIco.textContent = dark ? '☀' : '☾';
      themeLabel.nodeValue = dark ? 'Light mode' : 'Dark mode';
    }
    paintTheme(Store.dark());
    themeBtn.addEventListener('click', function () {
      Store.setDark(!Store.dark());
      paintTheme(applyTheme());
    });
    side.appendChild(themeBtn);

    var block = el('div', 'lms-user');
    block.appendChild(el('div', 'lms-avatar', (user.name || user.email).charAt(0).toUpperCase()));
    var who = el('div');
    who.appendChild(el('div', 'lms-user-name', user.name));
    var out = el('a', 'lms-signout', 'Sign out');
    out.href = '#';
    out.addEventListener('click', function (e) {
      e.preventDefault();
      Store.signOut();
      location.href = url('signin.html');
    });
    who.appendChild(out);
    block.appendChild(who);
    side.appendChild(block);

    document.body.insertBefore(side, document.body.firstChild);

    var burger = el('button', 'lms-burger', '☰');
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Toggle navigation');
    burger.addEventListener('click', function () { side.classList.toggle('open'); });
    document.body.appendChild(burger);
  }

  function init() {
    document.body.classList.add('lms');
    applyTheme();
    if (!guard()) return;
    build();
    if (typeof window.Page === 'function') window.Page({ root: root, url: url });
  }

  var api = { url: url, root: root, applyTheme: applyTheme };

  /* Wait for DOMContentLoaded even when this runs as a deferred script, so page
     scripts loaded after it have already registered window.Page. */
  if (document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);

  return api;
})();
