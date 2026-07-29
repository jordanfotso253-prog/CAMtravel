(async function init() {
  const report = typeof camtravelGetCommissionsReport === 'function' ? await camtravelGetCommissionsReport() : [];

  const totalRevenue = report.reduce((s, a) => s + a.revenue, 0);
  const totalCommission = report.reduce((s, a) => s + a.commission, 0);
  const totalNet = report.reduce((s, a) => s + a.net, 0);

  document.getElementById('totalRevenue').textContent = `${totalRevenue.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('totalCommission').textContent = `${totalCommission.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('totalNet').textContent = `${totalNet.toLocaleString('fr-FR')} FCFA`;

  const listEl = document.getElementById('commissionsList');
  if (report.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Aucune donnée pour l'instant.</div>`;
    return;
  }

  listEl.innerHTML = report.map(a => `
    <div class="admin-trip-row">
      <div>
        <div class="trip-ref">${a.name}</div>
        <div class="trip-meta">${a.commissionPercent}% de commission · ${a.status === 'active' ? 'Active' : 'Suspendue'}</div>
      </div>
      <div style="text-align:right;">
        <div class="trip-price">${a.revenue.toLocaleString('fr-FR')} FCFA vendus</div>
        <div class="trip-meta">Commission : ${a.commission.toLocaleString('fr-FR')} FCFA · Reversé : ${a.net.toLocaleString('fr-FR')} FCFA</div>
      </div>
    </div>
  `).join('');
})();
