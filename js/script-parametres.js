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

if (emailToggle && settings.email !== undefined) emailToggle.checked = settings.email;
if (smsToggle && settings.sms !== undefined) smsToggle.checked = settings.sms;
if (promoToggle && settings.promo !== undefined) promoToggle.checked = settings.promo;

const banner = document.getElementById('statusBanner');

function showSaved() {
  if (!banner) return;
  banner.className = 'status-banner show success';
  banner.textContent = typeof camtravelT === 'function' ? camtravelT('settings.saved') : 'Préférences enregistrées.';
  setTimeout(() => banner.classList.remove('show'), 2000);
}

[emailToggle, smsToggle, promoToggle].filter(Boolean).forEach(el => {
  el.addEventListener('change', () => {
    saveSettings({
      email: emailToggle ? emailToggle.checked : true,
      sms: smsToggle ? smsToggle.checked : false,
      promo: promoToggle ? promoToggle.checked : true
    });
    showSaved();
  });
});

// ---- Langue FR / EN ----
const langSelect = document.getElementById('langSelect');
if (langSelect) {
  langSelect.value = typeof camtravelGetLang === 'function' ? camtravelGetLang() : 'fr';
  langSelect.addEventListener('change', () => {
    if (typeof camtravelSetLang === 'function') camtravelSetLang(langSelect.value);
    showSaved();
  });
}

// ---- Thème clair / sombre ----
const themeSelect = document.getElementById('themeSelect');
if (themeSelect) {
  themeSelect.value = typeof camtravelGetTheme === 'function' ? camtravelGetTheme() : 'light';
  themeSelect.addEventListener('change', () => {
    if (typeof camtravelSetTheme === 'function') camtravelSetTheme(themeSelect.value);
    showSaved();
  });
}

// ---- Palette de couleurs client ----
const paletteOptions = document.querySelectorAll('[data-palette]');
if (paletteOptions.length && typeof camtravelGetPalette === 'function') {
  function refreshPaletteSelection() {
    const selected = camtravelGetPalette();
    paletteOptions.forEach(option => {
      option.classList.toggle('is-selected', option.dataset.palette === selected);
      option.setAttribute('aria-pressed', option.dataset.palette === selected ? 'true' : 'false');
    });
  }
  refreshPaletteSelection();
  paletteOptions.forEach(option => {
    option.addEventListener('click', () => {
      camtravelSetPalette(option.dataset.palette);
      refreshPaletteSelection();
      showSaved();
    });
  });
}

const deleteBtn = document.getElementById('deleteAccountBtn');
if (deleteBtn) {
  deleteBtn.addEventListener('click', async () => {
    const msg = typeof camtravelGetLang === 'function' && camtravelGetLang() === 'en'
      ? 'Do you really want to delete your account? This cannot be undone.'
      : 'Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.';
    const confirmed = confirm(msg);
    if (!confirmed) return;

    deleteBtn.disabled = true;

    const result = typeof camtravelDeleteOwnAccount === 'function'
      ? await camtravelDeleteOwnAccount()
      : { ok: false, reason: 'no-supabase' };

    if (result.ok) {
      banner.className = 'status-banner show success';
      banner.textContent = typeof camtravelGetLang === 'function' && camtravelGetLang() === 'en'
        ? 'Account deleted. See you soon!'
        : 'Compte supprimé. À bientôt !';
      setTimeout(() => { window.location.href = 'index.html'; }, 1200);
      return;
    }

    deleteBtn.disabled = false;
    banner.className = 'status-banner show error';
    banner.textContent = result.reason === 'no-supabase'
      ? (typeof camtravelGetLang === 'function' && camtravelGetLang() === 'en'
          ? 'Account deletion requires Supabase (unavailable in local demo mode).'
          : 'La suppression de compte nécessite Supabase configuré (indisponible en mode démo local).')
      : (typeof camtravelGetLang === 'function' && camtravelGetLang() === 'en'
          ? 'Unable to delete the account right now. Please try again.'
          : 'Impossible de supprimer le compte pour le moment. Réessayez.');
  });
}


