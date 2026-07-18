const DEMO_TRIPS = [
  { ref: 'YA001', from: 'Yaoundé', to: 'Douala', date: '2024-06-26', dep: '08:00 AM', total: 12500 },
  { ref: 'YA002', from: 'Douala', to: 'Bafoussam', date: '2024-06-10', dep: '10:00 AM', total: 10000 },
  { ref: 'YA003', from: 'Bertoua', to: 'Yaoundé', date: '2024-06-12', dep: '09:00 AM', total: 15000 },
];

function formatDateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function isUpcoming(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(d) && d >= today;
}

function renderList(containerId, list, emptyLabel) {
  const container = document.getElementById(containerId);
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">${emptyLabel}</div>`;
    return;
  }
  container.innerHTML = list.map(r => `
    <div class="trip-row">
      <div>
        <div class="trip-ref">${r.ref}</div>
        <div class="trip-route">${r.from} → ${r.to}</div>
        <div class="trip-meta">${formatDateFr(r.date)} · ${r.dep || ''}</div>
      </div>
      <div class="trip-price">${Number(r.total || r.price || 0).toLocaleString('fr-FR')} FCFA</div>
    </div>
  `).join('');
}

(async function init() {
  const real = typeof camtravelGetReservations === 'function' ? await camtravelGetReservations() : [];
  const all = [...real, ...DEMO_TRIPS];

  const upcoming = all.filter(r => isUpcoming(r.date)).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = all.filter(r => !isUpcoming(r.date)).sort((a, b) => new Date(b.date) - new Date(a.date));

  renderList('upcomingList', upcoming, "Aucun trajet à venir. Réservez-en un dès maintenant !");
  renderList('pastList', past, "Aucun trajet passé pour l'instant.");
})();
