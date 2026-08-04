function formatDateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const banner = document.getElementById('statusBanner');
let currentAgency = null;
let agencyTripsCache = [];
const deskSelectedSeats = new Set();

const METHOD_LABELS = {
  especes: 'Espèces (guichet)',
  'mobile-money': 'Mobile Money',
  carte: 'Carte bancaire'
};

function showBanner(type, text) {
  banner.className = 'status-banner show ' + type;
  banner.textContent = text;
}

function updatePendingUI() {
  const n = typeof camtravelGetPendingReservationsCount === 'function'
    ? camtravelGetPendingReservationsCount()
    : 0;
  const badge = document.getElementById('pendingBadge');
  const syncBtn = document.getElementById('syncPendingBtn');
  const statPending = document.getElementById('statPending');
  if (statPending) statPending.textContent = n;
  if (badge) {
    badge.style.display = n > 0 ? 'inline-flex' : 'none';
    const countEl = document.getElementById('pendingCount');
    if (countEl) countEl.textContent = n;
  }
  if (syncBtn) syncBtn.style.display = n > 0 ? 'inline-block' : 'none';
}

async function renderTrips() {
  const trips = typeof camtravelGetAgencyTrips === 'function'
    ? await camtravelGetAgencyTrips(currentAgency.id)
    : [];
  agencyTripsCache = trips;
  document.getElementById('statTrips').textContent = trips.length;

  const listEl = document.getElementById('tripsList');
  listEl.innerHTML = trips.length === 0
    ? `<div class="empty-state">Aucun trajet pour l'instant. Ajoutez-en un ci-dessus.</div>`
    : trips.map(t => {
        const quota = t.agencyQuota != null ? t.agencyQuota : 10;
        const webLimit = typeof camtravelWebSeatLimit === 'function'
          ? camtravelWebSeatLimit(t)
          : Math.max(0, (t.seatCount || 40) - quota);
        return `
      <div class="admin-trip-row" data-trip-row="${t.id}">
        <div>
          <div class="trip-route">${t.from} → ${t.to}</div>
          <div class="trip-meta">${t.dep} → ${t.arr} ${t.duration ? '· ' + t.duration : ''} · ${Number(t.price).toLocaleString('fr-FR')} FCFA · ${t.seatCount} places (web ${webLimit} · guichet ${quota})</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="status-pill ${t.active ? 'upcoming' : 'past'}">${t.active ? 'Actif' : 'Désactivé'}</span>
          <button type="button" class="btn-secondary" data-toggle-trip="${t.id}" data-current="${t.active}" style="width:auto; padding:8px 12px;">${t.active ? 'Désactiver' : 'Activer'}</button>
          <button type="button" class="trip-delete-btn" data-delete-trip="${t.id}" title="Supprimer le trajet">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
          </button>
        </div>
      </div>`;
      }).join('');

  listEl.querySelectorAll('[data-toggle-trip]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const newActive = btn.dataset.current !== 'true';
      const ok = typeof camtravelUpdateTripActive === 'function'
        ? await camtravelUpdateTripActive(btn.dataset.toggleTrip, newActive)
        : false;
      if (ok) renderTrips(); else btn.disabled = false;
    });
  });
  listEl.querySelectorAll('[data-delete-trip]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer définitivement ce trajet ?')) return;
      btn.disabled = true;
      const ok = typeof camtravelDeleteTrip === 'function'
        ? await camtravelDeleteTrip(btn.dataset.deleteTrip)
        : false;
      if (ok) {
        await renderTrips();
        fillDeskTripSelect();
      } else btn.disabled = false;
    });
  });

  fillDeskTripSelect();
}

