/**
 * CAM travel — Système de notifications unifié
 * - Stockage local (et Supabase si table "notifications" disponible)
 * - Centre d'alertes, badges, push mobile
 * - API : camtravelNotify.add / list / unreadCount / markAllRead
 */
(function () {
  const KEY = 'camtravel_notifications';
  const SEEN_KEY = 'camtravel_notif_seen_at';

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function saveAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  }

  function uid() {
    return 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function defaultUrlForRole(role) {
    const normalized = (role || '').toLowerCase();
    if (normalized === 'admin') return 'admin-dashboard.html';
    if (normalized === 'agency') return 'agency-dashboard.html';
    if (normalized === 'client') return 'notifications.html';
    return 'dashboard.html';
  }

  /**
   * @param {object} n
   * @param {string} n.title
   * @param {string} [n.body]
   * @param {string} [n.type]  booking|refund|depart|system|admin|agency
   * @param {string} [n.role]  client|admin|agency|all
   * @param {string} [n.url]
   * @param {string} [n.userId]  destinataire (optionnel)
   * @param {boolean} [n.push]  tenter une push mobile
   */
  async function add(n) {
    const entry = {
      id: uid(),
      title: n.title || 'CAM travel',
      body: n.body || '',
      type: n.type || 'system',
      role: n.role || 'all',
      url: (typeof n.url === 'string' && n.url.trim()) ? n.url : defaultUrlForRole(n.role),
      userId: n.userId || null,
      read: false,
      createdAt: new Date().toISOString()
    };
    const list = loadAll();
    list.unshift(entry);
    saveAll(list);

    // Push navigateur si demandé et autorisé
    if (n.push !== false && typeof camtravelPush !== 'undefined' && camtravelPush.isPushEnabled()) {
      try {
        await camtravelPush.showNotification({
          title: entry.title,
          body: entry.body,
          url: entry.url,
          tag: entry.id
        });
      } catch (e) {}
    }

    // Sync Supabase optionnelle
    if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
      try {
        await window.camtravelSupabase.from('notifications').insert({
          title: entry.title,
          body: entry.body,
          type: entry.type,
          role: entry.role,
          url: entry.url,
          user_id: entry.userId
        });
      } catch (e) { /* table optionnelle */ }
    }

    document.dispatchEvent(new CustomEvent('camtravel:notification', { detail: entry }));
    return entry;
  }

  function list(opts) {
    opts = opts || {};
    let items = loadAll();
    if (opts.role && opts.role !== 'all') {
      items = items.filter(n => n.role === opts.role || n.role === 'all');
    }
    if (opts.userId) {
      items = items.filter(n => !n.userId || n.userId === opts.userId);
    }
    if (opts.unreadOnly) {
      items = items.filter(n => !n.read);
    }
    return items;
  }

  function unreadCount(opts) {
    return list({ ...opts, unreadOnly: true }).length;
  }

  function markRead(id) {
    const list = loadAll().map(n => n.id === id ? { ...n, read: true } : n);
    saveAll(list);
    document.dispatchEvent(new CustomEvent('camtravel:notification', { detail: { id, action: 'markRead' } }));
  }

  function markAllRead(opts) {
    opts = opts || {};
    const all = loadAll().map(n => {
      if (opts.role && n.role !== opts.role && n.role !== 'all') return n;
      return { ...n, read: true };
    });
    saveAll(all);
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
    document.dispatchEvent(new CustomEvent('camtravel:notification', { detail: { action: 'markAllRead', opts } }));
  }

  function clearAll() {
    saveAll([]);
  }

  // Helpers métier
  async function bookingConfirmed(ref, from, to, userId) {
    return add({
      title: 'Réservation confirmée',
      body: `${from} → ${to} · Réf. ${ref}`,
      type: 'booking',
      role: 'client',
      url: 'mes-reservations.html',
      userId,
      push: true
    });
  }

  async function refundUpdate(ref, status, userId) {
    const labels = {
      requested: 'Demande de remboursement envoyée',
      approved: 'Remboursement approuvé',
      rejected: 'Remboursement refusé'
    };
    return add({
      title: labels[status] || 'Remboursement',
      body: `Référence ${ref}`,
      type: 'refund',
      role: 'client',
      url: 'refunds.html',
      userId,
      push: true
    });
  }

  async function adminNewBooking(ref, from, to) {
    return add({
      title: 'Nouvelle réservation',
      body: `${ref} · ${from} → ${to}`,
      type: 'admin',
      role: 'admin',
      url: 'admin-reservations.html',
      push: true
    });
  }

  async function agencyNewBooking(ref, from, to) {
    return add({
      title: 'Réservation sur vos trajets',
      body: `${ref} · ${from} → ${to}`,
      type: 'agency',
      role: 'agency',
      url: 'agency-dashboard.html#bookings',
      push: true
    });
  }

  async function departureReminder(ref, from, to) {
    return add({
      title: 'Rappel de départ',
      body: `Bus ${from} → ${to} sous peu (réf. ${ref})`,
      type: 'depart',
      role: 'client',
      url: 'tracking.html',
      push: true
    });
  }

  window.camtravelNotify = {
    add, list, unreadCount, markRead, markAllRead, clearAll,
    bookingConfirmed, refundUpdate, adminNewBooking, agencyNewBooking, departureReminder
  };
})();
