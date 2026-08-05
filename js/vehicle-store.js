/**
 * Flotte de bus par agence — nom, matricule, places, VIP, plan de sièges
 */
(function () {
  const KEY = 'camtravel_vehicles';

  /** Plans réalistes type bus interurbain Cameroun */
  const LAYOUTS = {
    // Standard 2+2 (couloir central) — 10 rangées × 4 = 40 places
    standard_40: {
      id: 'standard_40',
      label: 'Standard 2+2 (40 places)',
      vip: false,
      seatCount: 40,
      // chaque rangée : [gauche..., null=couloir, droite...]
      rows: Array.from({ length: 10 }, (_, i) => {
        const r = i + 1;
        return [`${r}A`, `${r}B`, null, `${r}C`, `${r}D`];
      })
    },
    // Standard 2+2 — 12 rangées = 48 places
    standard_48: {
      id: 'standard_48',
      label: 'Standard 2+2 (48 places)',
      vip: false,
      seatCount: 48,
      rows: Array.from({ length: 12 }, (_, i) => {
        const r = i + 1;
        return [`${r}A`, `${r}B`, null, `${r}C`, `${r}D`];
      })
    },
    // VIP 2+1 — plus d'espace, 30 places (10 × 3)
    vip_30: {
      id: 'vip_30',
      label: 'VIP 2+1 (30 places)',
      vip: true,
      seatCount: 30,
      rows: Array.from({ length: 10 }, (_, i) => {
        const r = i + 1;
        return [`${r}A`, `${r}B`, null, `${r}C`];
      })
    },
    // VIP luxe 1+1 — 20 places
    vip_20: {
      id: 'vip_20',
      label: 'VIP Luxe 1+1 (20 places)',
      vip: true,
      seatCount: 20,
      rows: Array.from({ length: 10 }, (_, i) => {
        const r = i + 1;
        return [`${r}A`, null, `${r}B`];
      })
    },
    // Minibus 2+2 — 18 places
    mini_18: {
      id: 'mini_18',
      label: 'Minibus 2+2 (18 places)',
      vip: false,
      seatCount: 18,
      rows: Array.from({ length: 5 }, (_, i) => {
        const r = i + 1;
        return [`${r}A`, `${r}B`, null, `${r}C`, `${r}D`];
      })
    }
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  function uid() {
    return 'V' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function list(opts) {
    opts = opts || {};
    let items = load();
    if (opts.agencyId) items = items.filter(v => v.agencyId === opts.agencyId);
    if (opts.activeOnly) items = items.filter(v => v.active !== false);
    return items;
  }

  function get(id) {
    return load().find(v => v.id === id) || null;
  }

  function add(data) {
    const layout = LAYOUTS[data.layoutId] || LAYOUTS.standard_40;
    const entry = {
      id: uid(),
      name: (data.name || '').trim(),
      matricule: (data.matricule || '').trim().toUpperCase(),
      agencyId: data.agencyId || null,
      agencyName: data.agencyName || '',
      layoutId: layout.id,
      seatCount: layout.seatCount,
      vip: !!layout.vip,
      active: true,
      notes: (data.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    if (!entry.name) return { ok: false, reason: 'name' };
    if (!entry.matricule) return { ok: false, reason: 'matricule' };
    const all = load();
    all.unshift(entry);
    save(all);
    return { ok: true, entry };
  }

  function update(id, fields) {
    const all = load();
    const i = all.findIndex(v => v.id === id);
    if (i < 0) return { ok: false };
    if (fields.layoutId && LAYOUTS[fields.layoutId]) {
      const layout = LAYOUTS[fields.layoutId];
      fields.seatCount = layout.seatCount;
      fields.vip = layout.vip;
    }
    if (fields.matricule) fields.matricule = String(fields.matricule).trim().toUpperCase();
    all[i] = { ...all[i], ...fields, id: all[i].id };
    save(all);
    return { ok: true, entry: all[i] };
  }

  function remove(id) {
    save(load().filter(v => v.id !== id));
    return { ok: true };
  }

  function getLayout(layoutIdOrVehicle) {
    if (typeof layoutIdOrVehicle === 'object' && layoutIdOrVehicle) {
      return LAYOUTS[layoutIdOrVehicle.layoutId] || LAYOUTS.standard_40;
    }
    return LAYOUTS[layoutIdOrVehicle] || LAYOUTS.standard_40;
  }

  /** Liste plate des ids de sièges dans l'ordre */
  function seatIds(layoutIdOrVehicle) {
    const layout = getLayout(layoutIdOrVehicle);
    const ids = [];
    layout.rows.forEach(row => {
      row.forEach(cell => { if (cell) ids.push(cell); });
    });
    return ids;
  }

  window.camtravelVehicles = {
    LAYOUTS, list, get, add, update, remove, getLayout, seatIds, load
  };
})();
