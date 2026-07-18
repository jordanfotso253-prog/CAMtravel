const form = document.getElementById('verifyForm');
const resultBox = document.getElementById('resultBox');
const refInput = document.getElementById('refInput');

function formatDateFr(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function verifyRef(ref) {
  resultBox.className = 'verify-result show';
  resultBox.innerHTML = `<p style="color:var(--gray-text);">Vérification en cours...</p>`;

  const reservation = typeof camtravelFindReservationByRef === 'function'
    ? await camtravelFindReservationByRef(ref)
    : null;

  if (!reservation) {
    resultBox.className = 'verify-result show invalid';
    resultBox.innerHTML = `
      <div class="verify-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </div>
      <h3>Ticket introuvable</h3>
      <p style="color:#a44;">Aucune réservation ne correspond à la référence "${ref}". Ce ticket n'est pas valide.</p>
    `;
    return;
  }

  if (reservation.used) {
    resultBox.className = 'verify-result show used';
    resultBox.innerHTML = `
      <div class="verify-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      <h3>Ticket déjà utilisé</h3>
      <p>Ce ticket a déjà été validé le ${new Date(reservation.usedAt).toLocaleString('fr-FR')}.</p>
      <div class="verify-details">
        <strong>${reservation.from} → ${reservation.to}</strong><br>
        ${formatDateFr(reservation.date)} · ${reservation.dep || ''}<br>
        Passager : ${reservation.passagerNom || '—'}
      </div>
    `;
    return;
  }

  resultBox.className = 'verify-result show valid';
  resultBox.innerHTML = `
    <div class="verify-icon">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>
    </div>
    <h3>Ticket valide ✓</h3>
    <div class="verify-details">
      <strong>${reservation.from} → ${reservation.to}</strong><br>
      ${formatDateFr(reservation.date)} · ${reservation.dep || ''}<br>
      Passager : ${reservation.passagerNom || '—'} · ${reservation.passagerTel || ''}<br>
      Montant payé : ${Number(reservation.total || 0).toLocaleString('fr-FR')} FCFA
    </div>
    <button type="button" class="btn-primary" id="markUsedBtn" style="margin-top:14px; width:auto; padding:11px 22px;">
      Marquer comme utilisé (embarquement)
    </button>
  `;

  document.getElementById('markUsedBtn').addEventListener('click', async () => {
    if (typeof camtravelMarkTicketUsed === 'function') {
      await camtravelMarkTicketUsed(reservation.id);
    }
    verifyRef(ref);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const ref = refInput.value.trim();
  if (!ref) return;
  verifyRef(ref);
});
