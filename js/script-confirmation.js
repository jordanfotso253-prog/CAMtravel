const params = new URLSearchParams(window.location.search);

const from = params.get('from') || 'Yaoundé';
const to = params.get('to') || 'Douala';
const dep = params.get('dep') || '08:00 AM';
const date = params.get('date') || '2024-06-08';
const passagers = params.get('passagers') || '1';
const total = Number(params.get('total') || 12500);
const ref = params.get('ref') || 'YA001250608';

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

document.getElementById('cRef').textContent = ref;
document.getElementById('cTrajet').textContent = `${from} → ${to}`;
document.getElementById('cDate').textContent = `${formatDate(date)} - ${dep}`;
document.getElementById('cPassagers').textContent = `${passagers} Passager${Number(passagers) > 1 ? 's' : ''}`;
document.getElementById('cMontant').textContent = `${total.toLocaleString('fr-FR')} FCFA`;

document.getElementById('downloadTicketBtn').href = `mon-ticket.html?${params.toString()}`;
