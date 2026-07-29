function formatDateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const banner = document.getElementById('statusBanner');
let currentAgency = null;

async function renderTrips() {
  const trips = typeof camtravelGetAgencyTrips === 'function' ? await camtravelGetAgencyTrips(currentAgency.id) : [];
  document.getElementById('statTrips').textContent = trips.length;

  const listEl = document.getElementById('tripsList');
  listEl.innerHTML = trips.length === 0
    ? `<div class="empty-state">Aucun trajet pour l'instant. Ajoutez-en un ci-dessus.</div>`
    : trips.map(t => `
      <div class="admin-trip-row" data-trip-row="${t.id}">
        <div>
          <div class="trip-route">${t.from} → ${t.to}</div>
          <div class="trip-meta">${t.dep} → ${t.arr} ${t.duration ? '· ' + t.duration : ''} · ${Number(t.price).toLocaleString('fr-FR')} FCFA · ${t.seatCount} places</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="status-pill ${t.active ? 'upcoming' : 'past'}">${t.active ? 'Actif' : 'Désactivé'}</span>
          <button type="button" class="btn-secondary" data-toggle-trip="${t.id}" data-current="${t.active}" style="width:auto; padding:8px 12px;">${t.active ? 'Désactiver' : 'Activer'}</button>
          <button type="button" class="trip-delete-btn" data-delete-trip="${t.id}" title="Supprimer le trajet">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
      </div>
    `).join('');

  listEl.querySelectorAll('[data-toggle-trip]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const newActive = btn.dataset.current !== 'true';
      const ok = typeof camtravelUpdateTripActive === 'function' ? await camtravelUpdateTripActive(btn.dataset.toggleTrip, newActive) : false;
      if (ok) renderTrips(); else btn.disabled = false;
    });
  });
  listEl.querySelectorAll('[data-delete-trip]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer définitivement ce trajet ?')) return;
      btn.disabled = true;
      const ok = typeof camtravelDeleteTrip === 'function' ? await camtravelDeleteTrip(btn.dataset.deleteTrip) : false;
      if (ok) renderTrips(); else btn.disabled = false;
    });
  });
}

async function renderBookings() {
  const bookings = typeof camtravelGetAgencyReservations === 'function' ? await camtravelGetAgencyReservations(currentAgency.id) : [];
  document.getElementById('statBookings').textContent = bookings.length;
  const revenue = bookings.reduce((s, b) => s + Number(b.total || 0), 0);
  document.getElementById('statRevenue').textContent = `${revenue.toLocaleString('fr-FR')} FCFA`;

  const listEl = document.getElementById('bookingsList');
  listEl.innerHTML = bookings.length === 0
    ? `<div class="empty-state">Aucune réservation pour l'instant.</div>`
    : bookings.slice(0, 30).map(b => `
      <div class="admin-trip-row">
        <div>
          <div class="trip-ref">${b.ref}</div>
          <div class="trip-route">${b.from} → ${b.to}</div>
          <div class="trip-meta">${formatDateFr(b.date)} · ${b.passagerNom || ''} · ${b.passagerTel || ''}</div>
        </div>
        <div class="trip-price">${Number(b.total || 0).toLocaleString('fr-FR')} FCFA</div>
      </div>
    `).join('');
}

document.getElementById('tripForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const trip = {
    agencyId: currentAgency.id,
    from: document.getElementById('tFrom').value,
    to: document.getElementById('tTo').value,
    dep: document.getElementById('tDep').value.trim(),
    arr: document.getElementById('tArr').value.trim(),
    duration: document.getElementById('tDuration').value.trim(),
    price: Number(document.getElementById('tPrice').value) || 0,
    seatCount: Number(document.getElementById('tSeats').value) || 40,
    tags: document.getElementById('tTags').value.trim() || 'Climatisé'
  };

  if (!trip.from || !trip.to) {
    submitBtn.disabled = false;
    banner.className = 'status-banner show error';
    banner.textContent = "Choisissez une ville de départ et d'arrivée.";
    return;
  }

  const result = typeof camtravelSaveTrip === 'function' ? await camtravelSaveTrip(trip) : { ok: false };
  submitBtn.disabled = false;

  if (result.ok) {
    banner.className = 'status-banner show success';
    banner.textContent = 'Trajet ajouté.';
    e.target.reset();
    document.getElementById('tSeats').value = 40;
    renderTrips();
  } else {
    banner.className = 'status-banner show error';
    banner.textContent = "Impossible d'ajouter le trajet pour le moment.";
  }
});

(async function init() {
  currentAgency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
  if (!currentAgency) return; // agency-guard.js redirige déjà dans ce cas

  document.getElementById('agencyGreeting').textContent = `Bonjour, ${currentAgency.name}`;
  document.getElementById('agencyStatusLine').textContent =
    `Commission : ${currentAgency.commission_percent}% · Statut : ${currentAgency.status === 'active' ? 'Active' : 'Suspendue'}`;

  await renderTrips();
  await renderBookings();
})();
