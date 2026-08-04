const params = new URLSearchParams(window.location.search);
const tripId = params.get('tripId') || '';
const seatCount = parseInt(params.get('seatCount') || '40', 10);
const agencyQuota = parseInt(params.get('agencyQuota') || '10', 10);
// Sièges vendables en ligne = total - quota guichet (sièges réservés à l'agence)
const webSeatLimit = typeof camtravelWebSeatLimit === 'function'
  ? camtravelWebSeatLimit(seatCount, agencyQuota)
  : Math.max(0, seatCount - Math.min(Math.max(agencyQuota, 0), seatCount));
const company = params.get('company') || 'CAM travel';
const from = params.get('from') || '';
const to = params.get('to') || '';
const date = params.get('date') || '';
const price = Number(params.get('price') || 0);

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

document.getElementById('tripSummary').textContent =
  `${company} · ${from} → ${to} · ${formatDate(date)} · ${price.toLocaleString('fr-FR')} FCFA / passager` +
  (agencyQuota > 0 ? ` · ${webSeatLimit} places en ligne` : '');

const seatMap = document.getElementById('seatMap');
const seatCountLabel = document.getElementById('seatCountLabel');
const totalPriceLabel = document.getElementById('totalPriceLabel');
const continueBtn = document.getElementById('continueBtn');
const banner = document.getElementById('statusBanner');

const selectedSeats = new Set();

function renderSummary() {
  const n = selectedSeats.size;
  seatCountLabel.textContent = n === 0 ? 'Aucun siège sélectionné' : `${n} siège${n > 1 ? 's' : ''} sélectionné${n > 1 ? 's' : ''}`;
  totalPriceLabel.textContent = `${(n * price).toLocaleString('fr-FR')} FCFA`;
  continueBtn.disabled = n === 0;
}

function buildSeatMap(occupied) {
  seatMap.innerHTML = '';
  // Le client web ne voit que les sièges hors quota guichet
  const visibleCount = webSeatLimit > 0 ? webSeatLimit : seatCount;
  const rows = Math.ceil(visibleCount / 4);
  let seatNum = 1;

  for (let r = 0; r < rows; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row';

    for (let side = 0; side < 2; side++) {
      for (let col = 0; col < 2; col++) {
        if (seatNum > visibleCount) break;
        const num = seatNum++;
        const seatEl = document.createElement('button');
        seatEl.type = 'button';
        seatEl.className = 'seat ' + (occupied.includes(num) ? 'occupied' : 'available');
        seatEl.textContent = num;
        seatEl.disabled = occupied.includes(num);
        seatEl.addEventListener('click', () => {
          if (selectedSeats.has(num)) {
            selectedSeats.delete(num);
            seatEl.classList.remove('selected');
            seatEl.classList.add('available');
          } else {
            selectedSeats.add(num);
            seatEl.classList.add('selected');
            seatEl.classList.remove('available');
          }
          renderSummary();
        });
        rowEl.appendChild(seatEl);
      }
      if (side === 0) {
        const gap = document.createElement('div');
        gap.className = 'seat-aisle-gap';
        rowEl.appendChild(gap);
      }
    }
    seatMap.appendChild(rowEl);
  }
}

continueBtn.addEventListener('click', () => {
  if (selectedSeats.size === 0) return;
  const seatsSorted = Array.from(selectedSeats).sort((a, b) => a - b);
  const next = new URLSearchParams(params);
  next.set('seats', seatsSorted.join(','));
  window.location.href = `info-passager.html?${next.toString()}`;
});

(async function init() {
  if (!tripId || typeof camtravelGetOccupiedSeats !== 'function') {
    buildSeatMap([]);
    renderSummary();
    return;
  }
  const occupied = await camtravelGetOccupiedSeats(tripId, date);
  buildSeatMap(occupied);
  renderSummary();
})();
