function formatDateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

let paymentsCache = [];
const banner = document.getElementById('statusBanner');

function renderPayments() {
  const total = paymentsCache.reduce((sum, r) => sum + Number(r.total || r.price || 0), 0);
  document.getElementById('totalSpent').textContent = `${total.toLocaleString('fr-FR')} FCFA`;
  document.getElementById('totalCount').textContent = paymentsCache.length;

  const container = document.getElementById('paymentsList');
  if (paymentsCache.length === 0) {
    container.innerHTML = `<div class="empty-state">Aucun paiement pour l'instant.</div>`;
    return;
  }

  container.innerHTML = paymentsCache.map(r => `
    <div class="trip-row">
      <div>
        <div class="trip-ref">${r.ref}</div>
        <div class="trip-route">${r.from} → ${r.to}</div>
        <div class="trip-meta">${formatDateFr(r.date)} · ${r.methodLabel || 'Méthode non précisée'}</div>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="trip-price">${Number(r.total || r.price || 0).toLocaleString('fr-FR')} FCFA</div>
        <button type="button" class="trip-delete-btn" data-id="${r.id}" title="Supprimer ce paiement de l'historique">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.trip-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (!confirm('Supprimer ce paiement de votre historique ? Cette action est irréversible.')) return;
      btn.disabled = true;
      const ok = typeof camtravelDeleteReservation === 'function' ? await camtravelDeleteReservation(id) : false;
      if (ok) {
        paymentsCache = paymentsCache.filter(r => r.id !== id);
        renderPayments();
      } else {
        btn.disabled = false;
        banner.className = 'status-banner show error';
        banner.textContent = "Impossible de supprimer ce paiement pour le moment. Réessayez.";
      }
    });
  });
}

(async function init() {
  paymentsCache = typeof camtravelGetReservations === 'function'
    ? await camtravelGetReservations({ onlyMine: true })
    : [];
  renderPayments();
})();
