(async function () {
  const banner = document.getElementById('statusBanner');
  let agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
  if (!agency) agency = { id: 'ag-local', name: 'Mon agence' };

  function show(msg, ok) {
    if (!banner) return;
    banner.className = 'status-banner show ' + (ok ? 'success' : 'error');
    banner.textContent = msg;
    setTimeout(() => banner.classList.remove('show'), 2500);
  }

  // Fill layout select
  const layoutSel = document.getElementById('vLayout');
  layoutSel.innerHTML = Object.values(camtravelVehicles.LAYOUTS).map(l =>
    `<option value="${l.id}">${l.label}${l.vip ? ' · VIP' : ''}</option>`
  ).join('');

  function updateHint() {
    const l = camtravelVehicles.LAYOUTS[layoutSel.value];
    document.getElementById('layoutHint').textContent = l
      ? `${l.seatCount} places · ${l.vip ? 'Confort VIP' : 'Standard'} · plan 2+2 ou 2+1 selon modèle`
      : '';
  }
  layoutSel.addEventListener('change', updateHint);
  updateHint();

  function renderPreview(vehicle) {
    const host = document.getElementById('previewMap');
    if (!host || !vehicle) { if (host) host.innerHTML = ''; return; }
    const layout = camtravelVehicles.getLayout(vehicle);
    let html = `<div class="bus-front">🚗 Conducteur</div>`;
    layout.rows.forEach((row, idx) => {
      html += `<div class="seat-row bus-row">`;
      row.forEach(cell => {
        if (cell === null) html += `<div class="seat-aisle" title="Couloir"></div>`;
        else html += `<div class="seat available preview-seat" title="${cell}">${cell}</div>`;
      });
      html += `</div>`;
    });
    html += `<div class="bus-legend"><span class="seat available" style="width:28px;height:28px;font-size:10px;"></span> Libre</div>`;
    host.innerHTML = html;
  }

  function render() {
    const rows = camtravelVehicles.list({ agencyId: agency.id });
    document.getElementById('stBuses').textContent = rows.length;
    document.getElementById('stVip').textContent = rows.filter(v => v.vip).length;
    document.getElementById('stStd').textContent = rows.filter(v => !v.vip).length;
    document.getElementById('stSeats').textContent = rows.reduce((s, v) => s + (v.seatCount || 0), 0);

    const list = document.getElementById('vehList');
    if (!rows.length) {
      list.innerHTML = '<div class="empty-state">Aucun bus. Ajoutez nom, matricule et configuration de places.</div>';
      return;
    }
    list.innerHTML = rows.map(v => {
      const layout = camtravelVehicles.LAYOUTS[v.layoutId];
      return `
      <div class="admin-trip-row">
        <div>
          <div class="trip-ref">${v.name}
            ${v.vip ? '<span class="role-badge" style="background:#7c3aed">VIP</span>' : '<span class="role-badge" style="background:#0b5c3d">Standard</span>'}
          </div>
          <div class="trip-route">Matricule : <strong>${v.matricule}</strong></div>
          <div class="trip-meta">${v.seatCount} places · ${layout ? layout.label : v.layoutId}${v.notes ? ' · ' + v.notes : ''}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn-secondary" data-preview="${v.id}" style="width:auto;padding:8px 12px;">Plan sièges</button>
          <button type="button" class="btn-secondary" data-del="${v.id}" style="width:auto;padding:8px 12px;color:#b91c1c;">Retirer</button>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-preview]').forEach(btn => {
      btn.onclick = () => {
        const v = camtravelVehicles.get(btn.dataset.preview);
        renderPreview(v);
        document.getElementById('previewMap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
    });
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Retirer ce bus de la flotte ?')) return;
        camtravelVehicles.remove(btn.dataset.del);
        render();
        show('Bus retiré.', true);
      };
    });
  }

  document.getElementById('vehForm').onsubmit = (e) => {
    e.preventDefault();
    const res = camtravelVehicles.add({
      name: document.getElementById('vName').value,
      matricule: document.getElementById('vMatricule').value,
      layoutId: document.getElementById('vLayout').value,
      notes: document.getElementById('vNotes').value,
      agencyId: agency.id,
      agencyName: agency.name || ''
    });
    if (!res.ok) {
      show(res.reason === 'matricule' ? 'Matricule obligatoire.' : 'Nom du bus obligatoire.', false);
      return;
    }
    e.target.reset();
    updateHint();
    render();
    renderPreview(res.entry);
    show('Bus ajouté à la flotte.', true);
  };

  render();
})();
