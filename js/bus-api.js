/**
 * CAM travel — Couche d'intégration API Bus
 * Normalise et agrège : catalogue local, Supabase, API partenaire externe.
 */
(function () {
  function cfg() {
    return window.CAMTRAVEL_BUS_API || { externalEnabled: false, mergeWithLocal: true };
  }

  function normalizeTrip(raw, source) {
    if (!raw) return null;
    const tags = raw.tags
      ? (Array.isArray(raw.tags) ? raw.tags : String(raw.tags).split(',').map(s => s.trim()).filter(Boolean))
      : [];
    return {
      id: raw.id || (source + '-' + Math.random().toString(36).slice(2, 9)),
      agencyId: raw.agencyId || raw.agency_id || null,
      company: raw.company || raw.agencyName || raw.agency || 'Agence partenaire',
      from: raw.from || raw.from_city || raw.origin || '',
      to: raw.to || raw.to_city || raw.destination || '',
      dep: raw.dep || raw.dep_time || raw.departure || raw.departureTime || '',
      arr: raw.arr || raw.arr_time || raw.arrival || raw.arrivalTime || '',
      duration: raw.duration || raw.durationText || '',
      price: Number(raw.price || raw.amount || 0),
      tags,
      seatCount: Number(raw.seatCount || raw.seat_count || raw.seats || 40),
      active: raw.active !== false,
      source: source || 'local',
      external: source === 'external'
    };
  }

  async function fetchExternalTrips(criteria) {
    const c = cfg();
    if (!c.externalEnabled || !c.baseUrl) return [];

    const from = (criteria && criteria.from) || '';
    const to = (criteria && criteria.to) || '';
    const date = (criteria && criteria.date) || '';
    const url = new URL(c.baseUrl.replace(/\/$/, '') + '/trips');
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (date) url.searchParams.set('date', date);

    const headers = { 'Accept': 'application/json' };
    if (c.apiKey) headers['Authorization'] = 'Bearer ' + c.apiKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), c.timeoutMs || 8000);

    try {
      const res = await fetch(url.toString(), { headers, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.trips || data.data || []);
      const prefix = c.externalIdPrefix || 'ext-';
      return list.map(item => {
        const n = normalizeTrip(item, 'external');
        if (n && n.id && !String(n.id).startsWith(prefix)) n.id = prefix + n.id;
        return n;
      }).filter(Boolean);
    } catch (e) {
      clearTimeout(timer);
      console.warn('[CAM travel Bus API] externe indisponible:', e.message || e);
      return [];
    }
  }

  /**
   * Recherche unifiée de trajets.
   * Utilise camtravelGetTrips (local/Supabase) + API externe si activée.
   */
  async function searchTrips(criteria) {
    criteria = criteria || {};
    const c = cfg();
    let local = [];

    if (typeof camtravelGetTrips === 'function') {
      try {
        local = await camtravelGetTrips(criteria) || [];
        local = local.map(t => normalizeTrip(t, t.source || 'catalog')).filter(Boolean);
      } catch (e) {
        console.warn('[Bus API] catalogue local/Supabase:', e);
      }
    }

    let external = [];
    if (c.externalEnabled) {
      external = await fetchExternalTrips(criteria);
    }

    if (!c.mergeWithLocal) {
      return external.length ? external : local;
    }

    // Fusion : éviter doublons company+from+to+dep
    const seen = new Set();
    const merged = [];
    for (const t of [...local, ...external]) {
      const key = [t.company, t.from, t.to, t.dep].join('|').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(t);
    }
    merged.sort((a, b) => String(a.dep).localeCompare(String(b.dep)));
    return merged;
  }

  async function getTripById(id) {
    if (!id) return null;
    if (typeof camtravelGetTripById === 'function') {
      const t = await camtravelGetTripById(id);
      if (t) return normalizeTrip(t, 'catalog');
    }
    // Tentative externe
    const c = cfg();
    if (c.externalEnabled && c.baseUrl) {
      try {
        const headers = { 'Accept': 'application/json' };
        if (c.apiKey) headers['Authorization'] = 'Bearer ' + c.apiKey;
        const res = await fetch(c.baseUrl.replace(/\/$/, '') + '/trips/' + encodeURIComponent(id), { headers });
        if (res.ok) {
          const data = await res.json();
          return normalizeTrip(data.trip || data, 'external');
        }
      } catch (e) {}
    }
    return null;
  }

  /** Statut de la couche API (pour admin / debug) */
  function status() {
    const c = cfg();
    return {
      local: true,
      supabase: typeof camtravelSupabaseReady === 'function' ? camtravelSupabaseReady() : false,
      externalEnabled: !!c.externalEnabled,
      externalConfigured: !!(c.externalEnabled && c.baseUrl),
      baseUrl: c.baseUrl || null
    };
  }

  window.camtravelBusApi = {
    searchTrips,
    getTripById,
    fetchExternalTrips,
    normalizeTrip,
    status
  };
})();
