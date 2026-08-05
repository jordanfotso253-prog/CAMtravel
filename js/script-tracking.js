/**
 * Suivi GPS CAM travel — carte Leaflet + position simulée selon horaires.
 * Coordonnées des principales villes camerounaises.
 */
const CITY_COORDS = {
  'Yaoundé': [3.8480, 11.5021],
  'Douala': [4.0511, 9.7679],
  'Bafoussam': [5.4781, 10.4167],
  'Bertoua': [4.5773, 13.6846],
  'Garoua': [9.3014, 13.3921],
  'Ngaoundéré': [7.3277, 13.5847],
  'Maroua': [10.5910, 14.3159],
  'Bamenda': [5.9597, 10.1453],
  'Buea': [4.1550, 9.2317],
  'Ebolowa': [2.9280, 11.1560],
  'Kribi': [2.9373, 9.9077],
  'Limbe': [4.0225, 9.2149]
};

const busIconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0H3a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2Z"/></svg>';

function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const parts = timeStr.trim().split(/\s+/);
  const time = parts[0];
  const meridiem = (parts[1] || '').toUpperCase();
  let [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return null;
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(h, m || 0, 0, 0);
  return d;
}

function formatTime(d) {
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolatePos(from, to, progress) {
  const t = Math.max(0, Math.min(1, progress / 100));
  // légère courbe pour simuler un trajet routier
  const midLat = (from[0] + to[0]) / 2 + 0.15 * Math.sin(t * Math.PI);
  const midLng = (from[1] + to[1]) / 2 - 0.1 * Math.sin(t * Math.PI);
  if (t < 0.5) {
    const u = t * 2;
    return [lerp(from[0], midLat, u), lerp(from[1], midLng, u)];
  }
  const u = (t - 0.5) * 2;
  return [lerp(midLat, to[0], u), lerp(midLng, to[1], u)];
}

function resolveCoords(city) {
  if (!city) return null;
  const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === String(city).trim().toLowerCase());
  return key ? CITY_COORDS[key] : null;
}

let map, busMarker, routeLine, startMarker, endMarker;
let tripsCache = [];
let selectedIdx = 0;
let tickTimer = null;

function ensureMap() {
  if (map || typeof L === 'undefined') return !!map;
  map = L.map('gpsMap', { zoomControl: true, attributionControl: true }).setView([5.5, 11.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  return true;
}

function clearMapLayers() {
  if (!map) return;
  [routeLine, busMarker, startMarker, endMarker].forEach(layer => {
    if (layer) { map.removeLayer(layer); }
  });
  routeLine = busMarker = startMarker = endMarker = null;
}

function busDivIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:#f5921b;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">${busIconSvg}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

function renderMapForTrip(item) {
  if (!ensureMap()) return;
  clearMapLayers();
  const fromC = resolveCoords(item.r.from) || [3.848, 11.502];
  const toC = resolveCoords(item.r.to) || [4.051, 9.768];
  const pos = interpolatePos(fromC, toC, item.progress);

  startMarker = L.circleMarker(fromC, { radius: 8, color: '#0b5c3d', fillColor: '#0b5c3d', fillOpacity: 1 }).addTo(map)
    .bindPopup(`Départ : ${item.r.from}`);
  endMarker = L.circleMarker(toC, { radius: 8, color: '#1d4ed8', fillColor: '#1d4ed8', fillOpacity: 1 }).addTo(map)
    .bindPopup(`Arrivée : ${item.r.to}`);

  const mid = interpolatePos(fromC, toC, 50);
  routeLine = L.polyline([fromC, mid, toC], {
    color: '#0b5c3d', weight: 4, opacity: 0.75, dashArray: item.progress >= 100 ? null : '8 10'
  }).addTo(map);

  busMarker = L.marker(pos, { icon: busDivIcon() }).addTo(map)
    .bindPopup(`Bus · ${item.r.ref}<br>${item.status}`);

  map.fitBounds(L.latLngBounds([fromC, toC, pos]).pad(0.35));
}

function computeProgress(dep, arr, now) {
  if (now < dep) return { progress: 0, status: `Départ prévu à ${formatTime(dep)}`, kind: 'waiting' };
  if (now > arr) return { progress: 100, status: `Arrivé à ${formatTime(arr)}`, kind: 'arrived' };
  const progress = Math.round(((now - dep) / (arr - dep)) * 100);
  return { progress, status: `En route — arrivée estimée à ${formatTime(arr)}`, kind: 'moving' };
}

function renderList() {
  const list = document.getElementById('trackList');
  if (!tripsCache.length) {
    list.innerHTML = `<div class="empty-state" style="padding:12px 0;">Aucun trajet à suivre pour le moment. Réservez un trajet pour voir le suivi GPS ici.</div>`;
    document.getElementById('gpsDetail').innerHTML = `<div style="font-size:13px;color:var(--gray-text);">Aucun trajet actif.</div>`;
    return;
  }
  list.innerHTML = tripsCache.map((item, i) => `
    <div class="gps-trip-card ${i === selectedIdx ? 'active' : ''}" data-idx="${i}">
      <div class="gps-ref">${item.r.ref}</div>
      <div class="gps-route">${item.r.from} → ${item.r.to}</div>
      <div class="gps-meta">${item.status}</div>
      <div class="track-bar" style="margin-top:10px;">
        <div class="track-bar-fill" style="width:${item.progress}%;"></div>
        <div class="track-bus" style="left:${item.progress}%;">${busIconSvg}</div>
      </div>
      <span class="gps-status-pill ${item.kind}">${item.kind === 'moving' ? 'En mouvement' : item.kind === 'waiting' ? 'En attente' : 'Arrivé'}</span>
    </div>
  `).join('');

  list.querySelectorAll('.gps-trip-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedIdx = Number(card.dataset.idx);
      renderList();
      showDetail(tripsCache[selectedIdx]);
      renderMapForTrip(tripsCache[selectedIdx]);
    });
  });
}

