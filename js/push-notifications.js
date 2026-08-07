/**
 * CAM travel — Notifications push / mobiles (Web Notification API + Service Worker)
 *
 * - Demande la permission sur mobile/desktop
 * - Enregistre un service worker
 * - Affiche des notifications locales (réservation, rappel départ, remboursement)
 * - Préférences stockées dans localStorage (camtravel_settings.push)
 *
 * Pour de vraies push serveur (même app fermée), branchez ensuite des clés VAPID
 * + un endpoint backend (Supabase Edge Function / FCM). L'API client est prête.
 */
(function () {
  const SETTINGS_KEY = 'camtravel_settings';
  const SW_PATH = 'sw.js';

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveSettings(partial) {
    const s = { ...loadSettings(), ...partial };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    return s;
  }

  function isSupported() {
    return typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator;
  }

  function permission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // granted | denied | default
  }

  function isPushEnabled() {
    const s = loadSettings();
    if (s.push === false) return false;
    return permission() === 'granted';
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: './' });
      return reg;
    } catch (e) {
      console.warn('Service worker registration failed', e);
      return null;
    }
  }

  async function requestPermission() {
    if (!isSupported()) return { ok: false, reason: 'unsupported' };
    if (Notification.permission === 'granted') {
      await registerServiceWorker();
      saveSettings({ push: true });
      return { ok: true, permission: 'granted' };
    }
    if (Notification.permission === 'denied') {
      saveSettings({ push: false });
      return { ok: false, reason: 'denied', permission: 'denied' };
    }
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await registerServiceWorker();
        saveSettings({ push: true });
        return { ok: true, permission: 'granted' };
      }
      saveSettings({ push: false });
      return { ok: false, reason: result, permission: result };
    } catch (e) {
      return { ok: false, reason: 'error', error: e };
    }
  }

  async function disablePush() {
    saveSettings({ push: false });
    return { ok: true };
  }

  /**
   * Affiche une notification (via SW si possible, sinon Notification API).
   * options: { title, body, url, tag }
   */
  async function showNotification(opts) {
    const title = (opts && opts.title) || 'CAM travel';
    const body = (opts && opts.body) || '';
    const url = (opts && opts.url) || 'notifications.html';
    const tag = (opts && opts.tag) || 'camtravel-' + Date.now();

    if (!isPushEnabled()) return { ok: false, reason: 'disabled' };

    // Historique local (page Notifications)
    try {
      const hist = JSON.parse(localStorage.getItem('camtravel_push_history') || '[]');
      hist.unshift({ title, body, url, tag, at: new Date().toISOString() });
      localStorage.setItem('camtravel_push_history', JSON.stringify(hist.slice(0, 50)));
    } catch (e) {}

    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: './assets/logo.svg',
          badge: './assets/logo.svg',
          tag,
          renotify: true,
          vibrate: [120, 60, 120],
          data: { url }
        });
        return { ok: true, via: 'service-worker' };
      }
    } catch (e) {
      console.warn('SW notification failed', e);
    }

    // Fallback : Notification API (onglet ouvert)
    try {
      const n = new Notification(title, {
        body,
        icon: './assets/logo.svg',
        tag,
        data: { url }
      });
      n.onclick = () => {
        window.focus();
        if (url) window.location.href = url;
        n.close();
      };
      return { ok: true, via: 'notification-api' };
    } catch (e) {
      return { ok: false, reason: 'error', error: e };
    }
  }

  // Raccourcis métier CAM travel
  async function notifyBookingConfirmed(ref, from, to) {
    return showNotification({
      title: 'Réservation confirmée',
      body: `${from} → ${to} · Réf. ${ref}`,
      url: 'mes-reservations.html',
      tag: 'booking-' + ref
    });
  }

  async function notifyDepartureReminder(ref, from, to, whenLabel) {
    return showNotification({
      title: 'Rappel de départ',
      body: `Votre bus ${from} → ${to} part ${whenLabel || 'bientôt'} (réf. ${ref})`,
      url: 'tracking.html',
      tag: 'depart-' + ref
    });
  }

  async function notifyRefundUpdate(ref, status) {
    const labels = {
      requested: 'Demande de remboursement envoyée',
      approved: 'Remboursement approuvé',
      rejected: 'Remboursement refusé'
    };
    return showNotification({
      title: labels[status] || 'Remboursement',
      body: `Référence ${ref}`,
      url: 'refunds.html',
      tag: 'refund-' + ref
    });
  }

  async function notifyGeneric(title, body, url) {
    return showNotification({ title, body, url: url || 'notifications.html' });
  }

  // Enregistre le SW tôt si déjà autorisé
  if (isSupported() && permission() === 'granted' && loadSettings().push !== false) {
    registerServiceWorker();
  }

  window.camtravelPush = {
    isSupported,
    permission,
    isPushEnabled,
    requestPermission,
    disablePush,
    showNotification,
    notifyBookingConfirmed,
    notifyDepartureReminder,
    notifyRefundUpdate,
    notifyGeneric,
    registerServiceWorker,
    loadSettings,
    saveSettings
  };
})();
