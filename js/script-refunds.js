function formatDateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const banner = document.getElementById('statusBanner');
const eligibleList = document.getElementById('eligibleList');
const requestsList = document.getElementById('requestsList');

function tripLine(r) {
  return `
    <div class="trip-ref">${r.ref}</div>
    <div class="trip-route">${r.from} → ${r.to}</div>
    <div class="trip-meta">${formatDateFr(r.date)} · ${Number(r.total || r.price || 0).toLocaleString('fr-FR')} FCFA</div>
  `;
}

const refundLabels = { requested: 'Demande envoyée', approved: 'Remboursé', rejected: 'Refusée' };
const refundClasses = { requested: 'requested', approved: 'approved', rejected: 'rejected' };

function render(reservations) {
  const eligible = reservations.filter(r => !r.refundStatus && !r.used);
  const requested = reservations.filter(r => !!r.refundStatus);

  eligibleList.innerHTML = eligible.length === 0
    ? `<div class="empty-state">Aucune réservation éligible pour l'instant.</div>`
    : eligible.map(r => `
      <div class="trip-row" data-id="${r.id}">
        <div>${tripLine(r)}</div>
        <button type="button" class="btn-secondary" data-refund-id="${r.id}" style="width:auto; padding:9px 16px; white-space:nowrap;">Demander un remboursement</button>
      </div>
    `).join('');

  requestsList.innerHTML = requested.length === 0
    ? `<div class="empty-state">Aucune demande pour l'instant.</div>`
    : requested.map(r => `
      <div class="trip-row">
        <div>${tripLine(r)}</div>
        <span class="status-pill ${refundClasses[r.refundStatus] || ''}">${refundLabels[r.refundStatus] || r.refundStatus}</span>
      </div>
    `).join('');

  eligibleList.querySelectorAll('[data-refund-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const reason = prompt('Pourquoi souhaitez-vous être remboursé ? (facultatif)') || '';
      btn.disabled = true;
      btn.textContent = 'Envoi…';
      const ok = typeof camtravelRequestRefund === 'function'
        ? await camtravelRequestRefund(btn.dataset.refundId, reason)
        : false;
      if (ok) {
        banner.className = 'status-banner show success';
        banner.textContent = 'Votre demande de remboursement a été envoyée.';
        init();
      } else {
        btn.disabled = false;
        btn.textContent = 'Demander un remboursement';
        banner.className = 'status-banner show error';
        banner.textContent = "Impossible d'envoyer la demande pour le moment. Réessayez.";
      }
    });
  });
}

async function init() {
  const reservations = typeof camtravelGetReservations === 'function'
    ? await camtravelGetReservations({ onlyMine: true })
    : [];
  render(reservations);
}

init();