function fillDeskTripSelect() {
  const sel = document.getElementById('dTrip');
  if (!sel) return;
  const prev = sel.value;
  const active = agencyTripsCache.filter(t => t.active !== false);
  sel.innerHTML = '<option value="">Choisir un trajet</option>' + active.map(t => {
    const quota = t.agencyQuota != null ? t.agencyQuota : 10;
    return `<option value="${t.id}" data-price="${t.price}" data-seats="${t.seatCount || 40}" data-quota="${quota}" data-from="${t.from}" data-to="${t.to}" data-dep="${t.dep}" data-company="${t.company || currentAgency.name}">${t.from} → ${t.to} · ${t.dep} · ${Number(t.price).toLocaleString('fr-FR')} FCFA</option>`;
  }).join('');
  if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
}

async function renderBookings() {
  const bookings = typeof camtravelGetAgencyReservations === 'function'
    ? await camtravelGetAgencyReservations(currentAgency.id)
    : [];
  document.getElementById('statBookings').textContent = bookings.length;
  const revenue = bookings.reduce((s, b) => s + Number(b.total || 0), 0);
  document.getElementById('statRevenue').textContent = `${revenue.toLocaleString('fr-FR')} FCFA`;

  const listEl = document.getElementById('bookingsList');
  listEl.innerHTML = bookings.length === 0
    ? `<div class="empty-state">Aucune réservation pour l'instant.</div>`
    : bookings.slice(0, 40).map(b => {
        const pending = b.pending || (b.source === 'agency' && !b.syncedAt && b.clientLocalId);
        const src = b.source === 'agency' ? 'Guichet' : 'Web';
        return `
      <div class="admin-trip-row">
        <div>
          <div class="trip-ref">${b.ref || '—'} ${pending ? '<span class="status-pill past">En attente sync</span>' : ''} <span class="status-pill ${b.source === 'agency' ? 'upcoming' : 'past'}">${src}</span></div>
          <div class="trip-route">${b.from} → ${b.to}</div>
          <div class="trip-meta">${formatDateFr(b.date)} · ${b.passagerNom || ''} · ${b.passagerTel || ''} ${b.seatNumbers ? '· sièges ' + b.seatNumbers : ''}</div>
        </div>
        <div class="trip-price">${Number(b.total || 0).toLocaleString('fr-FR')} FCFA</div>
      </div>`;
      }).join('');
}

async function refreshDeskSeatMap() {
  const tripId = document.getElementById('dTrip').value;
  const date = document.getElementById('dDate').value;
  const mapEl = document.getElementById('dSeatMap');
  const hint = document.getElementById('dSeatHint');
  deskSelectedSeats.clear();
  document.getElementById('dSeats').value = '';

  if (!tripId || !date) {
    mapEl.innerHTML = '';
    hint.textContent = 'Choisissez un trajet et une date pour voir les sièges disponibles.';
    return;
  }

  const trip = agencyTripsCache.find(t => t.id === tripId);
  if (!trip) return;

  const seatCount = trip.seatCount || 40;
  const quota = trip.agencyQuota != null ? trip.agencyQuota : 10;
  const webLimit = typeof camtravelWebSeatLimit === 'function'
    ? camtravelWebSeatLimit(trip)
    : Math.max(0, seatCount - quota);

  hint.textContent = `Sièges 1–${webLimit} : web + guichet · Sièges ${webLimit + 1}–${seatCount} : réservés au guichet. Cliquez pour sélectionner.`;

  const occupied = typeof camtravelGetOccupiedSeatsIncludingPending === 'function'
    ? await camtravelGetOccupiedSeatsIncludingPending(tripId, date)
    : (typeof camtravelGetOccupiedSeats === 'function' ? await camtravelGetOccupiedSeats(tripId, date) : []);

  mapEl.innerHTML = '';
  const rows = Math.ceil(seatCount / 4);
  let seatNum = 1;
  for (let r = 0; r < rows; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row';
    for (let side = 0; side < 2; side++) {
      for (let col = 0; col < 2; col++) {
        if (seatNum > seatCount) break;
        const num = seatNum++;
        const isAgencyOnly = num > webLimit;
        const isOcc = occupied.includes(num);
        const seatEl = document.createElement('button');
        seatEl.type = 'button';
        seatEl.className = 'seat ' + (isOcc ? 'occupied' : 'available');
        if (isAgencyOnly && !isOcc) seatEl.style.outline = '2px solid var(--orange)';
        seatEl.textContent = num;
        seatEl.disabled = isOcc;
        seatEl.title = isOcc ? 'Occupé' : (isAgencyOnly ? 'Réservé guichet' : 'Libre');
        seatEl.addEventListener('click', () => {
          if (deskSelectedSeats.has(num)) {
            deskSelectedSeats.delete(num);
            seatEl.classList.remove('selected');
            seatEl.classList.add('available');
          } else {
            deskSelectedSeats.add(num);
            seatEl.classList.add('selected');
            seatEl.classList.remove('available');
          }
          document.getElementById('dSeats').value = Array.from(deskSelectedSeats).sort((a, b) => a - b).join(',');
        });
        rowEl.appendChild(seatEl);
      }
      if (side === 0) {
        const gap = document.createElement('div');
        gap.className = 'seat-aisle-gap';
        rowEl.appendChild(gap);
      }
    }
    mapEl.appendChild(rowEl);
  }
}

