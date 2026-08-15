/* Account settings: favourite verse (dashboard banner) and profile. */
window.Page = function () {
  var state = Store.state();
  var user = Store.user();

  var refInput = document.getElementById('fav-ref-input');
  var textInput = document.getElementById('fav-text-input');
  var saved = document.getElementById('fav-saved');

  refInput.value = state.favRef || Store.DEFAULT_FAV_REF;
  textInput.value = state.favText || Store.DEFAULT_FAV_TEXT;

  function clearSaved() { saved.textContent = ''; }
  refInput.addEventListener('input', clearSaved);
  textInput.addEventListener('input', clearSaved);

  document.getElementById('fav-save').addEventListener('click', function () {
    Store.update(function (s) {
      s.favRef = refInput.value.trim() || Store.DEFAULT_FAV_REF;
      s.favText = textInput.value.trim() || Store.DEFAULT_FAV_TEXT;
    });
    saved.textContent = 'Saved ✓';
  });

  var nameInput = document.getElementById('profile-name');
  var emailInput = document.getElementById('profile-email');
  var profileMsg = document.getElementById('profile-msg');
  nameInput.value = user.name;
  emailInput.value = user.email;

  document.getElementById('profile-save').addEventListener('click', function () {
    var res = Store.setProfile(nameInput.value, emailInput.value);
    if (res.error) {
      profileMsg.className = 'form-error';
      profileMsg.textContent = res.error;
      return;
    }
    profileMsg.className = 'form-ok';
    profileMsg.textContent = 'Saved ✓';
    var u = Store.user();
    document.querySelector('.lms-user-name').textContent = u.name;
    document.querySelector('.lms-avatar').textContent = (u.name || u.email).charAt(0).toUpperCase();
  });
};
