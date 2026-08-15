/* Sign-in / sign-up screen. Accounts live in this browser (see assets/store.js);
 * there is no server behind a GitHub Pages site. */
(function () {
  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function build() {
    var mode = location.hash === '#signup' ? 'signup' : 'signin';
    var next = qs('next');
    var form = document.getElementById('auth-form');
    var title = document.getElementById('auth-action');
    var nameField = document.getElementById('name-field');
    var alt = document.getElementById('auth-alt');
    var error = document.getElementById('auth-error');

    function paint() {
      title.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
      nameField.style.display = mode === 'signup' ? '' : 'none';
      alt.innerHTML = mode === 'signup'
        ? 'Already have an account? <a href="#signin">Sign in</a>'
        : 'No account? <a href="#signup">Create one</a>';
      error.textContent = '';
    }

    window.addEventListener('hashchange', function () {
      mode = location.hash === '#signup' ? 'signup' : 'signin';
      paint();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email').value;
      var pass = document.getElementById('password').value;
      var name = document.getElementById('name').value;
      var res = mode === 'signup' ? Store.signUp(email, name, pass) : Store.signIn(email, pass);
      if (res.error) { error.textContent = res.error; return; }
      if (Store.dark()) document.documentElement.setAttribute('data-theme', 'dark');
      location.href = next || 'index.html';
    });

    paint();
    if (Store.signedIn()) location.replace(next || 'index.html');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
