(async function initClientDashboard() {
  const [profile, real] = await Promise.all([
    typeof camtravelGetMyProfile === 'function' ? camtravelGetMyProfile() : null,
    typeof camtravelGetReservations === 'function' ? camtravelGetReservations({ onlyMine: true }) : []
  ]);

  const greetingEl = document.getElementById('dashGreeting');
  if (greetingEl) {
    greetingEl.textContent = `Bonjour, ${(profile && profile.nom) || 'Client'} 👋`;
  }

  function isUpcoming(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(d) && d >= today;
  }

  const totalReservations = real.length;
  const totalSpent = real.reduce((sum, r) => sum + Number(r.total || 0), 0);
  const upcoming = real.filter(r => isUpcoming(r.date));
  const past = real.filter(r => !isUpcoming(r.date));

  const elReservations = document.getElementById('statMyReservations');
  const elSpent = document.getElementById('statSpent');
  const elUpcoming = document.getElementById('statUpcoming');
  const elPast = document.getElementById('statPast');
  if (elReservations) elReservations.textContent = totalReservations;
  if (elSpent) elSpent.textContent = `${totalSpent.toLocaleString('fr-FR')} FCFA`;
  if (elUpcoming) elUpcoming.textContent = upcoming.length;
  if (elPast) elPast.textContent = past.length;

  // Graphique mensuel client
  const chartC = document.getElementById('monthlyChartClient');
  if (chartC && typeof camtravelMonthlyStats !== 'undefined') {
    const spent = camtravelMonthlyStats.aggregateByMonth(real, 6, r => Number(r.total || r.price || 0));
    camtravelMonthlyStats.renderBarChart(chartC, spent, {
      color: 'linear-gradient(180deg,#0b5c3d,#14b86a)',
      height: 150,
      format: v => v >= 1000 ? Math.round(v/1000) + 'k' : String(v)
    });
    // solid color fallback for gradient string in height bars
    chartC.querySelectorAll('.mstat-bar').forEach(b => { b.style.background = '#0b5c3d'; });
  }


  const recentEl = document.getElementById('clientRecentList');
  if (recentEl) {
    if (real.length === 0) {
      recentEl.innerHTML = `<div class="empty-state">Aucune réservation. <a href="recherche.html">Réserver un trajet</a></div>`;
    } else {
      recentEl.innerHTML = real.slice(0, 6).map(r => `
        <div class="admin-trip-row">
          <div>
            <div class="trip-ref">${r.ref || ''} <span class="status-pill ${isUpcoming(r.date) ? 'upcoming' : 'past'}">${isUpcoming(r.date) ? 'À venir' : 'Passé'}</span></div>
            <div class="trip-route">${r.from || ''} → ${r.to || ''}</div>
            <div class="trip-meta">${r.date || ''} · ${r.dep || ''}</div>
          </div>
          <div class="trip-price">${Number(r.total || r.price || 0).toLocaleString('fr-FR')} FCFA</div>
        </div>
      `).join('');
    }
  }

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


// Rappel de départ (si trajet dans les 2 prochaines heures et push activé)
(async function departureReminders() {
  if (typeof camtravelPush === 'undefined' || !camtravelPush.isPushEnabled()) return;
  if (typeof camtravelGetReservations !== 'function') return;
  const all = await camtravelGetReservations({ onlyMine: true });
  const now = Date.now();
  const key = 'camtravel_depart_reminded';
  let reminded = {};
  try { reminded = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
  for (const r of all) {
    if (!r.date || !r.dep || reminded[r.ref]) continue;
    // parse simple
    const parts = String(r.dep).trim().split(/\s+/);
    let [h, m] = (parts[0] || '08:00').split(':').map(Number);
    const mer = (parts[1] || '').toUpperCase();
    if (mer === 'PM' && h !== 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    const d = new Date(r.date);
    if (isNaN(d.getTime())) continue;
    d.setHours(h || 8, m || 0, 0, 0);
    const diff = d.getTime() - now;
    if (diff > 0 && diff < 2 * 3600000) {
      if (typeof camtravelNotify !== 'undefined') {
        await camtravelNotify.departureReminder(r.ref, r.from, r.to);
      } else if (typeof camtravelPush !== 'undefined') {
        await camtravelPush.notifyDepartureReminder(r.ref, r.from, r.to, 'dans moins de 2 h');
      }
      if (typeof camtravelEmail !== 'undefined') {
        try { await camtravelEmail.sendDepart({ ref: r.ref, from: r.from, to: r.to }); } catch (e) {}
      }
      reminded[r.ref] = true;
    }
  }
  localStorage.setItem(key, JSON.stringify(reminded));
})();
