const DEMO_PAYMENTS = [
  { ref: 'YA001', from: 'Yaoundé', to: 'Douala', date: '2024-06-26', total: 12500, methodLabel: 'Mobile Money' },
  { ref: 'YA002', from: 'Douala', to: 'Bafoussam', date: '2024-06-10', total: 10000, methodLabel: 'Carte bancaire' },
  { ref: 'YA003', from: 'Bertoua', to: 'Yaoundé', date: '2024-06-12', total: 15000, methodLabel: 'Paiement à bord' },
];

function formatDateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

(async function init() {
  const real = typeof camtravelGetReservations === 'function' ? await camtravelGetReservations() : [];
  const all = [...real, ...DEMO_PAYMENTS];

  const total = all.reduce((sum, r) => sum + Number(r.total || r.price || 0), 0);
  document.getElementById('totalSpent').textContent = `${total.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('totalCount').textContent = all.length;

  const container = document.getElementById('paymentsList');
  if (all.length === 0) {
    container.innerHTML = `<div class="empty-state">Aucun paiement pour l'instant.</div>`;
    return;
  }

  container.innerHTML = all.map(r => `
    <div class="trip-row">
      <div>
        <div class="trip-ref">${r.ref}</div>
        <div class="trip-route">${r.from} → ${r.to}</div>
        <div class="trip-meta">${formatDateFr(r.date)} · ${r.methodLabel || 'Méthode non précisée'}</div>
      </div>
      <div class="trip-price">${Number(r.total || r.price || 0).toLocaleString('fr-FR')} FCFA</div>
    </div>
  `).join('');
})();
