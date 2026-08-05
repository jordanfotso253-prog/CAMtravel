(function () {
  const banner = document.getElementById('statusBanner');

  // Selects
  const eventSel = document.getElementById('eventType');
  eventSel.innerHTML = Object.entries(camtravelRentals.EVENT_TYPES)
    .map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

  const busSel = document.getElementById('busType');
  busSel.innerHTML = Object.entries(camtravelRentals.BUS_TYPES)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

  if (typeof camtravelCities !== 'undefined') {
    camtravelCities.fillSelect(document.getElementById('rFrom'));
    camtravelCities.fillSelect(document.getElementById('rTo'));
  }

  // Default dates
  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  document.getElementById('dateStart').min = iso;
  document.getElementById('dateStart').value = iso;

  function calcDays() {
    const a = document.getElementById('dateStart').value;
    const b = document.getElementById('dateEnd').value;
    if (a && b) {
      const d = Math.max(1, Math.round((new Date(b) - new Date(a)) / 86400000) + 1);
      document.getElementById('days').value = d;
    }
  }
  document.getElementById('dateStart').addEventListener('change', calcDays);
  document.getElementById('dateEnd').addEventListener('change', calcDays);

  function updateQuote() {
    const data = {
      busType: busSel.value,
      busCount: document.getElementById('busCount').value,
      days: document.getElementById('days').value,
      longDistance: document.getElementById('longDistance').checked
    };
    const q = camtravelRentals.estimateQuote(data);
    document.getElementById('quoteAmount').textContent = q.toLocaleString('fr-FR') + ' FCFA';
    const bus = camtravelRentals.BUS_TYPES[data.busType];
    document.getElementById('quoteDetail').textContent =
      `${data.days || 1} jour(s) · ${data.busCount || 1} × ${bus ? bus.label : ''}`.trim();
  }
  ['busType', 'busCount', 'days', 'longDistance'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateQuote);
    document.getElementById(id).addEventListener('input', updateQuote);
  });
  updateQuote();

  function renderMine() {
    const host = document.getElementById('myRentals');
    const items = camtravelRentals.list();
    if (!items.length) {
      host.innerHTML = '<div class="empty-state" style="padding:12px;">Aucune demande pour l’instant.</div>';
      return;
    }
    const statusLabel = {
      requested: 'En attente', quoted: 'Devis', confirmed: 'Confirmée',
      rejected: 'Refusée', done: 'Terminée'
    };
    host.innerHTML = items.slice(0, 8).map(r => `
      <div class="admin-trip-row" style="padding:10px 0;border-bottom:1px solid var(--border);">
        <div>
          <div class="trip-ref">${r.id} <span class="status-pill upcoming">${statusLabel[r.status] || r.status}</span></div>
          <div class="trip-route">${r.eventLabel} · ${r.from} → ${r.to}</div>
          <div class="trip-meta">${r.dateStart}${r.dateEnd && r.dateEnd !== r.dateStart ? ' → ' + r.dateEnd : ''} · ~ ${Number(r.quote).toLocaleString('fr-FR')} FCFA</div>
        </div>
      </div>
    `).join('');
  }
  renderMine();

  document.getElementById('rentalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const from = document.getElementById('rFrom').value;
    const to = document.getElementById('rTo').value;
    if (!from || !to) {
      banner.className = 'status-banner show error';
      banner.textContent = 'Indiquez le départ et la destination.';
      return;
    }
    const res = camtravelRentals.add({
      eventType: eventSel.value,
      busType: busSel.value,
      busCount: document.getElementById('busCount').value,
      passengers: document.getElementById('passengers').value,
      from, to,
      dateStart: document.getElementById('dateStart').value,
      dateEnd: document.getElementById('dateEnd').value || document.getElementById('dateStart').value,
      days: document.getElementById('days').value,
      longDistance: document.getElementById('longDistance').checked,
      clientName: document.getElementById('clientName').value.trim(),
      clientTel: document.getElementById('clientTel').value.trim(),
      clientEmail: document.getElementById('clientEmail').value.trim(),
      notes: document.getElementById('notes').value.trim()
    });
    if (res.ok) {
      if (typeof camtravelNotify !== 'undefined') {
        camtravelNotify.add({
          title: 'Demande de location envoyée',
          body: `${res.entry.eventLabel} · ${res.entry.id}`,
          type: 'system',
          role: 'client',
          url: 'location-bus.html',
          push: true
        });
        camtravelNotify.add({
          title: 'Nouvelle demande de location',
          body: `${res.entry.clientName} · ${res.entry.from} → ${res.entry.to}`,
          type: 'agency',
          role: 'agency',
          url: 'agency-rentals.html',
          push: true
        });
      }
      banner.className = 'status-banner show success';
      banner.textContent = `Demande ${res.entry.id} envoyée. Estimation ~ ${res.entry.quote.toLocaleString('fr-FR')} FCFA. Une agence vous contactera.`;
      e.target.reset();
      document.getElementById('busCount').value = 1;
      document.getElementById('days').value = 1;
      document.getElementById('dateStart').value = iso;
      updateQuote();
      renderMine();
    }
  });
})();