// ---- Notifications push mobiles ----
(function initPushSettings() {
  const pushToggle = document.getElementById('notifPush');
  const pushStatus = document.getElementById('pushStatus');
  const pushTestBtn = document.getElementById('pushTestBtn');
  if (!pushToggle || typeof camtravelPush === 'undefined') return;

  function statusText() {
    if (!camtravelPush.isSupported()) return 'Non supporté sur ce navigateur.';
    const p = camtravelPush.permission();
    if (p === 'denied') return 'Bloqué par le navigateur — autorisez les notifications dans les réglages du téléphone.';
    if (p === 'granted' && camtravelPush.isPushEnabled()) return 'Activé — vous recevrez des alertes sur cet appareil.';
    if (p === 'granted') return 'Permission accordée, mais désactivé dans les préférences.';
    return 'Non activé — basculez l’interrupteur pour autoriser.';
  }
  function refresh() {
    pushToggle.checked = camtravelPush.isPushEnabled();
    if (pushStatus) pushStatus.textContent = statusText();
  }
  refresh();

  pushToggle.addEventListener('change', async () => {
    if (pushToggle.checked) {
      const res = await camtravelPush.requestPermission();
      if (!res.ok) {
        pushToggle.checked = false;
        if (banner) {
          banner.className = 'status-banner show error';
          banner.textContent = res.reason === 'denied'
            ? 'Notifications bloquées. Autorisez-les dans les réglages du navigateur / téléphone.'
            : 'Impossible d’activer les notifications push sur cet appareil.';
        }
      } else {
        showSaved();
      }
    } else {
      await camtravelPush.disablePush();
      showSaved();
    }
    refresh();
  });

  if (pushTestBtn) {
    pushTestBtn.addEventListener('click', async () => {
      if (!camtravelPush.isPushEnabled()) {
        const res = await camtravelPush.requestPermission();
        refresh();
        if (!res.ok) {
          if (banner) {
            banner.className = 'status-banner show error';
            banner.textContent = 'Activez d’abord les notifications push.';
          }
          return;
        }
      }
      await camtravelPush.notifyGeneric(
        'CAM travel',
        'Notification de test — votre appareil est correctement configuré.',
        'notifications.html'
      );
      if (banner) {
        banner.className = 'status-banner show success';
        banner.textContent = 'Notification de test envoyée.';
        setTimeout(() => banner.classList.remove('show'), 2000);
      }
    });
  }
})();


// ---- Gestion e-mails ----
(async function initEmailSettings() {
  const label = document.getElementById('emailAccountLabel');
  const outboxEl = document.getElementById('emailOutbox');
  const testBtn = document.getElementById('emailTestBtn');
  const hint = document.getElementById('emailProviderHint');

  if (typeof camtravelEmail === 'undefined') return;

  try {
    const r = await camtravelEmail.resolveRecipient();
    if (label) {
      label.textContent = r.email
        ? r.email + (r.name ? ' (' + r.name + ')' : '')
        : 'Aucune adresse — connectez-vous ou complétez votre profil.';
    }
  } catch (e) {
    if (label) label.textContent = 'Connectez-vous pour associer une adresse e-mail.';
  }

  if (hint) {
    hint.textContent = camtravelEmail.emailjsReady()
      ? 'Fournisseur : EmailJS configuré — les e-mails sont envoyés réellement.'
      : 'Mode local : configurez js/email-config.js (EmailJS) pour un envoi réel. Les messages sont stockés dans l’historique ci-dessous.';
  }

  function renderOutbox() {
    if (!outboxEl) return;
    const items = camtravelEmail.loadOutbox();
    if (!items.length) {
      outboxEl.innerHTML = '<div class="empty-state" style="padding:12px;">Aucun e-mail pour l\'instant.</div>';
      return;
    }
    outboxEl.innerHTML = items.map(e => `
      <div class="email-outbox-item">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">
          <strong style="font-size:13px;">${e.subject || ''}</strong>
          <span class="status-pill ${e.status === 'sent' ? 'upcoming' : e.status === 'error' ? 'past' : ''}">${e.status === 'sent' ? 'Envoyé' : e.status === 'local' ? 'File locale' : e.status === 'error' ? 'Erreur' : e.status}</span>
        </div>
        <div style="font-size:12px;color:var(--gray-text);margin-top:4px;">À : ${e.to || '—'} · ${new Date(e.at).toLocaleString('fr-FR')}</div>
      </div>
    `).join('');
  }
  renderOutbox();
  document.addEventListener('camtravel:email', renderOutbox);

  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      testBtn.disabled = true;
      const res = await camtravelEmail.sendTest();
      testBtn.disabled = false;
      if (banner) {
        banner.className = 'status-banner show ' + (res.ok ? 'success' : 'error');
        if (res.reason === 'disabled') banner.textContent = 'Activez d’abord « Notifications par email ».';
        else if (res.reason === 'no-email') banner.textContent = 'Aucune adresse e-mail sur le compte.';
        else if (res.ok && res.entry && res.entry.status === 'local') banner.textContent = 'E-mail enregistré en file locale (configurez EmailJS pour l’envoi réel).';
        else if (res.ok) banner.textContent = 'E-mail de test envoyé.';
        else banner.textContent = 'Échec de l’envoi.';
        setTimeout(() => banner.classList.remove('show'), 3500);
      }
      renderOutbox();
    });
  }
})();
