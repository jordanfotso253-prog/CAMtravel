/**
 * CAM travel — Membres de service (agence / admin)
 * Rôles : chef_agence | caissier | hotesse | chauffeur
 */
(function () {
  const KEY = 'camtravel_staff';

  const ROLES = {
    chef_agence: { label: 'Chef d\'agence', color: '#1e3a5f' },
    caissier: { label: 'Caissier', color: '#0b5c3d' },
    hotesse: { label: 'Hôtesse', color: '#7c3aed' },
    chauffeur: { label: 'Chauffeur', color: '#c2410c' }
  };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  function uid() {
    return 'S' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function list(opts) {
    opts = opts || {};
    let items = load();
    if (opts.agencyId) items = items.filter(s => s.agencyId === opts.agencyId);
    if (opts.role) items = items.filter(s => s.role === opts.role);
    if (opts.activeOnly) items = items.filter(s => s.active !== false);
    return items.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
  }

  function add(member) {
    const entry = {
      id: uid(),
      nom: (member.nom || '').trim(),
      tel: (member.tel || '').trim(),
      email: (member.email || '').trim(),
      role: member.role || 'chauffeur',
      agencyId: member.agencyId || null,
      agencyName: member.agencyName || '',
      permis: (member.permis || '').trim(),
      notes: (member.notes || '').trim(),
      active: true,
      createdAt: new Date().toISOString()
    };
    if (!entry.nom) return { ok: false, reason: 'nom' };
    const all = load();
    all.unshift(entry);
    save(all);
    return { ok: true, entry };
  }

  function update(id, fields) {
    const all = load();
    const i = all.findIndex(s => s.id === id);
    if (i < 0) return { ok: false };
    all[i] = { ...all[i], ...fields, id: all[i].id };
    save(all);
    return { ok: true, entry: all[i] };
  }

  function remove(id) {
    save(load().filter(s => s.id !== id));
    return { ok: true };
  }

  function toggleActive(id) {
    const all = load();
    const i = all.findIndex(s => s.id === id);
    if (i < 0) return { ok: false };
    all[i].active = !all[i].active;
    save(all);
    return { ok: true, entry: all[i] };
  }

  function countByRole(agencyId) {
    const items = list(agencyId ? { agencyId } : {});
    const counts = { chef_agence: 0, caissier: 0, hotesse: 0, chauffeur: 0, total: items.length };
    items.forEach(s => { if (counts[s.role] !== undefined) counts[s.role]++; });
    return counts;
  }

  window.camtravelStaff = { ROLES, list, add, update, remove, toggleActive, countByRole, load };
})();
