/**
 * Location de bus pour événements (clients)
 */
(function () {
  const KEY = 'camtravel_rentals';

  const EVENT_TYPES = {
    mariage: 'Mariage / cérémonie',
    entreprise: 'Entreprise / séminaire',
    scolaire: 'Scolaire / universitaire',
    eglise: 'Église / communauté',
    sport: 'Événement sportif',
    aeroport: 'Transfert aéroport',
    excursion: 'Excursion / tourisme',
    deuil: 'Deuil / funérailles',
    autre: 'Autre événement'
  };

  const BUS_TYPES = {
    standard: { label: 'Bus standard (40–48 places)', ratePerDay: 120000 },
    vip: { label: 'Bus VIP (20–30 places)', ratePerDay: 180000 },
    mini: { label: 'Minibus (15–18 places)', ratePerDay: 70000 },
    several: { label: 'Plusieurs bus', ratePerDay: 120000 }
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  }
  function uid() {
    return 'LOC' + Date.now().toString(36).toUpperCase();
  }

  function estimateQuote(data) {
    const bus = BUS_TYPES[data.busType] || BUS_TYPES.standard;
    const days = Math.max(1, Number(data.days) || 1);
    const buses = Math.max(1, Number(data.busCount) || 1);
    let total = bus.ratePerDay * days * buses;
    // Supplément distance indicative
    if (data.longDistance) total += 25000 * buses * days;
    return total;
  }

  function add(data) {
    const entry = {
      id: uid(),
      eventType: data.eventType || 'autre',
      eventLabel: EVENT_TYPES[data.eventType] || data.eventType,
      busType: data.busType || 'standard',
      busLabel: (BUS_TYPES[data.busType] || BUS_TYPES.standard).label,
      busCount: Number(data.busCount) || 1,
      passengers: Number(data.passengers) || 0,
      from: data.from || '',
      to: data.to || '',
      dateStart: data.dateStart || '',
      dateEnd: data.dateEnd || data.dateStart || '',
      days: Number(data.days) || 1,
      longDistance: !!data.longDistance,
      clientName: data.clientName || '',
      clientTel: data.clientTel || '',
      clientEmail: data.clientEmail || '',
      notes: data.notes || '',
      quote: estimateQuote(data),
      status: 'requested', // requested | quoted | confirmed | rejected | done
      agencyId: data.agencyId || null,
      createdAt: new Date().toISOString()
    };
    const all = load();
    all.unshift(entry);
    save(all);
    return { ok: true, entry };
  }

  function list(opts) {
    opts = opts || {};
    let items = load();
    if (opts.agencyId) items = items.filter(r => !r.agencyId || r.agencyId === opts.agencyId);
    if (opts.status) items = items.filter(r => r.status === opts.status);
    return items;
  }

  function setStatus(id, status) {
    const all = load();
    const i = all.findIndex(r => r.id === id);
    if (i < 0) return false;
    all[i].status = status;
    save(all);
    return true;
  }

  window.camtravelRentals = {
    EVENT_TYPES, BUS_TYPES, add, list, setStatus, estimateQuote, load
  };
})();
