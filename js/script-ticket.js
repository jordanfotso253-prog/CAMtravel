const params = new URLSearchParams(window.location.search);

const from = params.get('from') || 'Yaoundé';
const to = params.get('to') || 'Douala';
const dep = params.get('dep') || '08:00 AM';
const date = params.get('date') || '2024-06-08';
const ref = params.get('ref') || 'YA001250608';
const passagerNom = params.get('passagerNom') || 'Jean Dupont';
const passagerTel = params.get('passagerTel') || '6 96 74 53 24';
const seats = (params.get('seats') || '').split(',').map(s => s.trim()).filter(Boolean);
const passagers = Number(params.get('passagers') || seats.length || 1);
const price = Number(params.get('price') || 0);
const total = Number(params.get('total') || price * passagers);

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Numéro de siège stable pour une même référence (juste pour la démo)
function seatFromRef(refStr) {
  let sum = 0;
  for (const ch of refStr) sum += ch.charCodeAt(0);
  const num = (sum % 40) + 1;
  const letter = String.fromCharCode(65 + (sum % 4));
  return `${num}${letter}`;
}

document.getElementById('tRef').textContent = ref;
document.getElementById('tRoute').textContent = `${from} → ${to}`;
document.getElementById('tDateTime').textContent = `${formatDate(date)} - ${dep}`;
document.getElementById('tPassager').textContent = passagerNom;
document.getElementById('tTel').textContent = passagerTel;
document.getElementById('tSiege').textContent = seats.length ? seats.join(' · ') : seatFromRef(ref);
document.getElementById('tUnitPrice').textContent = `${price.toLocaleString('fr-FR')} FCFA`;
document.getElementById('tTotal').textContent = `${total.toLocaleString('fr-FR')} FCFA`;

// Génération du QR code : encode les infos essentielles du ticket
const qrData = JSON.stringify({ ref, from, to, date, dep, seats, total, passager: passagerNom });

if (window.QRCode) {
  new QRCode(document.getElementById('qrcode'), {
    text: qrData,
    width: 120,
    height: 120,
    colorDark: '#16241d',
    colorLight: '#ffffff'
  });
} else {
  document.getElementById('qrcode').textContent = 'QR indisponible hors ligne';
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  window.print();
});
