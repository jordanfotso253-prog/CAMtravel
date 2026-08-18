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
          <button type="button" class="btn-secondary" data-edit-trip="${t.id}" style="width:auto; padding:8px 12px;">Modifier</button>
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
  listEl.querySelectorAll('[data-edit-trip]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const trips = typeof camtravelGetAgencyTrips === 'function' ? await camtravelGetAgencyTrips(currentAgency.id) : [];
      const trip = trips.find(x => x.id === btn.dataset.editTrip);
      if (!trip) return;
      openEditTrip(trip);
    });
  });
}

function openEditTrip(trip) {
  const modal = document.getElementById('editTripModal');
  if (!modal) return;
  document.getElementById('editTripId').value = trip.id;
  if (typeof camtravelCities !== 'undefined') {
    camtravelCities.fillSelect(document.getElementById('editFrom'), trip.from);
    camtravelCities.fillSelect(document.getElementById('editTo'), trip.to);
  } else {
    document.getElementById('editFrom').value = trip.from;
    document.getElementById('editTo').value = trip.to;
  }
  document.getElementById('editDep').value = trip.dep || '';
  document.getElementById('editArr').value = trip.arr || '';
  document.getElementById('editDuration').value = trip.duration || '';
  document.getElementById('editPrice').value = trip.price || '';
  document.getElementById('editSeats').value = trip.seatCount || 40;
  document.getElementById('editTags').value = Array.isArray(trip.tags) ? trip.tags.join(', ') : (trip.tags || '');
  modal.style.display = 'flex';
}