document.getElementById('tripForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const seatCount = Number(document.getElementById('tSeats').value) || 40;
  let agencyQuota = Number(document.getElementById('tQuota').value);
  if (isNaN(agencyQuota) || agencyQuota < 0) agencyQuota = 10;
  if (agencyQuota > seatCount) agencyQuota = seatCount;

  const trip = {
    agencyId: currentAgency.id,
    from: document.getElementById('tFrom').value,
    to: document.getElementById('tTo').value,
    dep: document.getElementById('tDep').value.trim(),
    arr: document.getElementById('tArr').value.trim(),
    duration: document.getElementById('tDuration').value.trim(),
    price: Number(document.getElementById('tPrice').value) || 0,
    seatCount,
    agencyQuota,
    tags: document.getElementById('tTags').value.trim() || 'Climatisé'
  };

  if (!trip.from || !trip.to) {
    submitBtn.disabled = false;
    showBanner('error', "Choisissez une ville de départ et d'arrivée.");
    return;
  }

  const result = typeof camtravelSaveTrip === 'function' ? await camtravelSaveTrip(trip) : { ok: false };
  submitBtn.disabled = false;

  if (result.ok) {
    showBanner('success', 'Trajet ajouté.');
    e.target.reset();
    document.getElementById('tSeats').value = 40;
    document.getElementById('tQuota').value = 10;
    await renderTrips();
  } else {
    showBanner('error', "Impossible d'ajouter le trajet pour le moment.");
  }
});

document.getElementById('dTrip').addEventListener('change', refreshDeskSeatMap);
document.getElementById('dDate').addEventListener('change', refreshDeskSeatMap);

document.getElementById('deskSaleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const tripId = document.getElementById('dTrip').value;
  const date = document.getElementById('dDate').value;
  const nom = document.getElementById('dNom').value.trim();
  const tel = document.getElementById('dTel').value.trim().replace(/\s+/g, '');
  const seatsRaw = document.getElementById('dSeats').value.trim();
  const method = document.getElementById('dMethod').value;

  const opt = document.getElementById('dTrip').selectedOptions[0];
  if (!tripId || !date || !nom || !tel || !opt) {
    submitBtn.disabled = false;
    showBanner('error', 'Remplissez trajet, date, nom et téléphone.');
    return;
  }

  const price = Number(opt.dataset.price) || 0;
  const seatNumbers = seatsRaw || null;
  const passagers = seatNumbers
    ? seatNumbers.split(',').map(s => s.trim()).filter(Boolean).length || 1
    : 1;
  const total = price * passagers;
  const ref = 'AG' + Math.floor(100000 + Math.random() * 900000);

  const reservation = {
    source: 'agency',
    soldByAgencyId: currentAgency.id,
    ref,
    company: opt.dataset.company || currentAgency.name,
    from: opt.dataset.from,
    to: opt.dataset.to,
    date,
    dep: opt.dataset.dep,
    price,
    passagers,
    total,
    passagerNom: nom,
    passagerTel: tel,
    method,
    methodLabel: METHOD_LABELS[method] || method,
    tripId,
    seatNumbers
  };

  const result = typeof camtravelSaveReservation === 'function'
    ? await camtravelSaveReservation(reservation)
    : { ok: false };

  submitBtn.disabled = false;

  if (result.ok) {
    const msg = result.mode === 'pending'
      ? `Vente ${ref} enregistrée hors ligne — sera synchronisée dès le retour du réseau.`
      : `Vente ${ref} enregistrée et synchronisée.`;
    showBanner('success', msg);
    e.target.reset();
    deskSelectedSeats.clear();
    document.getElementById('dSeatMap').innerHTML = '';
    document.getElementById('dSeatHint').textContent = '';
    updatePendingUI();
    await renderBookings();
  } else {
    showBanner('error', "Impossible d'enregistrer la vente.");
  }
});

