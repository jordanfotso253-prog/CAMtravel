/**
 * Page Notifications — centre d'alertes client
 */
const ICONS = {
  booking: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg>',
  refund: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>',
  depart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
  admin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  agency: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg>',
  system: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
};

(async function init() {
  const list = document.getElementById('notifFullList');
  if (!list) return;

  // Synchroniser aussi les réservations existantes en notifications si le store est vide
  if (typeof camtravelNotify !== 'undefined' && camtravelNotify.list().length === 0) {
    const reservations = typeof camtravelGetReservations === 'function'
      ? await camtravelGetReservations({ onlyMine: true })
      : [];
    for (const r of reservations) {
      await camtravelNotify.add({
        title: 'Réservation confirmée',
        body: `${r.from} → ${r.to} · Réf. ${r.ref}`,
        type: 'booking',
        role: 'client',
        url: 'mes-reservations.html',
        push: false
      });
      if (r.refundStatus) {
        await camtravelNotify.refundUpdate(r.ref, r.refundStatus);
      }
    }
  }

  const events = typeof camtravelNotify !== 'undefined'
    ? camtravelNotify.list({ role: 'client' })
    : [];

  // Historique push legacy
  try {
    const pushHist = JSON.parse(localStorage.getItem('camtravel_push_history') || '[]');
    pushHist.forEach(p => {
      events.push({
        createdAt: p.at,
        type: 'system',
        title: p.title || 'CAM travel',
        body: p.body || '',
        read: true
      });
    });
  } catch (e) {}

  events.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

  list.innerHTML = events.length === 0
    ? `<div class="empty-state">Aucune notification pour l'instant.<br><span style="font-size:12px;">Les confirmations de réservation, rappels et remboursements apparaîtront ici.</span></div>`
    : events.map(ev => {
        const icon = ICONS[ev.type] || ICONS.system;
        const unread = ev.read === false ? ' notif-unread' : '';
        return `
      <div class="notif-item${unread}" data-id="${ev.id || ''}">
        <div class="notif-icon">${icon}</div>
        <div style="flex:1;">
          <div class="notif-text"><strong>${ev.title || ''}</strong>${ev.body ? ' — ' + ev.body : ''}</div>
          <div class="notif-time">${new Date(ev.createdAt || ev.date || Date.now()).toLocaleString('fr-FR')}</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          ${ev.id ? `<button type="button" class="btn-secondary notif-read-btn" data-id="${ev.id}" style="width:auto;padding:6px 12px;font-size:12px;">Lire</button>` : ''}
          ${ev.url ? `<a href="${ev.url}" class="btn-secondary notif-link" data-id="${ev.id || ''}" style="width:auto;padding:6px 12px;font-size:12px;">Voir</a>` : ''}
        </div>
      </div>`;
      }).join('');

  list.querySelectorAll('.notif-read-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const item = btn.closest('.notif-item');
      if (typeof camtravelNotify !== 'undefined' && btn.dataset.id) {
        camtravelNotify.markRead(btn.dataset.id);
      }
      if (item) {
        item.classList.remove('notif-unread');
        btn.textContent = 'Lu';
        btn.disabled = true;
      }
    });
  });

  list.querySelectorAll('.notif-link').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof camtravelNotify !== 'undefined' && link.dataset.id) {
        camtravelNotify.markRead(link.dataset.id);
      }
    });
  });

  const user = typeof camtravelGetCurrentUser === 'function' ? await camtravelGetCurrentUser() : null;
  if (user && typeof camtravelMarkClientAllSeen === 'function') camtravelMarkClientAllSeen(user.id);

  const clearBtn = document.getElementById('notifClearBtn');
  if (clearBtn && typeof camtravelNotify !== 'undefined') {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Effacer toutes les notifications ?')) return;
      camtravelNotify.clearAll();
      list.innerHTML = `<div class="empty-state">Aucune notification pour l'instant.</div>`;
    });
  }
})();
