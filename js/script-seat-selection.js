/**
 * Sélection de sièges — plan réaliste type bus (2+2 / 2+1 VIP)
 */
const params = new URLSearchParams(window.location.search);
const tripId = params.get('tripId') || '';
const vehicleId = params.get('vehicleId') || '';
let seatCount = parseInt(params.get('seatCount') || '40', 10);
const company = params.get('company') || 'Agence partenaire';
const from = params.get('from') || '';
const to = params.get('to') || '';
const date = params.get('date') || '';
const price = Number(params.get('price') || 0);
const busName = params.get('busName') || '';
const matricule = params.get('matricule') || '';
const isVip = params.get('vip') === '1' || params.get('vip') === 'true';
const layoutIdParam = params.get('layoutId') || '';

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const summaryParts = [
  company,
  busName ? `Bus « ${busName} »` : null,
  matricule ? matricule : null,
  isVip ? 'VIP' : null,
  `${from} → ${to}`,
  formatDate(date),
  `${price.toLocaleString('fr-FR')} FCFA / place`
].filter(Boolean);
document.getElementById('tripSummary').textContent = summaryParts.join(' · ');

const seatMap = document.getElementById('seatMap');
const seatCountLabel = document.getElementById('seatCountLabel');
const seatUnitPriceLabel = document.getElementById('seatUnitPriceLabel');
const totalPriceLabel = document.getElementById('totalPriceLabel');
const availableSeatLabel = document.getElementById('availableSeatLabel');
const continueBtn = document.getElementById('continueBtn');
const banner = document.getElementById('statusBanner');
const selectedSeats = new Set();

function resolveLayout() {
  if (typeof camtravelVehicles !== 'undefined') {
    if (vehicleId) {
      const v = camtravelVehicles.get(vehicleId);
      if (v) return camtravelVehicles.getLayout(v);
    }
    if (layoutIdParam && camtravelVehicles.LAYOUTS[layoutIdParam]) {
      return camtravelVehicles.LAYOUTS[layoutIdParam];
    }
    // Déduire VIP / standard
    if (isVip) return camtravelVehicles.LAYOUTS.vip_30;
    if (seatCount <= 20) return camtravelVehicles.LAYOUTS.vip_20;
    if (seatCount <= 18) return camtravelVehicles.LAYOUTS.mini_18;
    if (seatCount >= 48) return camtravelVehicles.LAYOUTS.standard_48;
    return camtravelVehicles.LAYOUTS.standard_40;
  }
  // Fallback sans module
  const rows = Math.ceil(seatCount / 4);
  return {
    seatCount,
    vip: isVip,
    rows: Array.from({ length: rows }, (_, i) => {
      const r = i + 1;
      return [`${r}A`, `${r}B`, null, `${r}C`, `${r}D`];
    })
  };
}

function renderSummary() {
  const n = selectedSeats.size;
  seatCountLabel.textContent = n === 0
    ? 'Aucun siège sélectionné'
    : `${n} siège${n > 1 ? 's' : ''} : ${[...selectedSeats].join(', ')}`;
  totalPriceLabel.textContent = `${(n * price).toLocaleString('fr-FR')} FCFA`;
  if (seatUnitPriceLabel) seatUnitPriceLabel.textContent = `${price.toLocaleString('fr-FR')} FCFA / siège`;
  continueBtn.disabled = n === 0;
}

function buildSeatMap(occupied) {
  occupied = (occupied || []).map(String);
  const layout = resolveLayout();
  seatCount = layout.seatCount || seatCount;
  if (availableSeatLabel) availableSeatLabel.textContent = Math.max(0, seatCount - occupied.length);
  seatMap.innerHTML = '';
  seatMap.classList.add('bus-seat-map');

  const front = document.createElement('div');
  front.className = 'bus-front';
  front.textContent = '🚗 Conducteur' + (layout.vip || isVip ? '  ·  VIP' : '');
  seatMap.appendChild(front);

  // Légende colonnes
  const hdr = document.createElement('div');
  hdr.className = 'seat-row bus-row bus-col-labels';
  const sample = layout.rows[0] || [];
  sample.forEach(cell => {
    const d = document.createElement('div');
    if (cell === null) {
      d.className = 'seat-aisle';
      d.textContent = '';
    } else {
      d.className = 'seat-col-label';
      d.textContent = cell.replace(/^\d+/, '');
    }
    hdr.appendChild(d);
  });
  seatMap.appendChild(hdr);

  layout.rows.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row bus-row';
    row.forEach(cell => {
      if (cell === null) {
        const aisle = document.createElement('div');
        aisle.className = 'seat-aisle';
        aisle.title = 'Couloir';
        rowEl.appendChild(aisle);
        return;
      }
      const seatEl = document.createElement('button');
      seatEl.type = 'button';
      seatEl.className = 'seat ' + (occupied.includes(String(cell)) ? 'occupied' : 'available');
      seatEl.textContent = cell;
      seatEl.title = occupied.includes(String(cell)) ? `Siège ${cell} occupé` : `Siège ${cell}`;
      seatEl.disabled = occupied.includes(String(cell));
      seatEl.addEventListener('click', () => {
        if (selectedSeats.has(cell)) {
          selectedSeats.delete(cell);
          seatEl.classList.remove('selected');
          seatEl.classList.add('available');
        } else {
          selectedSeats.add(cell);
          seatEl.classList.add('selected');
          seatEl.classList.remove('available');
        }
        renderSummary();
      });
      rowEl.appendChild(seatEl);
    });
    seatMap.appendChild(rowEl);
  });

  const legend = document.createElement('div');
  legend.className = 'bus-legend';
  legend.innerHTML = `
    <span><i class="seat available"></i> Libre</span>
    <span><i class="seat selected"></i> Votre choix</span>
    <span><i class="seat occupied"></i> Occupé</span>
    <span class="aisle-hint">Couloir central</span>`;
  seatMap.appendChild(legend);
}

renderSummary();

(async function init() {
  let occupied = [];
  if (typeof camtravelGetOccupiedSeats === 'function' && tripId && date) {
    try { occupied = await camtravelGetOccupiedSeats(tripId, date) || []; } catch (e) {}
  }
  // occupied peut être des numéros ou des ids type 1A
  occupied = occupied.map(s => String(s));
  buildSeatMap(occupied);
})();

continueBtn.addEventListener('click', () => {
  if (selectedSeats.size === 0) {
    banner.className = 'status-banner show error';
    banner.textContent = 'Choisissez au moins un siège.';
    return;
  }
  const seats = [...selectedSeats].join(',');
  const q = new URLSearchParams({
    tripId, company, from, to, date, price: String(price),
    seatCount: String(seatCount),
    seats,
    busName, matricule, vip: isVip ? '1' : '0',
    vehicleId, layoutId: layoutIdParam
  });
  window.location.href = 'info-passager.html?' + q.toString();
});