async function renderBookings() {
  const bookings = typeof camtravelGetAgencyReservations === 'function' ? await camtravelGetAgencyReservations(currentAgency.id) : [];
  const trips = typeof camtravelGetAgencyTrips === 'function' ? await camtravelGetAgencyTrips(currentAgency.id) : [];
  const revenue = bookings.reduce((s, b) => s + Number(b.total || 0), 0);
  const avg = bookings.length ? Math.round(revenue / bookings.length) : 0;
  const activeTrips = trips.filter(t => t.active !== false).length;
  const occupancy = trips.length ? Math.min(100, Math.round((bookings.length / trips.reduce((sum, t) => sum + (Number(t.seatCount) || 0), 0)) * 100)) : 0;
  const performance = bookings.length ? Math.min(100, Math.round((bookings.filter(b => Number(b.total || 0) > 0).length / bookings.length) * 100)) : 0;

  document.getElementById('statBookings').textContent = bookings.length;
  document.getElementById('statRevenue').textContent = `${revenue.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('agencyOccupancy').textContent = `${occupancy}%`;
  document.getElementById('agencyAverage').textContent = `${avg.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('agencyActiveTrips').textContent = activeTrips;
  document.getElementById('agencyPerformance').textContent = `${performance}%`;

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

const resetAgencyStatsBtn = document.getElementById('resetAgencyStatsBtn');
if (resetAgencyStatsBtn) {
  resetAgencyStatsBtn.addEventListener('click', () => {
    const confirmed = window.confirm('Voulez-vous vraiment réinitialiser les statistiques locales de votre agence ?');
    if (!confirmed) return;

    resetAgencyStatsBtn.disabled = true;
    resetAgencyStatsBtn.textContent = 'Réinitialisation...';

    const ok = typeof camtravelResetLocalStats === 'function' ? camtravelResetLocalStats('agency') : false;
    if (ok) {
      window.location.reload();
    } else {
      resetAgencyStatsBtn.disabled = false;
      resetAgencyStatsBtn.textContent = 'Réinitialiser';
      alert('La réinitialisation a échoué.');
    }
  });
}

document.getElementById('tripForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const trip = {
    agencyId: currentAgency.id,
    company: currentAgency.name || '',
    from: document.getElementById('tFrom').value,
    to: document.getElementById('tTo').value,
    dep: document.getElementById('tDep').value.trim(),
    arr: document.getElementById('tArr').value.trim(),
    duration: document.getElementById('tDuration').value.trim(),
    price: Number(document.getElementById('tPrice').value) || 0,
    seatCount: Number(document.getElementById('tSeats').value) || 40,
    tags: document.getElementById('tTags').value.trim() || 'Climatisé',
    vehicleId: document.getElementById('tVehicle')?.value || '',
    busName: document.getElementById('tVehicle')?.selectedOptions[0]?.dataset?.name || '',
    matricule: document.getElementById('tVehicle')?.selectedOptions[0]?.dataset?.mat || '',
    layoutId: document.getElementById('tVehicle')?.selectedOptions[0]?.dataset?.layout || '',
    vip: document.getElementById('tVehicle')?.selectedOptions[0]?.dataset?.vip === '1'
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


// Statistiques mensuelles agence + compteur équipe
(async function agencyMonthly() {
  if (typeof camtravelMonthlyStats === 'undefined') return;
  let bookings = [];
  if (typeof currentAgency !== 'undefined' && currentAgency && typeof camtravelGetAgencyReservations === 'function') {
    bookings = await camtravelGetAgencyReservations(currentAgency.id) || [];
  } else if (typeof camtravelGetReservations === 'function') {
    bookings = await camtravelGetReservations() || [];
  }
  const el = document.getElementById('monthlyChartAgency');
  if (el) {
    const counts = camtravelMonthlyStats.aggregateByMonth(bookings, 6);
    const rev = camtravelMonthlyStats.aggregateByMonth(bookings, 6, r => Number(r.total || 0));
    const revK = rev.map(s => ({ ...s, value: Math.round(s.value / 1000) }));
    camtravelMonthlyStats.renderDualChart(el, counts, revK, {
      labelA: 'Réservations',
      labelB: 'CA (k FCFA)',
      colorA: '#7c3aed',
      colorB: '#f5921b',
      height: 170
    });
  }
  if (typeof camtravelStaff !== 'undefined' && typeof currentAgency !== 'undefined' && currentAgency) {
    const c = camtravelStaff.countByRole(currentAgency.id);
    const st = document.getElementById('statStaff');
    if (st) st.textContent = c.total;
    const st2 = document.getElementById('statTeam');
    if (st2) st2.textContent = c.total;
  }
})();


// Remplir les listes de villes Cameroun + édition
(function setupCitiesAndEdit() {
  if (typeof camtravelCities !== 'undefined') {
    camtravelCities.fillSelect(document.getElementById('tFrom'));
    camtravelCities.fillSelect(document.getElementById('tTo'));
    const suggest = () => {
      const from = document.getElementById('tFrom')?.value;
      const to = document.getElementById('tTo')?.value;
      const priceEl = document.getElementById('tPrice');
      if (from && to && priceEl && !priceEl.dataset.touched) {
        priceEl.value = camtravelCities.suggestedPrice(from, to);
      }
    };
    document.getElementById('tFrom')?.addEventListener('change', suggest);
    document.getElementById('tTo')?.addEventListener('change', suggest);
    document.getElementById('tPrice')?.addEventListener('input', function () {
      this.dataset.touched = '1';
    });
  }

  const modal = document.getElementById('editTripModal');
  document.getElementById('editTripCancel')?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });
  document.getElementById('editTripSave')?.addEventListener('click', async () => {
    if (!currentAgency) return;
    const id = document.getElementById('editTripId').value;
    const from = document.getElementById('editFrom').value;
    const to = document.getElementById('editTo').value;
    if (!from || !to) {
      banner.className = 'status-banner show error';
      banner.textContent = 'Villes obligatoires.';
      return;
    }
    const trip = {
      id,
      agencyId: currentAgency.id,
      company: currentAgency.name,
      from, to,
      dep: document.getElementById('editDep').value.trim(),
      arr: document.getElementById('editArr').value.trim(),
      duration: document.getElementById('editDuration').value.trim(),
      price: Number(document.getElementById('editPrice').value) || 0,
      seatCount: Number(document.getElementById('editSeats').value) || 40,
      tags: document.getElementById('editTags').value.trim()
    };
    const result = await camtravelSaveTrip(trip);
    if (result.ok) {
      if (modal) modal.style.display = 'none';
      banner.className = 'status-banner show success';
      banner.textContent = 'Trajet mis à jour (destination, prix, horaires).';
      renderTrips();
    } else {
      banner.className = 'status-banner show error';
      banner.textContent = 'Échec de la mise à jour.';
    }
  });
})();


// Charger la liste des bus de l'agence dans le formulaire trajet
(async function fillVehicleSelect() {
  function fill() {
    const sel = document.getElementById('tVehicle');
    if (!sel || typeof camtravelVehicles === 'undefined' || !currentAgency) return;
    const buses = camtravelVehicles.list({ agencyId: currentAgency.id, activeOnly: true });
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Choisir un bus (optionnel) —</option>' +
      buses.map(v => `<option value="${v.id}" data-seats="${v.seatCount}" data-vip="${v.vip ? 1 : 0}" data-layout="${v.layoutId}" data-name="${v.name}" data-mat="${v.matricule}">${v.name} · ${v.matricule} · ${v.seatCount} pl.${v.vip ? ' · VIP' : ''}</option>`).join('');
    if (cur) sel.value = cur;
  }
  // attendre currentAgency
  const wait = setInterval(() => {
    if (currentAgency) { clearInterval(wait); fill(); }
  }, 100);
  setTimeout(() => clearInterval(wait), 5000);

  document.getElementById('tVehicle')?.addEventListener('change', function () {
    const opt = this.selectedOptions[0];
    if (!opt || !opt.value) return;
    const seats = opt.dataset.seats;
    if (seats && document.getElementById('tSeats')) {
      document.getElementById('tSeats').value = seats;
    }
    // VIP tag
    const tags = document.getElementById('tTags');
    if (tags && opt.dataset.vip === '1' && !/VIP/i.test(tags.value)) {
      tags.value = (tags.value ? tags.value + ', ' : '') + 'VIP';
    }
  });
})();


// Contexte agence : agency_id + filtre lieux (même base, droits limités)
(async function agencyContext() {
  function waitAgency() {
    return new Promise(resolve => {
      const t = setInterval(() => {
        if (currentAgency) { clearInterval(t); resolve(currentAgency); }
      }, 50);
      setTimeout(() => { clearInterval(t); resolve(currentAgency); }, 3000);
    });
  }
  const agency = await waitAgency();
  if (!agency) return;

  const idLine = document.getElementById('agencyIdLine');
  if (idLine) {
    idLine.innerHTML = `<strong>${agency.name}</strong> · id <code>${agency.id}</code> · rôle <code>${agency.role || 'agence_admin'}</code>`;
  }

  const sel = document.getElementById('locationFilter');
  if (sel && typeof camtravelLocations !== 'undefined') {
    const locs = camtravelLocations.list({ agencyId: agency.id, activeOnly: true });
    const cur = camtravelLocations.getFilter();
    sel.innerHTML = '<option value="">Tous les lieux du réseau</option>' +
      locs.map(l => `<option value="${l.id}" ${l.id === cur ? 'selected' : ''}>${l.city} — ${l.name}</option>`).join('');
    sel.addEventListener('change', () => {
      camtravelLocations.setFilter(sel.value);
      if (typeof renderTrips === 'function') renderTrips();
      if (typeof renderBookings === 'function') renderBookings();
    });
  }
})();
