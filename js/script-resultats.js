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

const list = document.getElementById('tripList');
const countLabel = document.getElementById('countLabel');

function renderDocumentary(doc) {
  if (!doc || !list) return;

  const existing = document.querySelector('.doc-feature');
  if (existing) existing.remove();

  const feature = document.createElement('section');
  feature.className = 'doc-feature';
  feature.innerHTML = `
    <div class="doc-feature-media">
      <img src="${doc.image}" alt="${doc.title}" loading="lazy">
    </div>
    <div class="doc-feature-content">
      <span class="doc-feature-badge">Découverte culturelle</span>
      <h3>${doc.title}</h3>
      <p class="doc-feature-region">${doc.region} • ${doc.city}</p>
      <p>${doc.description}</p>
      <ul>
        ${(doc.highlights || []).map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;

  list.appendChild(feature);
}

function getDocumentaryMatch() {
  const params = new URLSearchParams(window.location.search);
  const queryText = [params.get('q'), from, to].filter(Boolean).join(' ');

  if (typeof window.landmarkDoc?.findLandmarkDocumentary === 'function') {
    return window.landmarkDoc.findLandmarkDocumentary(queryText);
  }

  return null;
}

function renderTrips(trips) {
  countLabel.textContent = `${trips.length} trajet${trips.length > 1 ? 's' : ''} trouvé${trips.length > 1 ? 's' : ''}`;

  if (trips.length === 0) {
    list.innerHTML = `<div class="empty-state">Aucun trajet pour ce parcours à cette date. Essayez une autre ville ou une autre date.</div>`;
    return;
  }

  list.innerHTML = '';
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
        <span class="arrow">→<span class="dur">${trip.duration || ''}</span></span>
        <span class="time">${trip.arr}</span>
      </div>
      <div class="price">${Number(trip.price).toLocaleString('fr-FR')} FCFA</div>
      <a class="btn-choisir" href="detail-trajet.html?${new URLSearchParams({
        tripId: trip.id, company: trip.company, dep: trip.dep, arr: trip.arr,
        duration: trip.duration || '', price: trip.price, tags: (trip.tags || []).join(','),
        seatCount: trip.seatCount, from, to, date,
        vehicleId: trip.vehicleId || '', busName: trip.busName || '',
        matricule: trip.matricule || '', layoutId: trip.layoutId || '',
        vip: trip.vip ? '1' : (trip.tags && trip.tags.some(x => /VIP/i.test(x)) ? '1' : '0')
      }).toString()}">Choisir</a>
    `;

    list.appendChild(card);
  });
}

(async function init() {
  list.innerHTML = `<div class="empty-state">Recherche des trajets…</div>`;
  let trips = [];
  if (typeof camtravelBusApi !== 'undefined' && camtravelBusApi.searchTrips) {
    trips = await camtravelBusApi.searchTrips({ from, to, date });
  } else if (typeof camtravelGetTrips === 'function') {
    trips = await camtravelGetTrips({ from, to });
  }
  // Garantir tags tableau pour le rendu
  trips = (trips || []).map(tr => ({
    ...tr,
    tags: Array.isArray(tr.tags) ? tr.tags : String(tr.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    company: tr.company || 'Agence partenaire'
  }));
  renderTrips(trips);
  renderDocumentary(getDocumentaryMatch());
})();
