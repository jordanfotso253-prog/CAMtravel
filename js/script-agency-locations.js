(async function () {
  const banner = document.getElementById('statusBanner');
  let agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
  if (!agency) agency = { id: 'ag-exp', name: 'Express Voyages' }; // fallback demo

  if (typeof camtravelCities !== 'undefined') {
    camtravelCities.fillSelect(document.getElementById('locCity'));
  }

  function show(msg, ok) {
    banner.className = 'status-banner show ' + (ok ? 'success' : 'error');
    banner.textContent = msg;
    setTimeout(() => banner.classList.remove('show'), 2500);
  }

  function render() {
    const rows = camtravelLocations.list({ agencyId: agency.id });
    document.getElementById('stLoc').textContent = rows.filter(l => l.active !== false).length;
    document.getElementById('stCities').textContent = new Set(rows.map(l => l.city)).size;

    const list = document.getElementById('locList');
    if (!rows.length) {
      list.innerHTML = '<div class="empty-state">Aucun lieu. Ajoutez vos gares (Yaoundé, Douala, etc.).</div>';
      return;
    }
    list.innerHTML = rows.map(l => `
      <div class="admin-trip-row ${l.active === false ? 'staff-inactive' : ''}">
        <div>
          <div class="trip-ref">${l.name}
            <span class="role-badge" style="background:#7c3aed">${l.city}</span>
          </div>
          <div class="trip-route">${l.address || 'Adresse non renseignée'}</div>
          <div class="trip-meta">${l.tel || 'Tél. —'}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-secondary" data-toggle="${l.id}" style="width:auto;padding:8px 12px;">${l.active === false ? 'Activer' : 'Désactiver'}</button>
          <button type="button" class="btn-secondary" data-del="${l.id}" style="width:auto;padding:8px 12px;color:#b91c1c;">Retirer</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.onclick = () => {
        const loc = camtravelLocations.get(btn.dataset.toggle);
        if (loc) camtravelLocations.update(loc.id, { active: loc.active === false });
        render();
      };
    });
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Retirer ce lieu ? Les trajets liés restent dans la base réseau.')) return;
        camtravelLocations.remove(btn.dataset.del);
        render();
        show('Lieu retiré.', true);
      };
    });
  }

  document.getElementById('locForm').onsubmit = (e) => {
    e.preventDefault();
    const res = camtravelLocations.add({
      agencyId: agency.id,
      name: document.getElementById('locName').value,
      city: document.getElementById('locCity').value,
      address: document.getElementById('locAddress').value,
      tel: document.getElementById('locTel').value
    });
    if (!res.ok) { show('Nom et ville obligatoires.', false); return; }
    e.target.reset();
    if (typeof camtravelCities !== 'undefined') camtravelCities.fillSelect(document.getElementById('locCity'));
    render();
    show('Lieu ajouté — visible sur tout le réseau.', true);
  };

  render();
})();
