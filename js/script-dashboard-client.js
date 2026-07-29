(async function initClientDashboard() {
  const [profile, real] = await Promise.all([
    typeof camtravelGetMyProfile === 'function' ? camtravelGetMyProfile() : null,
    typeof camtravelGetReservations === 'function' ? camtravelGetReservations({ onlyMine: true }) : []
  ]);

  const greetingEl = document.getElementById('dashGreeting');
  if (greetingEl) {
    greetingEl.textContent = `Bonjour, ${(profile && profile.nom) || 'Client'} 👋`;
  }

  const totalReservations = real.length;
  const totalSpent = real.reduce((sum, r) => sum + Number(r.total || 0), 0);

  const elReservations = document.getElementById('statMyReservations');
  const elSpent = document.getElementById('statSpent');
  if (elReservations) elReservations.textContent = totalReservations;
  if (elSpent) elSpent.textContent = `${totalSpent.toLocaleString('fr-FR')} FCFA`;

  // ---- Notifications client (basées sur les réservations réelles du
  // compte connecté ; marquées comme lues à l'ouverture, par compte) ----
  const notifBtn = document.getElementById('clientNotifBtn');
  const notifBadge = document.getElementById('clientNotifBadge');
  const notifDropdown = document.getElementById('clientNotifDropdown');
  const notifList = document.getElementById('clientNotifList');
  if (!notifBtn) return;

  const user = typeof camtravelGetCurrentUser === 'function' ? await camtravelGetCurrentUser() : null;
  const lastSeen = (user && typeof camtravelGetClientLastSeen === 'function')
    ? camtravelGetClientLastSeen(user.id)
    : '1970-01-01T00:00:00.000Z';

  const events = real.map(r => ({
    date: r.createdAt,
    text: `Réservation confirmée : ${r.from} → ${r.to} (${r.ref})`
  })).sort((a, b) => new Date(b.date) - new Date(a.date));

  const unseenCount = events.filter(ev => ev.date > lastSeen).length;

  if (unseenCount > 0) {
    notifBadge.style.display = 'flex';
    notifBadge.textContent = unseenCount > 9 ? '9+' : unseenCount;
  }

  if (events.length > 0) {
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
    if (!isOpen) {
      if (user && typeof camtravelMarkClientAllSeen === 'function') camtravelMarkClientAllSeen(user.id);
      notifBadge.style.display = 'none';
    }
  });
  document.addEventListener('click', (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.style.display = 'none';
    }
  });
})();
