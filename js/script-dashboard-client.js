const DEMO_RESERVATIONS_COUNT = 3;
const DEMO_SPENT = 125000;

(async function initClientDashboard() {
  const real = typeof camtravelGetReservations === 'function' ? await camtravelGetReservations() : [];

  const totalReservations = DEMO_RESERVATIONS_COUNT + real.length;
  const totalSpent = DEMO_SPENT + real.reduce((sum, r) => sum + Number(r.total || 0), 0);

  const elReservations = document.getElementById('statMyReservations');
  const elSpent = document.getElementById('statSpent');
  if (elReservations) elReservations.textContent = totalReservations;
  if (elSpent) elSpent.textContent = `${totalSpent.toLocaleString('fr-FR')} FCFA`;

  // ---- Notifications client (basées sur les réservations réelles) ----
  const notifBtn = document.getElementById('clientNotifBtn');
  const notifBadge = document.getElementById('clientNotifBadge');
  const notifDropdown = document.getElementById('clientNotifDropdown');
  const notifList = document.getElementById('clientNotifList');
  if (!notifBtn) return;

  const events = real.map(r => ({
    date: r.createdAt,
    text: `Réservation confirmée : ${r.from} → ${r.to} (${r.ref})`
  })).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (events.length > 0) {
    notifBadge.style.display = 'flex';
    notifBadge.textContent = events.length > 9 ? '9+' : events.length;
    notifList.innerHTML = events.slice(0, 10).map(ev => `
      <div style="padding:10px; border-radius:8px; font-size:12.5px; color:var(--ink);">
        ${ev.text}
        <div style="font-size:11px; color:var(--gray-text); margin-top:2px;">${new Date(ev.date).toLocaleString('fr-FR')}</div>
      </div>
    `).join('');
  } else {
    notifList.innerHTML = `<div style="padding:14px 10px; font-size:13px; color:var(--gray-text);">Aucune notification pour l'instant.</div>`;
  }

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = notifDropdown.style.display === 'block';
    notifDropdown.style.display = isOpen ? 'none' : 'block';
  });
  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.style.display = 'none';
    }
  });
})();
