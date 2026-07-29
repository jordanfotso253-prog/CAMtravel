const SETTINGS_KEY = 'camtravel_settings';

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const settings = loadSettings();
const emailToggle = document.getElementById('notifEmail');
const smsToggle = document.getElementById('notifSms');
const promoToggle = document.getElementById('notifPromo');

if (settings.email !== undefined) emailToggle.checked = settings.email;
if (settings.sms !== undefined) smsToggle.checked = settings.sms;
if (settings.promo !== undefined) promoToggle.checked = settings.promo;

const banner = document.getElementById('statusBanner');

function showSaved() {
  banner.className = 'status-banner show success';
  banner.textContent = 'Préférences enregistrées.';
  setTimeout(() => banner.classList.remove('show'), 2000);
}

[emailToggle, smsToggle, promoToggle].forEach(el => {
  el.addEventListener('change', () => {
    saveSettings({ email: emailToggle.checked, sms: smsToggle.checked, promo: promoToggle.checked });
    showSaved();
  });
});

// ---- Thème clair / sombre ----
const themeSelect = document.getElementById('themeSelect');
if (themeSelect) {
  themeSelect.value = typeof camtravelGetTheme === 'function' ? camtravelGetTheme() : 'light';
  themeSelect.addEventListener('change', () => {
    if (typeof camtravelSetTheme === 'function') camtravelSetTheme(themeSelect.value);
    showSaved();
  });
}

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
  const confirmed = confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.");
  if (!confirmed) return;

  const btn = document.getElementById('deleteAccountBtn');
  btn.disabled = true;

  const result = typeof camtravelDeleteOwnAccount === 'function'
    ? await camtravelDeleteOwnAccount()
    : { ok: false, reason: 'no-supabase' };

  if (result.ok) {
    banner.className = 'status-banner show success';
    banner.textContent = "Compte supprimé. À bientôt !";
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    return;
  }

  btn.disabled = false;
  banner.className = 'status-banner show error';
  banner.textContent = result.reason === 'no-supabase'
    ? "La suppression de compte nécessite Supabase configuré (indisponible en mode démo local)."
    : "Impossible de supprimer le compte pour le moment. Réessayez.";
});
