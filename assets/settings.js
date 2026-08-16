/* Account settings: favourite verse (dashboard banner) and profile. */
window.Page = async function () {
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

  var favBtn = document.getElementById('fav-save');
  favBtn.addEventListener('click', async function () {
    favBtn.disabled = true;
    var res = await Store.updateProfile({
      favRef: refInput.value.trim() || Store.DEFAULT_FAV_REF,
      favText: textInput.value.trim() || Store.DEFAULT_FAV_TEXT
    });
    favBtn.disabled = false;
    saved.className = res.error ? 'form-error' : 'form-ok';
    saved.textContent = res.error || 'Saved \u2713';
  });

  var nameInput = document.getElementById('profile-name');
  var emailInput = document.getElementById('profile-email');
  var profileMsg = document.getElementById('profile-msg');
  nameInput.value = user.name;
  emailInput.value = user.email;
  // Changing the sign-in address is an auth operation with its own confirmation
  // email, so this screen edits the display name only.
  emailInput.disabled = true;

  var nameBtn = document.getElementById('profile-save');
  nameBtn.addEventListener('click', async function () {
    nameBtn.disabled = true;
    var res = await Store.updateProfile({ name: nameInput.value.trim() });
    nameBtn.disabled = false;
    profileMsg.className = res.error ? 'form-error' : 'form-ok';
    profileMsg.textContent = res.error || 'Saved \u2713';
    if (res.error) return;
    var u = Store.user();
    document.querySelector('.lms-user-name').textContent = u.name;
    document.querySelector('.lms-avatar').textContent = (u.name || u.email).charAt(0).toUpperCase();
  });
};
