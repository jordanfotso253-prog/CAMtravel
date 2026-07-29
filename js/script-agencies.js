const banner = document.getElementById('statusBanner');
const listEl = document.getElementById('agenciesList');

async function renderAgencies() {
  const agencies = typeof camtravelGetAgencies === 'function' ? await camtravelGetAgencies() : [];

  if (agencies.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Aucune agence pour l'instant.</div>`;
    return;
  }

  const withCounts = await Promise.all(agencies.map(async a => {
    const trips = typeof camtravelGetAgencyTrips === 'function' ? await camtravelGetAgencyTrips(a.id) : [];
    return { ...a, tripCount: trips.length };
  }));

  listEl.innerHTML = withCounts.map(a => `
    <div class="admin-trip-row" data-agency-row="${a.id}">
      <div>
        <div class="trip-ref">${a.name}</div>
        <div class="trip-route">${a.email || 'Pas de compte lié'}</div>
        <div class="trip-meta">${a.tel || ''} ${a.ville ? '· ' + a.ville : ''} · ${a.commission_percent}% commission · ${a.tripCount} trajet${a.tripCount > 1 ? 's' : ''}</div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="status-pill ${a.status === 'active' ? 'upcoming' : 'past'}">${a.status === 'active' ? 'Active' : 'Suspendue'}</span>
        <button type="button" class="btn-secondary" data-toggle-status="${a.id}" data-current="${a.status}" style="width:auto; padding:8px 14px;">
          ${a.status === 'active' ? 'Suspendre' : 'Réactiver'}
        </button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-toggle-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newStatus = btn.dataset.current === 'active' ? 'suspended' : 'active';
      btn.disabled = true;
      const ok = typeof camtravelUpdateAgencyStatus === 'function'
        ? await camtravelUpdateAgencyStatus(btn.dataset.toggleStatus, newStatus)
        : false;
      if (ok) {
        renderAgencies();
      } else {
        btn.disabled = false;
        banner.className = 'status-banner show error';
        banner.textContent = "Impossible de mettre à jour l'agence pour le moment.";
      }
    });
  });
}

document.getElementById('agencyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  const agency = {
    name: document.getElementById('aName').value.trim(),
    email: document.getElementById('aEmail').value.trim(),
    tel: document.getElementById('aTel').value.trim(),
    ville: document.getElementById('aVille').value.trim(),
    commissionPercent: Number(document.getElementById('aCommission').value) || 0
  };

  const result = typeof camtravelSaveAgency === 'function' ? await camtravelSaveAgency(agency) : { ok: false };
  submitBtn.disabled = false;

  if (result.ok) {
    banner.className = 'status-banner show success';
    banner.textContent = 'Agence ajoutée.';
    e.target.reset();
    document.getElementById('aCommission').value = 10;
    renderAgencies();
  } else {
    banner.className = 'status-banner show error';
    banner.textContent = "Impossible d'ajouter l'agence pour le moment.";
  }
});

renderAgencies();
