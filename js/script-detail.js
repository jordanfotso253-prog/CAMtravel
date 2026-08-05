const params = new URLSearchParams(window.location.search);

const tripId = params.get('tripId') || '';
const seatCount = params.get('seatCount') || '40';
const company = params.get('company') || 'Agence partenaire';
const dep = params.get('dep') || '08:00 AM';
const arr = params.get('arr') || '10:30 AM';
const duration = params.get('duration') || '2h30m';
const price = params.get('price') || '12500';
const tags = (params.get('tags') || 'VIP,Climatisé,WiFi').split(',');
const from = params.get('from') || 'Yaoundé';
const to = params.get('to') || 'Douala';
const date = params.get('date') || '2024-06-08';

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

document.getElementById('companyName').textContent = company;
document.getElementById('depTime').textContent = dep;
document.getElementById('arrTime').textContent = arr;
document.getElementById('routeLabel').textContent = `${from} → ${to}`;
document.getElementById('metaLabel').textContent = `${formatDate(date)} · ${duration}`;
document.getElementById('priceValue').textContent = `${Number(price).toLocaleString('fr-FR')} FCFA`;

document.getElementById('departPoint').innerHTML = `${from} - Gare Routière <span class="when">${dep}</span>`;
document.getElementById('arrivalPoint').innerHTML = `${to} - Gare Routière <span class="when">${arr}</span>`;

const tagIcons = { 'VIP': '★', 'Climatisé': '❄', 'WiFi': '📶' };
document.getElementById('tagsRow').innerHTML = tags.map(t =>
  `<span class="detail-tag">${tagIcons[t] || ''} ${t}</span>`
).join('');

// Transmet toutes les informations du trajet vers la sélection des sièges
const nextParams = new URLSearchParams({
  tripId, seatCount, company, dep, arr, duration, price,
  tags: tags.join(','), from, to, date,
  vehicleId: params.get('vehicleId') || '',
  busName: params.get('busName') || '',
  matricule: params.get('matricule') || '',
  layoutId: params.get('layoutId') || '',
  vip: params.get('vip') || (tags.some(x => /VIP/i.test(x)) ? '1' : '0')
});
document.getElementById('continueBtn').href = `seat-selection.html?${nextParams.toString()}`;

// Afficher infos bus si présentes
const busLine = document.getElementById('busInfoLine');
if (busLine) {
  const bn = params.get('busName');
  const mat = params.get('matricule');
  const vip = params.get('vip') === '1';
  if (bn || mat) {
    busLine.textContent = [bn ? 'Bus : ' + bn : null, mat ? 'Matricule ' + mat : null, vip ? 'VIP' : null].filter(Boolean).join(' · ');
    busLine.style.display = 'block';
  }
}