document.getElementById('syncPendingBtn').addEventListener('click', async () => {
  const btn = document.getElementById('syncPendingBtn');
  btn.disabled = true;
  btn.textContent = 'Synchronisation…';
  const result = typeof camtravelFlushPendingReservations === 'function'
    ? await camtravelFlushPendingReservations()
    : { ok: false, synced: 0, remaining: 0 };
  btn.disabled = false;
  btn.textContent = 'Synchroniser';
  updatePendingUI();
  if (result.synced > 0) {
    showBanner('success', `${result.synced} vente(s) synchronisée(s).${result.remaining ? ' ' + result.remaining + ' encore en attente.' : ''}`);
    await renderBookings();
  } else if (result.remaining > 0) {
    showBanner('error', result.errors && result.errors[0] === 'offline'
      ? 'Toujours hors ligne — réessayez quand le réseau revient.'
      : 'Synchronisation impossible pour le moment. Réessayez.');
  } else {
    showBanner('success', 'Rien à synchroniser.');
  }
});

window.addEventListener('camtravel:pending-synced', () => {
  updatePendingUI();
  renderBookings();
});

(async function init() {
  currentAgency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
  if (!currentAgency) return;

  document.getElementById('agencyGreeting').textContent = `Bonjour, ${currentAgency.name}`;
  document.getElementById('agencyStatusLine').textContent =
    `Commission : ${currentAgency.commission_percent}% · Statut : ${currentAgency.status === 'active' ? 'Active' : 'Suspendue'}`;

  // Date du jour par défaut pour la vente guichet
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('dDate').value = `${yyyy}-${mm}-${dd}`;

  updatePendingUI();
  await renderTrips();
  await renderBookings();

  // Tentative de sync au chargement
  if (typeof camtravelFlushPendingReservations === 'function') {
    camtravelFlushPendingReservations().then(() => {
      updatePendingUI();
      renderBookings();
    });
  }
})();

const ROLE_LABELS = {
  owner: 'PDG',
  regional_manager: 'Resp. ville',
  counter_manager: 'Resp. guichet',
  cashier: 'Caissier',
  controller: 'Contrôleur'
};

let teamFilter = 'active';

