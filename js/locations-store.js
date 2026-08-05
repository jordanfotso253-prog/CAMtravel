/**
 * Lieux / gares d'une même agence (réseau multi-villes)
 * Un seul tableau de bord, une seule base (localStorage + Supabase).
 */
(function () {
  const KEY = 'camtravel_agency_locations';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  function uid() {
    return 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function seedIfEmpty() {
    if (load().length) return;
    const seed = [
      // Express Voyages
      { id: 'loc-exp-yde', agencyId: 'ag-exp', name: 'Gare Express Yaoundé', city: 'Yaoundé', address: 'Mvog-Mbi, gare routière', tel: '690000001', active: true },
      { id: 'loc-exp-dla', agencyId: 'ag-exp', name: 'Gare Express Douala', city: 'Douala', address: 'Akwa, gare routière', tel: '690000002', active: true },
      { id: 'loc-exp-baf', agencyId: 'ag-exp', name: 'Agence Express Bafoussam', city: 'Bafoussam', address: 'Marché A', tel: '690000003', active: true },
      // General Express
      { id: 'loc-gen-yde', agencyId: 'ag-gen', name: 'General Express Yaoundé', city: 'Yaoundé', address: 'Mvan', tel: '691000001', active: true },
      { id: 'loc-gen-dla', agencyId: 'ag-gen', name: 'General Express Douala', city: 'Douala', address: 'Bonabéri', tel: '691000002', active: true },
      { id: 'loc-gen-gar', agencyId: 'ag-gen', name: 'General Express Garoua', city: 'Garoua', address: 'Centre-ville', tel: '691000003', active: true },
      // Royal Bus
      { id: 'loc-roy-dla', agencyId: 'ag-roy', name: 'Royal Bus Douala', city: 'Douala', address: 'Bessengué', tel: '692000001', active: true },
      { id: 'loc-roy-yde', agencyId: 'ag-roy', name: 'Royal Bus Yaoundé', city: 'Yaoundé', address: 'Etoudi', tel: '692000002', active: true },
      { id: 'loc-roy-baf', agencyId: 'ag-roy', name: 'Royal Bus Bafoussam', city: 'Bafoussam', address: 'Banengo', tel: '692000003', active: true },
      // Dream Transport
      { id: 'loc-dre-ber', agencyId: 'ag-dre', name: 'Dream Bertoua', city: 'Bertoua', address: 'Gare centrale', tel: '693000001', active: true },
      { id: 'loc-dre-yde', agencyId: 'ag-dre', name: 'Dream Yaoundé', city: 'Yaoundé', address: 'Nlongkak', tel: '693000002', active: true }
    ];
    save(seed.map(s => ({ ...s, createdAt: new Date().toISOString() })));
  }

  function list(opts) {
    seedIfEmpty();
    opts = opts || {};
    let items = load();
    if (opts.agencyId) items = items.filter(l => l.agencyId === opts.agencyId);
    if (opts.city) items = items.filter(l => l.city === opts.city);
    if (opts.activeOnly) items = items.filter(l => l.active !== false);
    return items.sort((a, b) => (a.city || '').localeCompare(b.city || '', 'fr'));
  }

  function get(id) {
    seedIfEmpty();
    return load().find(l => l.id === id) || null;
  }

  function add(data) {
    seedIfEmpty();
    const entry = {
      id: uid(),
      agencyId: data.agencyId,
      name: (data.name || '').trim(),
      city: data.city || '',
      address: (data.address || '').trim(),
      tel: (data.tel || '').trim(),
      active: true,
      createdAt: new Date().toISOString()
    };
    if (!entry.name || !entry.agencyId) return { ok: false, reason: 'name' };
    const all = load();
    all.unshift(entry);
    save(all);
    return { ok: true, entry };
  }

  function update(id, fields) {
    const all = load();
    const i = all.findIndex(l => l.id === id);
    if (i < 0) return { ok: false };
    all[i] = { ...all[i], ...fields, id: all[i].id, agencyId: all[i].agencyId };
    save(all);
    return { ok: true, entry: all[i] };
  }

  function remove(id) {
    save(load().filter(l => l.id !== id));
    return { ok: true };
  }

  function countByAgency(agencyId) {
    return list({ agencyId }).length;
  }

  /** Filtre actif dans le tableau de bord (tous les lieux = null) */
  const FILTER_KEY = 'camtravel_agency_location_filter';
  function getFilter() {
    return localStorage.getItem(FILTER_KEY) || '';
  }
  function setFilter(locationId) {
    if (!locationId) localStorage.removeItem(FILTER_KEY);
    else localStorage.setItem(FILTER_KEY, locationId);
  }

  window.camtravelLocations = {
    list, get, add, update, remove, countByAgency, seedIfEmpty, getFilter, setFilter
  };
})();
