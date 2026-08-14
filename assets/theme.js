/* Site-wide light/dark theme toggle. Include in <head> WITHOUT defer, after
 * course.css, so the saved theme applies before first paint:
 *   <script src="assets/theme.js"></script>       (hub, notebook)
 *   <script src="../assets/theme.js"></script>    (course index)
 *   <script src="../../assets/theme.js"></script> (lesson, reference)
 * The choice lives in localStorage under 'study-theme' ('light' | 'dark').
 * Light is the default when nothing is stored, regardless of the OS scheme.
 */
(function () {
  var KEY = 'study-theme';

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode etc. */ }
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  var btn;

  function refresh() {
    btn.textContent = isDark() ? '☀' : '☾';
    btn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
    btn.title = btn.getAttribute('aria-label');
  }

  function toggle() {
    var next = isDark() ? 'light' : 'dark';
    if (next === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem(KEY, next); } catch (e) { /* private mode etc. */ }
    refresh();
  }

  function build() {
    btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
