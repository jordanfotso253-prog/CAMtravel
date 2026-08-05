const params = new URLSearchParams(window.location.search);

const company = params.get('company') || 'CAM travel';
const dep = params.get('dep') || '08:00 AM';
const from = params.get('from') || 'Yaoundé';
const to = params.get('to') || 'Douala';
const date = params.get('date') || '2024-06-08';
const price = Number(params.get('price') || 12500);
const passagers = Number(params.get('passagers') || 1);
const passagerNom = params.get('passagerNom') || 'Client';
const passagerTel = params.get('passagerTel') || '';
const tripId = params.get('tripId') || null;
const seatNumbers = params.get('seats') || null;

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const total = price * passagers;

document.getElementById('recapTrajet').textContent = `${from} → ${to}`;
document.getElementById('recapDate').textContent = `${formatDate(date)} - ${dep}`;
document.getElementById('recapPassagers').textContent = `${passagers} Passager${passagers > 1 ? 's' : ''}`;
document.getElementById('recapPrixUnit').textContent = `${price.toLocaleString('fr-FR')} FCFA`;
document.getElementById('recapTotal').textContent = `${total.toLocaleString('fr-FR')} FCFA`;
document.getElementById('payBtn').textContent = `Payer ${total.toLocaleString('fr-FR')} FCFA`;

// Sélection visuelle de la méthode de paiement
document.querySelectorAll('.method-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    card.querySelector('input').checked = true;
  });
});

const form = document.getElementById('paymentForm');
const banner = document.getElementById('statusBanner');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  banner.className = 'status-banner show success';
  banner.textContent = 'Paiement en cours de traitement...';

  // Génère une référence de réservation (dans une vraie app : générée côté serveur)
  const ref = 'YA' + Math.floor(100000 + Math.random() * 900000);
  const method = document.querySelector('input[name="method"]:checked')?.value || 'mobile-money';
  const methodLabels = { 'mobile-money': 'Mobile Money', 'carte': 'Carte bancaire', 'a-bord': 'Paiement à bord' };

  // Enregistre la réservation (visible ensuite dans le tableau de bord admin)
  if (typeof camtravelSaveReservation === 'function') {
    await camtravelSaveReservation({
      ref, company, from, to, date, dep,
      price, passagers, total,
      passagerNom, passagerTel,
      method, methodLabel: methodLabels[method] || method,
      tripId, seatNumbers
    });
  }

  if (typeof camtravelNotify !== 'undefined') {
    try {
      await camtravelNotify.bookingConfirmed(ref, from, to);
      await camtravelNotify.adminNewBooking(ref, from, to);
      await camtravelNotify.agencyNewBooking(ref, from, to);
    } catch (e) {}
  }

  if (typeof camtravelEmail !== 'undefined') {
    try {
      await camtravelEmail.sendBooking({
        ref, from, to, date, dep, total,
        name: passagerNom, email: null
      });
    } catch (e) {}
  } else if (typeof camtravelPush !== 'undefined' && camtravelPush.notifyBookingConfirmed) {
    try { await camtravelPush.notifyBookingConfirmed(ref, from, to); } catch (e) {}
  }

  const next = new URLSearchParams(params);
  next.set('ref', ref);
  next.set('total', total);

  window.location.href = `confirmation.html?${next.toString()}`;
});