function showDetail(item) {
  const el = document.getElementById('gpsDetail');
  if (!item) return;
  const fromC = resolveCoords(item.r.from);
  const toC = resolveCoords(item.r.to);
  const pos = fromC && toC ? interpolatePos(fromC, toC, item.progress) : null;
  el.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px;">Détail GPS</div>
    <div style="font-size:13px;line-height:1.6;color:var(--ink);">
      <div><strong>Réf.</strong> ${item.r.ref}</div>
      <div><strong>Trajet</strong> ${item.r.from} → ${item.r.to}</div>
      <div><strong>Statut</strong> ${item.status}</div>
      <div><strong>Progression</strong> ${item.progress}%</div>
      ${pos ? `<div><strong>Coordonnées</strong> ${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}</div>` : ''}
      <div style="margin-top:8px;font-size:12px;color:var(--gray-text);">
        Simulation basée sur les horaires du trajet (GPS embarqué réel à venir).
      </div>
    </div>
  `;
}

function refreshPositions() {
  const now = new Date();
  tripsCache.forEach(item => {
    const c = computeProgress(item.dep, item.arr, now);
    item.progress = c.progress;
    item.status = c.status;
    item.kind = c.kind;
  });
  renderList();
  if (tripsCache[selectedIdx]) {
    showDetail(tripsCache[selectedIdx]);
    renderMapForTrip(tripsCache[selectedIdx]);
  }
}

function demoTripsIfEmpty(reservations) {
  // En mode démo : si aucune réservation liée, propose 2 trajets illustratifs
  if (reservations.length > 0) return [];
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  const dep1 = new Date(); dep1.setHours(dep1.getHours() - 1, 0, 0, 0);
  const arr1 = new Date(); arr1.setHours(arr1.getHours() + 2, 0, 0, 0);
  const dep2 = new Date(); dep2.setHours(dep2.getHours() + 2, 0, 0, 0);
  const arr2 = new Date(); arr2.setHours(arr2.getHours() + 6, 0, 0, 0);
  return [
    {
      r: { ref: 'YA-DEMO-01', from: 'Yaoundé', to: 'Douala', date: dateStr },
      dep: dep1, arr: arr1, trip: { dep: 'demo', arr: 'demo' }
    },
    {
      r: { ref: 'YA-DEMO-02', from: 'Douala', to: 'Bafoussam', date: dateStr },
      dep: dep2, arr: arr2, trip: { dep: 'demo', arr: 'demo' }
    }
  ];
}

(async function init() {
  const list = document.getElementById('trackList');
  list.innerHTML = `<div class="empty-state" style="padding:12px 0;">Chargement du suivi GPS…</div>`;

  const reservations = typeof camtravelGetReservations === 'function'
    ? await camtravelGetReservations({ onlyMine: true })
    : [];

  const now = new Date();
  const enriched = [];

  for (const r of reservations) {
    let dep, arr;
    if (r.tripId && typeof camtravelGetTripById === 'function') {
      const trip = await camtravelGetTripById(r.tripId);
      if (trip) {
        dep = parseDateTime(r.date, trip.dep);
        arr = parseDateTime(r.date, trip.arr);
      }
    }
    // fallback si pas de trip lié : estime 3h de trajet à partir de dep stocké
    if (!dep) dep = parseDateTime(r.date, r.dep || '08:00 AM');
    if (!arr && dep) {
      arr = new Date(dep.getTime() + 3 * 3600000);
    }
    if (!dep || !arr || arr <= dep) continue;
    const hoursSinceArrival = (now - arr) / 3600000;
    if (hoursSinceArrival > 6) continue;
    const c = computeProgress(dep, arr, now);
    enriched.push({ r, dep, arr, progress: c.progress, status: c.status, kind: c.kind });
  }

  if (enriched.length === 0) {
    const demos = demoTripsIfEmpty(reservations);
    demos.forEach(item => {
      const c = computeProgress(item.dep, item.arr, now);
      enriched.push({ ...item, progress: c.progress, status: c.status, kind: c.kind });
    });
  }

  enriched.sort((a, b) => a.dep - b.dep);
  tripsCache = enriched;
  selectedIdx = 0;

  ensureMap();
  renderList();
  if (tripsCache[0]) {
    showDetail(tripsCache[0]);
    renderMapForTrip(tripsCache[0]);
  }

  document.getElementById('gpsRefreshBtn').addEventListener('click', () => {
    refreshPositions();
    const btn = document.getElementById('gpsRefreshBtn');
    btn.textContent = 'Position actualisée ✓';
    setTimeout(() => { btn.textContent = 'Actualiser la position'; }, 1200);
  });

  // mise à jour auto toutes les 20 s
  tickTimer = setInterval(refreshPositions, 20000);
})();
