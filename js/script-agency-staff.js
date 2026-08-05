(async function () {
  const banner = document.getElementById('statusBanner');
  let agency = null;
  if (typeof camtravelGetMyAgency === 'function') {
    agency = await camtravelGetMyAgency();
  }
  // Fallback local agency id for demo
  if (!agency) {
    agency = { id: 'ag-local', name: 'Mon agence' };
  }

  function show(msg, ok) {
    if (!banner) return;
    banner.className = 'status-banner show ' + (ok ? 'success' : 'error');
    banner.textContent = msg;
    setTimeout(() => banner.classList.remove('show'), 2500);
  }

  function refreshStats() {
    const c = camtravelStaff.countByRole(agency.id);
    const el = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
    el('stTotal', c.total);
    el('stChef', c.chef_agence);
    el('stCaissier', c.caissier);
    el('stHotesse', c.hotesse);
    el('stChauffeur', c.chauffeur);
  }

  function render() {
    const filter = document.getElementById('filterRole').value;
    let rows = camtravelStaff.list({ agencyId: agency.id });
    if (filter) rows = rows.filter(s => s.role === filter);
    const list = document.getElementById('staffList');
    if (!rows.length) {
      list.innerHTML = '<div class="empty-state">Aucun membre. Ajoutez chef d\'agence, caissier, hôtesse ou chauffeur.</div>';
      refreshStats();
      return;
    }
    list.innerHTML = rows.map(s => {
      const role = camtravelStaff.ROLES[s.role] || { label: s.role, color: '#666' };
      return `
      <div class="admin-trip-row staff-row ${s.active === false ? 'staff-inactive' : ''}">
        <div>
          <div class="trip-ref">${s.nom}
            <span class="role-badge" style="background:${role.color}">${role.label}</span>
            ${s.active === false ? '<span class="status-pill past">Inactif</span>' : ''}
          </div>
          <div class="trip-route">${s.tel || ''}${s.email ? ' · ' + s.email : ''}</div>
          <div class="trip-meta">${s.permis ? 'Permis : ' + s.permis : ''}${s.createdAt ? ' · Ajouté le ' + new Date(s.createdAt).toLocaleDateString('fr-FR') : ''}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn-secondary" data-toggle="${s.id}" style="width:auto;padding:8px 12px;">${s.active === false ? 'Activer' : 'Désactiver'}</button>
          <button type="button" class="btn-secondary" data-del="${s.id}" style="width:auto;padding:8px 12px;color:#b91c1c;">Retirer</button>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.onclick = () => { camtravelStaff.toggleActive(btn.dataset.toggle); render(); };
    });
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Retirer ce membre de l\'équipe ?')) return;
        camtravelStaff.remove(btn.dataset.del);
        render();
        show('Membre retiré.', true);
      };
    });
    refreshStats();
  }

  document.getElementById('staffForm').onsubmit = (e) => {
    e.preventDefault();
    const res = camtravelStaff.add({
      nom: document.getElementById('sNom').value,
      tel: document.getElementById('sTel').value,
      email: document.getElementById('sEmail').value,
      role: document.getElementById('sRole').value,
      permis: document.getElementById('sPermis').value,
      agencyId: agency.id,
      agencyName: agency.name || agency.nom || ''
    });
    if (!res.ok) { show('Nom obligatoire.', false); return; }
    e.target.reset();
    render();
    show('Membre ajouté à l\'équipe.', true);
  };

  document.getElementById('filterRole').onchange = render;
  render();
})();
