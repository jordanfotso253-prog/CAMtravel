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

async function loadReservations() {
  return typeof camtravelGetReservations === 'function' ? await camtravelGetReservations({ onlyMine: true }) : [];
}

function renderReservations(list, filter) {
  const container = document.getElementById('reservationsList');
  const filtered = list.filter(r => {
    if (filter === 'avenir') return isUpcoming(r.date);
    if (filter === 'passees') return !isUpcoming(r.date);
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">Aucune réservation ${filter === 'avenir' ? 'à venir' : filter === 'passees' ? 'passée' : ''} pour le moment.</div>`;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const upcoming = isUpcoming(r.date);
    return `
      <div class="trip-row">
        <div>
          <div class="trip-ref">${r.ref} <span class="status-pill ${upcoming ? 'upcoming' : 'past'}">${upcoming ? 'À venir' : 'Passé'}</span></div>
          <div class="trip-route">${r.from} → ${r.to}</div>
          <div class="trip-meta">${formatDateFr(r.date)} · ${r.dep || ''}</div>
        </div>
        <div class="trip-price">${Number(r.total || r.price || 0).toLocaleString('fr-FR')} FCFA</div>
      </div>`;
  }).join('');
}

(async function init() {
  const all = await loadReservations();
  renderReservations(all, 'toutes');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderReservations(all, btn.dataset.filter);
    });
  });
})();
