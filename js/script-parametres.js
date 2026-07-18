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

document.getElementById('deleteAccountBtn').addEventListener('click', () => {
  const confirmed = confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.");
  if (confirmed) {
    banner.className = 'status-banner show error';
    banner.textContent = "Suppression de compte : fonctionnalité de démonstration — nécessite un vrai système de comptes côté serveur pour être effective.";
  }
});
