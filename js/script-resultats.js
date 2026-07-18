// Lecture des critères de recherche transmis par recherche.html
const params = new URLSearchParams(window.location.search);
const from = params.get('from') || 'Yaoundé';
const to = params.get('to') || 'Douala';
const date = params.get('date') || '2024-06-08';

function formatDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

document.getElementById('routeTitle').textContent = `${from} → ${to} | ${formatDate(date)}`;

// Jeu de données de démonstration (dans une vraie app : réponse d'une API/base de données)
const trips = [
  { id: 'CAM', company: 'CAM travel', dep: '08:00 AM', arr: '10:30 AM', duration: '2h30m', price: 12500, tags: ['VIP', 'Climatisé', 'WiFi'] },
  { id: 'EXP', company: 'Express Voyages', dep: '08:00 AM', arr: '11:30 AM', duration: '2h30m', price: 11000, tags: ['VIP', 'Climatisé', 'WiFi'] },
  { id: 'GEN', company: 'General Express', dep: '10:00 AM', arr: '12:30 PM', duration: '2h30m', price: 13000, tags: ['VIP', 'Climatisé', 'WiFi'] },
  { id: 'ROY', company: 'Royal Bus', dep: '11:00 AM', arr: '01:30 PM', duration: '2h30m', price: 12000, tags: ['VIP', 'Climatisé', 'WiFi'] },
  { id: 'DRM', company: 'Dream Transport', dep: '01:00 PM', arr: '03:30 PM', duration: '2h30m', price: 11500, tags: ['VIP', 'Climatisé', 'WiFi'] },
];

document.getElementById('countLabel').textContent = `${trips.length} trajets trouvés`;

const list = document.getElementById('tripList');

trips.forEach(trip => {
  const card = document.createElement('div');
  card.className = 'trip-card';

  const initials = trip.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  card.innerHTML = `
    <div class="company">
      <div class="company-badge">${initials}</div>
      <div>
        <div class="company-name">${trip.company}</div>
        <div class="trip-tags">
          ${trip.tags.map(t => `<span class="trip-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="trip-times">
      <span class="time">${trip.dep}</span>
      <span class="arrow">→<span class="dur">${trip.duration}</span></span>
      <span class="time">${trip.arr}</span>
    </div>
    <div class="price">${trip.price.toLocaleString('fr-FR')} FCFA</div>
    <a class="btn-choisir" href="detail-trajet.html?${new URLSearchParams({
      company: trip.company, dep: trip.dep, arr: trip.arr, duration: trip.duration,
      price: trip.price, tags: trip.tags.join(','), from, to, date
    }).toString()}">Choisir</a>
  `;

  list.appendChild(card);
});
