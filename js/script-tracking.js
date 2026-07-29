const busIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 6v6M16 6v6M2 12h20M4 6h16a2 2 0 0 1 2 2v9a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0H3a1 1 0 0 1-1-1V8a2 2 0 0 1 2-2Z"/></svg>';

function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const parts = timeStr.trim().split(' ');
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

(async function init() {
  const list = document.getElementById('trackList');
  const reservations = typeof camtravelGetReservations === 'function'
    ? await camtravelGetReservations({ onlyMine: true })
    : [];

  const now = new Date();
  const enriched = [];

  for (const r of reservations) {
    if (!r.tripId) continue; // pas de trajet réel lié : rien à simuler précisément
    const trip = typeof camtravelGetTripById === 'function' ? await camtravelGetTripById(r.tripId) : null;
    if (!trip) continue;
    const dep = parseDateTime(r.date, trip.dep);
    const arr = parseDateTime(r.date, trip.arr);
    if (!dep || !arr || arr <= dep) continue;
    // Ne montre que les trajets d'aujourd'hui ou de demain, pas terminés depuis plus de 2h.
    const hoursSinceArrival = (now - arr) / 3600000;
    if (hoursSinceArrival > 2) continue;
    enriched.push({ r, trip, dep, arr });
  }

  enriched.sort((a, b) => a.dep - b.dep);

  if (enriched.length === 0) {
    list.innerHTML = `<div class="empty-state">Aucun trajet à suivre pour le moment. Vos prochains départs apparaîtront ici.</div>`;
    return;
  }

  list.innerHTML = enriched.map(({ r, trip, dep, arr }) => {
    let progress, status;
    if (now < dep) {
      progress = 0;
      status = `Départ prévu à ${formatTime(dep)}`;
    } else if (now > arr) {
      progress = 100;
      status = `Arrivé à ${formatTime(arr)}`;
    } else {
      progress = Math.round(((now - dep) / (arr - dep)) * 100);
      status = `En route — arrivée estimée à ${formatTime(arr)}`;
    }
    return `
      <div class="track-card">
        <div class="track-route-label"><span>${r.from}</span><span>${r.to}</span></div>
        <div class="track-bar">
          <div class="track-bar-fill" style="width:${progress}%;"></div>
          <div class="track-bus" style="left:${progress}%;">${busIcon}</div>
        </div>
        <div class="track-status">${r.ref} · ${status}</div>
      </div>
    `;
  }).join('');
})();
