const bellIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
const refundIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>';

const refundEventLabels = {
  requested: 'Demande de remboursement envoyée',
  approved: 'Remboursement approuvé',
  rejected: 'Demande de remboursement refusée'
};

(async function init() {
  const list = document.getElementById('notifFullList');
  const reservations = typeof camtravelGetReservations === 'function'
    ? await camtravelGetReservations({ onlyMine: true })
    : [];

  const events = [];
  reservations.forEach(r => {
    events.push({ date: r.createdAt, icon: bellIcon, text: `Réservation confirmée : ${r.from} → ${r.to} (${r.ref})` });
    if (r.refundStatus) {
      events.push({
        date: r.refundRequestedAt || r.createdAt,
        icon: refundIcon,
        text: `${refundEventLabels[r.refundStatus] || r.refundStatus} — ${r.ref}`
      });
    }
  });
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  list.innerHTML = events.length === 0
    ? `<div class="empty-state">Aucune notification pour l'instant.</div>`
    : events.map(ev => `
      <div class="notif-item">
        <div class="notif-icon">${ev.icon}</div>
        <div>
          <div class="notif-text">${ev.text}</div>
          <div class="notif-time">${new Date(ev.date).toLocaleString('fr-FR')}</div>
        </div>
      </div>
    `).join('');

  const user = typeof camtravelGetCurrentUser === 'function' ? await camtravelGetCurrentUser() : null;
  if (user && typeof camtravelMarkClientAllSeen === 'function') camtravelMarkClientAllSeen(user.id);
})();
