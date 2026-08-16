/* Sign-in / sign-up / password-reset screen, backed by Supabase Auth. */
(function () {
  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function modeFromHash() {
    if (location.hash === '#signup') return 'signup';
    if (location.hash === '#reset') return 'reset';
    return 'signin';
  }

  async function build() {
    var mode = modeFromHash();
    var next = qs('next');
    var form = document.getElementById('auth-form');
    var action = document.getElementById('auth-action');
    var nameField = document.getElementById('name-field');
    var passField = document.getElementById('password-field');
    var alt = document.getElementById('auth-alt');
    var error = document.getElementById('auth-error');
    var notice = document.getElementById('auth-notice');

    function paint() {
      action.textContent = mode === 'signup' ? 'Create account'
        : mode === 'reset' ? 'Send reset link' : 'Sign in';
      nameField.style.display = mode === 'signup' ? '' : 'none';
      passField.style.display = mode === 'reset' ? 'none' : '';
      document.getElementById('password').required = mode !== 'reset';
      alt.innerHTML = mode === 'signup'
        ? 'Already have an account? <a href="#signin">Sign in</a>'
        : mode === 'reset'
          ? '<a href="#signin">Back to sign in</a>'
          : 'No account? <a href="#signup">Create one</a> · <a href="#reset">Forgot password</a>';
      error.textContent = '';
      notice.textContent = '';
    }

    window.addEventListener('hashchange', function () { mode = modeFromHash(); paint(); });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      error.textContent = '';
      notice.textContent = '';
      action.disabled = true;
      var was = action.textContent;
      action.textContent = 'Working…';

      var email = document.getElementById('email').value;
      var pass = document.getElementById('password').value;
      var name = document.getElementById('name').value;

      var res;
      if (mode === 'signup') res = await Store.signUp(email, name, pass);
      else if (mode === 'reset') res = await Store.resetPassword(email, location.href.split('#')[0]);
      else res = await Store.signIn(email, pass);

      action.disabled = false;
      action.textContent = was;

      if (res.error) { error.textContent = res.error; return; }
      if (mode === 'reset') { notice.textContent = 'Check your email for a reset link.'; return; }
      if (res.needsConfirmation) {
        notice.textContent = 'Account created. Check your email to confirm it, then sign in.';
        location.hash = '#signin';
        return;
      }
      if (Store.dark()) document.documentElement.setAttribute('data-theme', 'dark');
      location.href = next || 'index.html';
    });

    paint();

    var started = await Store.init();
    if (started && started.error) { error.textContent = started.error; return; }
    if (Store.dark()) document.documentElement.setAttribute('data-theme', 'dark');
    if (Store.signedIn()) location.replace(next || 'index.html');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