async function renderTeam() {
  const listEl = document.getElementById('teamList');
  if (!listEl || !currentAgency) return;
  const members = typeof camtravelGetAgencyMembers === 'function'
    ? await camtravelGetAgencyMembers(currentAgency.id, { includeTerminated: teamFilter === 'all' })
    : [];
  const filtered = teamFilter === 'active'
    ? members.filter(m => m.status === 'active' || m.status === 'invited' || m.status === 'suspended')
    : members;

  listEl.innerHTML = filtered.length === 0
    ? `<div class="empty-state">Aucun membre pour l'instant.</div>`
    : filtered.map(m => {
        const statusLabel = {
          active: 'Actif', invited: 'Invité', suspended: 'Suspendu', terminated: 'Licencié'
        }[m.status] || m.status;
        const canTerminate = m.status === 'active' || m.status === 'suspended';
        return `
      <div class="admin-trip-row">
        <div>
          <div class="trip-ref">${m.email}</div>
          <div class="trip-meta">${ROLE_LABELS[m.role] || m.role} · ${statusLabel}${m.terminatedAt ? ' · sortie ' + formatDateFr(m.terminatedAt) : ''}${m.terminationReason ? ' · ' + m.terminationReason : ''}</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="status-pill ${m.status === 'active' ? 'upcoming' : 'past'}">${statusLabel}</span>
          ${canTerminate ? `<button type="button" class="btn-secondary" data-terminate="${m.id}" style="width:auto; padding:8px 12px;">Licencier</button>` : ''}
        </div>
      </div>`;
      }).join('');

  listEl.querySelectorAll('[data-terminate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const reason = prompt('Motif (layoff / resignation / end_of_contract) :', 'layoff') || 'layoff';
      const note = prompt('Note (optionnel) :') || '';
      if (!confirm('Confirmer le licenciement ? L\'accès sera coupé, l\'historique conservé.')) return;
      btn.disabled = true;
      const res = typeof camtravelTerminateMember === 'function'
        ? await camtravelTerminateMember(btn.dataset.terminate, reason, note)
        : { ok: false };
      if (res.ok) {
        showBanner('success', 'Membre licencié — accès coupé, historique conservé.');
        renderTeam();
      } else {
        btn.disabled = false;
        showBanner('error', res.reason || 'Impossible de licencier.');
      }
    });
  });
}

document.querySelectorAll('[data-team-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    teamFilter = btn.dataset.teamFilter;
    document.querySelectorAll('[data-team-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTeam();
  });
});

const teamAddForm = document.getElementById('teamAddForm');
if (teamAddForm) {
  teamAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('mEmail').value.trim();
    const role = document.getElementById('mRole').value;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const res = typeof camtravelAddAgencyMember === 'function'
      ? await camtravelAddAgencyMember(currentAgency.id, email, role)
      : { ok: false };
    btn.disabled = false;
    if (res.ok) {
      showBanner('success', 'Membre ajouté. Il doit se connecter avec cet email.');
      e.target.reset();
      renderTeam();
    } else {
      showBanner('error', res.reason || "Impossible d'ajouter le membre (exécutez le SQL mis à jour).");
    }
  });
}

async function renderBranches() {
  const listEl = document.getElementById('branchesList');
  if (!listEl || !currentAgency) return;
  const branches = typeof camtravelGetAgencyBranches === 'function'
    ? await camtravelGetAgencyBranches(currentAgency.id)
    : [];
  listEl.innerHTML = branches.length === 0
    ? `<div class="empty-state">Aucune succursale. Ajoutez Douala, Yaoundé, etc.</div>`
    : branches.map(b => `
      <div class="admin-trip-row">
        <div>
          <div class="trip-route">${b.name}</div>
          <div class="trip-meta">${b.city}${b.address ? ' · ' + b.address : ''}</div>
        </div>
        <span class="status-pill ${b.status === 'active' ? 'upcoming' : 'past'}">${b.status === 'active' ? 'Active' : b.status}</span>
      </div>
    `).join('');
}

const branchForm = document.getElementById('branchForm');
if (branchForm) {
  branchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('bName').value.trim();
    const city = document.getElementById('bCity').value.trim();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const res = typeof camtravelSaveAgencyBranch === 'function'
      ? await camtravelSaveAgencyBranch(currentAgency.id, name, city)
      : { ok: false };
    btn.disabled = false;
    if (res.ok) {
      showBanner('success', 'Succursale ajoutée.');
      e.target.reset();
      renderBranches();
    } else {
      showBanner('error', "Impossible d'ajouter la succursale (exécutez le SQL mis à jour).");
    }
  });
}

// Hook into existing init
(function extendInit() {
  const orig = window.__camtravelAgencyInitDone;
  if (orig) return;
  window.__camtravelAgencyInitDone = true;
  const wait = setInterval(() => {
    if (currentAgency) {
      clearInterval(wait);
      renderTeam();
      renderBranches();
    }
  }, 200);
  setTimeout(() => clearInterval(wait), 8000);
})();
