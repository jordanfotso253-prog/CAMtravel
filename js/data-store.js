/**
 * Module de données CAM travel.
 * - Si Supabase est configuré (js/supabase-config.js rempli) : les
 *   données sont partagées en ligne, visibles depuis n'importe quel
 *   appareil.
 * - Sinon : repli automatique sur le stockage local du navigateur
 *   (comme avant), pour que le site continue de fonctionner pendant
 *   que vous configurez Supabase.
 */

const CAMTRAVEL_USERS_KEY = 'camtravel_users';
const CAMTRAVEL_RESERVATIONS_KEY = 'camtravel_reservations';
const CAMTRAVEL_COLIS_KEY = 'camtravel_colis';
const CAMTRAVEL_LAST_SEEN_KEY = 'camtravel_admin_last_seen';
// File d'attente des ventes guichet non encore envoyées à Supabase
// (connexion instable au Cameroun : on vend d'abord en local, on sync plus tard).
const CAMTRAVEL_PENDING_RESERVATIONS_KEY = 'camtravel_pending_reservations';

function camtravelSupabaseReady() {
  return window.CAMTRAVEL_SUPABASE_ENABLED === true && window.camtravelSupabase;
}

// Utilisateur actuellement connecté (session Supabase), ou null si
// personne n'est connecté / Supabase non configuré.
async function camtravelGetCurrentUser() {
  if (!camtravelSupabaseReady()) return null;
  try {
    const { data, error } = await window.camtravelSupabase.auth.getUser();
    if (error) throw error;
    return data.user || null;
  } catch (e) {
    console.warn('Impossible de récupérer la session en cours.', e);
    return null;
  }
}

function camtravelLocalGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch (e) { return []; }
}
function camtravelLocalAdd(key, entry) {
  const list = camtravelLocalGet(key);
  list.unshift(entry);
  localStorage.setItem(key, JSON.stringify(list));
}

// ---------- Correspondance lignes Supabase (snake_case) <-> objets JS (camelCase) ----------
function camtravelMapUserRow(row) {
  return { id: row.id, uid: row.id, nom: row.nom, tel: row.tel, email: row.email, ville: row.ville, avatarData: row.avatar_data, createdAt: row.created_at };
}
function camtravelMapReservationRow(row) {
  return {
    id: row.id, ref: row.ref, company: row.company,
    from: row.from_city, to: row.to_city, date: row.travel_date, dep: row.dep,
    price: row.price, passagers: row.passagers, total: row.total,
    passagerNom: row.passager_nom, passagerTel: row.passager_tel,
    method: row.method, methodLabel: row.method_label,
    used: row.used, usedAt: row.used_at, createdAt: row.created_at,
    tripId: row.trip_id, seatNumbers: row.seat_numbers,
    refundStatus: row.refund_status, refundReason: row.refund_reason, refundRequestedAt: row.refund_requested_at,
    // Association agence + vente guichet + sync hors ligne
    source: row.source || 'web',
    soldByAgencyId: row.sold_by_agency_id || null,
    clientLocalId: row.client_local_id || null,
    syncedAt: row.synced_at || null
  };
}
function camtravelMapTripRow(row) {
  return {
    id: row.id, agencyId: row.agency_id,
    company: row.agencies ? row.agencies.name : 'Agence partenaire',
    from: row.from_city, to: row.to_city,
    dep: row.dep_time, arr: row.arr_time, duration: row.duration,
    price: row.price, tags: (row.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    seatCount: row.seat_count,
    // Sièges réservés au guichet (non proposés en ligne)
    agencyQuota: row.agency_quota != null ? Number(row.agency_quota) : 10,
    active: row.active, createdAt: row.created_at
  };
}

/** Nombre de sièges visibles / vendables sur le web (hors quota guichet). */
function camtravelWebSeatLimit(tripOrSeatCount, agencyQuota) {
  const total = typeof tripOrSeatCount === 'object'
    ? (Number(tripOrSeatCount.seatCount) || 40)
    : (Number(tripOrSeatCount) || 40);
  const quota = typeof tripOrSeatCount === 'object'
    ? Math.min(Math.max(Number(tripOrSeatCount.agencyQuota) || 10, 0), total)
    : Math.min(Math.max(Number(agencyQuota) || 10, 0), total);
  return Math.max(0, total - quota);
}
function camtravelMapColisRow(row) {
  return {
    id: row.id, ref: row.ref, depart: row.depart, arrivee: row.arrivee,
    poids: row.poids, typeColis: row.type_colis,
    nomExp: row.nom_exp, telExp: row.tel_exp,
    nomDest: row.nom_dest, telDest: row.tel_dest,
    montant: row.montant, createdAt: row.created_at
  };
}
function camtravelMapPassengerRow(row) {
  return {
    id: row.id, nom: row.nom, tel: row.tel, email: row.email,
    piece: row.piece, pieceNum: row.piece_num, photoData: row.photo_data,
    trajet: row.trajet, date: row.travel_date, createdAt: row.created_at
  };
}

// ---------- UTILISATEURS ----------
async function camtravelSaveUser(user) {
  if (camtravelSupabaseReady() && user.uid) {
    try {
      const row = { id: user.uid, nom: user.nom, tel: user.tel, email: user.email, ville: user.ville };
      const { error } = await window.camtravelSupabase.from('profiles').insert(row);
      if (error) throw error;
      return { ok: true, mode: 'supabase' };
    } catch (e) {
      console.warn('Supabase indisponible, sauvegarde locale de secours.', e);
    }
  }
  const entry = { ...user, createdAt: new Date().toISOString() };
  camtravelLocalAdd(CAMTRAVEL_USERS_KEY, { ...entry, id: 'U' + Date.now() });
  return { ok: true, mode: 'local' };
}

// Profil de la personne CONNECTÉE uniquement (page "Mon profil") — à ne
// pas confondre avec camtravelGetUsers() qui liste tous les clients
// (utilisé par le tableau de bord admin).
async function camtravelGetMyProfile() {
  if (camtravelSupabaseReady()) {
    const user = await camtravelGetCurrentUser();
    if (!user) return null;
    try {
      const { data, error } = await window.camtravelSupabase
        .from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (error) throw error;
      return data ? camtravelMapUserRow(data) : { id: user.id, uid: user.id, nom: '', tel: '', email: user.email || '', ville: '', avatarData: null };
    } catch (e) {
      console.warn('Supabase indisponible, impossible de charger le profil.', e);
      return null;
    }
  }
  // Mode démo local : profil du dernier compte créé sur cet appareil.
  const local = camtravelLocalGet(CAMTRAVEL_USERS_KEY);
  return local[0] || null;
}

async function camtravelUpdateMyProfile(fields) {
  if (camtravelSupabaseReady()) {
    const user = await camtravelGetCurrentUser();
    if (user) {
      try {
        const row = {
          id: user.id, nom: fields.nom, tel: fields.tel,
          email: fields.email, ville: fields.ville,
          avatar_data: fields.avatarData || null
        };
        const { error } = await window.camtravelSupabase.from('profiles').upsert(row);
        if (error) throw error;
        return { ok: true, mode: 'supabase' };
      } catch (e) {
        console.warn('Supabase indisponible, enregistrement du profil impossible.', e);
        return { ok: false, mode: 'supabase' };
      }
    }
  }
  // Mode démo local : met à jour le dernier compte créé sur cet appareil.
  const local = camtravelLocalGet(CAMTRAVEL_USERS_KEY);
  if (local[0]) {
    local[0] = { ...local[0], nom: fields.nom, tel: fields.tel, email: fields.email, ville: fields.ville, avatarData: fields.avatarData };
    localStorage.setItem(CAMTRAVEL_USERS_KEY, JSON.stringify(local));
    return { ok: true, mode: 'local' };
  }
  return { ok: false, mode: 'local' };
}

// Suppression définitive du compte connecté (page Paramètres > Zone
// sensible). Supprime le compte d'authentification via une fonction
// SQL dédiée (voir supabase-schema.sql) ; sa ligne "profiles" est
// supprimée automatiquement avec (ON DELETE CASCADE).
async function camtravelDeleteOwnAccount() {
  if (!camtravelSupabaseReady()) return { ok: false, reason: 'no-supabase' };
  const user = await camtravelGetCurrentUser();
  if (!user) return { ok: false, reason: 'no-session' };
  try {
    const { error } = await window.camtravelSupabase.rpc('camtravel_delete_own_account');
    if (error) throw error;
    await window.camtravelSupabase.auth.signOut();
    return { ok: true };
  } catch (e) {
    console.warn('Suppression de compte impossible.', e);
    return { ok: false, reason: 'error', error: e };
  }
}

async function camtravelGetUsers() {
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data.map(camtravelMapUserRow);
    } catch (e) {
      console.warn('Supabase indisponible, lecture locale de secours.', e);
    }
  }
  return camtravelLocalGet(CAMTRAVEL_USERS_KEY);
}

// ---------- FILE D'ATTENTE HORS LIGNE (ventes agence / guichet) ----------
function camtravelNewLocalId() {
  return 'L' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

function camtravelGetPendingReservations() {
  return camtravelLocalGet(CAMTRAVEL_PENDING_RESERVATIONS_KEY);
}

function camtravelSetPendingReservations(list) {
  localStorage.setItem(CAMTRAVEL_PENDING_RESERVATIONS_KEY, JSON.stringify(list || []));
}

function camtravelGetPendingReservationsCount() {
  return camtravelGetPendingReservations().length;
}

/** Ajoute (ou remplace) une vente dans la file d'attente, sans doublon. */
function camtravelEnqueuePendingReservation(entry) {
  const list = camtravelGetPendingReservations().filter(
    r => r.clientLocalId !== entry.clientLocalId
  );
  list.unshift(entry);
  camtravelSetPendingReservations(list);
}

function camtravelRemovePendingReservation(clientLocalId) {
  camtravelSetPendingReservations(
    camtravelGetPendingReservations().filter(r => r.clientLocalId !== clientLocalId)
  );
}

/**
 * Envoie UNE vente de la file vers Supabase via la RPC idempotente
 * camtravel_sync_agency_reservation (schéma SQL).
 */
async function camtravelSyncOnePendingReservation(r) {
  if (!camtravelSupabaseReady()) {
    throw new Error('Supabase non configuré');
  }
  const { data, error } = await window.camtravelSupabase.rpc('camtravel_sync_agency_reservation', {
    p_client_local_id: r.clientLocalId,
    p_ref: r.ref || null,
    p_company: r.company || null,
    p_from_city: r.from || null,
    p_to_city: r.to || null,
    p_travel_date: r.date || null,
    p_dep: r.dep || null,
    p_price: r.price != null ? Number(r.price) : null,
    p_passagers: r.passagers != null ? Number(r.passagers) : 1,
    p_total: r.total != null ? Number(r.total) : null,
    p_passager_nom: r.passagerNom || null,
    p_passager_tel: r.passagerTel || null,
    p_method: r.method || null,
    p_method_label: r.methodLabel || null,
    p_trip_id: r.tripId || null,
    p_seat_numbers: r.seatNumbers || null,
    p_sold_by_agency_id: r.soldByAgencyId || null,
    p_created_at: r.createdAt || null
  });
  if (error) throw error;
  return data;
}

/**
 * Vide la file d'attente vers Supabase.
 * Appelée au retour du réseau, au chargement de page, et périodiquement.
 * @returns {{ ok: boolean, synced: number, remaining: number, errors?: string[] }}
 */
async function camtravelFlushPendingReservations() {
  const pending = camtravelGetPendingReservations();
  if (pending.length === 0) {
    return { ok: true, synced: 0, remaining: 0 };
  }
  if (!camtravelSupabaseReady()) {
    return { ok: false, synced: 0, remaining: pending.length, errors: ['no-supabase'] };
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, synced: 0, remaining: pending.length, errors: ['offline'] };
  }

  let synced = 0;
  const stillPending = [];
  const errors = [];

  for (const r of pending) {
    try {
      await camtravelSyncOnePendingReservation(r);
      synced++;
      // Marque la copie locale comme synchronisée (historique guichet)
      try {
        const local = camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
        const idx = local.findIndex(x => x.clientLocalId === r.clientLocalId);
        if (idx >= 0) {
          local[idx] = { ...local[idx], syncedAt: new Date().toISOString(), pending: false };
          localStorage.setItem(CAMTRAVEL_RESERVATIONS_KEY, JSON.stringify(local));
        }
      } catch (_) { /* ignore */ }
    } catch (e) {
      console.warn('Sync vente agence échouée pour', r.clientLocalId, e);
      stillPending.push(r);
      errors.push((e && e.message) ? e.message : String(e));
    }
  }

  camtravelSetPendingReservations(stillPending);

  if (synced > 0) {
    try {
      window.dispatchEvent(new CustomEvent('camtravel:pending-synced', {
        detail: { synced, remaining: stillPending.length }
      }));
    } catch (_) { /* navigateurs très anciens */ }
  }

  return {
    ok: stillPending.length === 0,
    synced,
    remaining: stillPending.length,
    errors: errors.length ? errors : undefined
  };
}

/**
 * Démarre l'écoute du réseau + tentatives périodiques.
 * Idempotent (une seule fois par chargement de page).
 */
function camtravelStartPendingSyncWatcher() {
  if (typeof window === 'undefined' || window.__camtravelPendingWatcher) return;
  window.__camtravelPendingWatcher = true;

  window.addEventListener('online', () => {
    camtravelFlushPendingReservations();
  });

  // Première tentative après chargement (session / Supabase prêts)
  setTimeout(() => { camtravelFlushPendingReservations(); }, 1800);

  // Relance toutes les 60 s s'il reste des ventes en attente
  setInterval(() => {
    if (camtravelGetPendingReservations().length === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    camtravelFlushPendingReservations();
  }, 60000);
}

camtravelStartPendingSyncWatcher();

// ---------- RÉSERVATIONS (billets) ----------
async function camtravelSaveReservation(reservation) {
  const isAgency =
    reservation.source === 'agency' || !!reservation.soldByAgencyId;

  // ----- Vente guichet / agence : toujours local + file d'attente -----
  if (isAgency) {
    const entry = {
      ...reservation,
      source: 'agency',
      clientLocalId: reservation.clientLocalId || camtravelNewLocalId(),
      createdAt: reservation.createdAt || new Date().toISOString(),
      id: reservation.id || ('R' + Date.now()),
      pending: true
    };

    // Historique local (visible même hors ligne)
    const local = camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
    if (!local.some(x => x.clientLocalId === entry.clientLocalId)) {
      camtravelLocalAdd(CAMTRAVEL_RESERVATIONS_KEY, entry);
    }

    camtravelEnqueuePendingReservation(entry);

    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    if (camtravelSupabaseReady() && online) {
      try {
        await camtravelSyncOnePendingReservation(entry);
        camtravelRemovePendingReservation(entry.clientLocalId);
        try {
          const list = camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
          const idx = list.findIndex(x => x.clientLocalId === entry.clientLocalId);
          if (idx >= 0) {
            list[idx] = { ...list[idx], syncedAt: new Date().toISOString(), pending: false };
            localStorage.setItem(CAMTRAVEL_RESERVATIONS_KEY, JSON.stringify(list));
          }
        } catch (_) { /* ignore */ }
        return { ok: true, mode: 'supabase', clientLocalId: entry.clientLocalId };
      } catch (e) {
        console.warn("Vente agence enregistrée en file d'attente (sync plus tard).", e);
        return { ok: true, mode: 'pending', clientLocalId: entry.clientLocalId };
      }
    }

    return { ok: true, mode: 'pending', clientLocalId: entry.clientLocalId };
  }

  // ----- Réservation web (client) : comportement inchangé -----
  if (camtravelSupabaseReady()) {
    try {
      const currentUser = await camtravelGetCurrentUser();
      const row = {
        ref: reservation.ref, company: reservation.company,
        from_city: reservation.from, to_city: reservation.to,
        travel_date: reservation.date, dep: reservation.dep,
        price: reservation.price, passagers: reservation.passagers, total: reservation.total,
        passager_nom: reservation.passagerNom, passager_tel: reservation.passagerTel,
        method: reservation.method, method_label: reservation.methodLabel,
        user_id: currentUser ? currentUser.id : null,
        trip_id: reservation.tripId || null,
        seat_numbers: reservation.seatNumbers || null,
        source: reservation.source || 'web',
        sold_by_agency_id: reservation.soldByAgencyId || null,
        client_local_id: reservation.clientLocalId || null,
        synced_at: reservation.syncedAt || null
      };
      const { error } = await window.camtravelSupabase.from('reservations').insert(row);
      if (error) throw error;
      return { ok: true, mode: 'supabase' };
    } catch (e) {
      console.warn('Supabase indisponible, sauvegarde locale de secours.', e);
    }
  }
  const entry = { ...reservation, createdAt: new Date().toISOString() };
  camtravelLocalAdd(CAMTRAVEL_RESERVATIONS_KEY, { ...entry, id: 'R' + Date.now() });
  return { ok: true, mode: 'local' };
}

// Passez { onlyMine: true } depuis les pages "Mes réservations",
// "Mes trajets" et "Paiements" pour ne récupérer QUE les réservations
// de la personne connectée (au lieu de celles de tous les clients,
// utilisé par le tableau de bord admin).
async function camtravelGetReservations(opts) {
  const onlyMine = !!(opts && opts.onlyMine);
  if (camtravelSupabaseReady()) {
    try {
      if (onlyMine) {
        const user = await camtravelGetCurrentUser();
        if (!user) return [];
        const { data, error } = await window.camtravelSupabase
          .from('reservations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(camtravelMapReservationRow);
      }
      const { data, error } = await window.camtravelSupabase
        .from('reservations').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data.map(camtravelMapReservationRow);
    } catch (e) {
      console.warn('Supabase indisponible, lecture locale de secours.', e);
    }
  }
  // Mode démo local : une seule "personne" possible sur l'appareil, donc
  // onlyMine ne change rien ici.
  return camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
}

// Supprime une réservation de l'historique (utilisé par la page
// Paiements pour retirer une entrée).
async function camtravelDeleteReservation(id) {
  if (camtravelSupabaseReady()) {
    try {
      const { error } = await window.camtravelSupabase.from('reservations').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Suppression Supabase impossible.', e);
      return false;
    }
  }
  const all = camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
  localStorage.setItem(CAMTRAVEL_RESERVATIONS_KEY, JSON.stringify(all.filter(r => r.id !== id)));
  return true;
}

// ---------- COLIS (expéditions) ----------
async function camtravelSaveColis(colis) {
  if (camtravelSupabaseReady()) {
    try {
      const row = {
        ref: colis.ref, depart: colis.depart, arrivee: colis.arrivee,
        poids: colis.poids, type_colis: colis.typeColis,
        nom_exp: colis.nomExp, tel_exp: colis.telExp,
        nom_dest: colis.nomDest, tel_dest: colis.telDest,
        montant: colis.montant
      };
      const { error } = await window.camtravelSupabase.from('colis').insert(row);
      if (error) throw error;
      return { ok: true, mode: 'supabase' };
    } catch (e) {
      console.warn('Supabase indisponible, sauvegarde locale de secours.', e);
    }
  }
  const entry = { ...colis, createdAt: new Date().toISOString() };
  camtravelLocalAdd(CAMTRAVEL_COLIS_KEY, { ...entry, id: 'C' + Date.now() });
  return { ok: true, mode: 'local' };
}

async function camtravelGetColis() {
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('colis').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data.map(camtravelMapColisRow);
    } catch (e) {
      console.warn('Supabase indisponible, lecture locale de secours.', e);
    }
  }
  return camtravelLocalGet(CAMTRAVEL_COLIS_KEY);
}

// ---------- PASSAGERS (infos + photo pièce d'identité) ----------
async function camtravelSavePassenger(passenger) {
  if (camtravelSupabaseReady()) {
    try {
      const row = {
        nom: passenger.nom, tel: passenger.tel, email: passenger.email,
        piece: passenger.piece, piece_num: passenger.pieceNum,
        photo_data: passenger.photoData, trajet: passenger.trajet,
        travel_date: passenger.date
      };
      const { error } = await window.camtravelSupabase.from('passengers').insert(row);
      if (error) throw error;
      return { ok: true, mode: 'supabase' };
    } catch (e) {
      console.warn('Supabase indisponible, sauvegarde locale de secours.', e);
    }
  }
  // Repli local : les photos étant volumineuses, on les limite pour éviter
  // de saturer le localStorage du navigateur (quota ~5-10 Mo).
  try {
    const entry = { ...passenger, createdAt: new Date().toISOString() };
    camtravelLocalAdd('camtravel_passengers', { ...entry, id: 'P' + Date.now() });
  } catch (e) {
    console.warn('Stockage local plein, photo non sauvegardée localement.', e);
  }
  return { ok: true, mode: 'local' };
}

async function camtravelGetPassengers() {
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('passengers').select('*').order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      return data.map(camtravelMapPassengerRow);
    } catch (e) {
      console.warn('Supabase indisponible, lecture locale de secours.', e);
    }
  }
  return camtravelLocalGet('camtravel_passengers');
}

// ---------- VÉRIFICATION DE TICKET (sécurité anti-fraude / anti-réutilisation) ----------
async function camtravelFindReservationByRef(ref) {
  const cleanRef = (ref || '').trim().toUpperCase();
  if (!cleanRef) return null;

  if (camtravelSupabaseReady()) {
    try {
      // Passe par une fonction RPC dédiée (voir supabase-schema.sql) :
      // "reservations" est maintenant réservée au propriétaire/admin/
      // agence, alors que la vérification de ticket doit rester possible
      // sans compte. La fonction ne renvoie qu'UNE référence exacte à la
      // fois (impossible de lister toutes les réservations avec).
      const { data, error } = await window.camtravelSupabase
        .rpc('camtravel_find_reservation_by_ref', { p_ref: cleanRef });
      if (error) throw error;
      return data && data.length > 0 ? camtravelMapReservationRow(data[0]) : null;
    } catch (e) {
      console.warn('Supabase indisponible, recherche locale de secours.', e);
    }
  }
  const all = camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
  return all.find(r => (r.ref || '').toUpperCase() === cleanRef) || null;
}

async function camtravelMarkTicketUsed(reservationId) {
  if (camtravelSupabaseReady()) {
    try {
      // Passe par une fonction RPC dédiée (voir supabase-schema.sql) qui
      // reste appelable sans compte comme aujourd'hui (page contrôleur),
      // mais qui ne peut QUE changer used/used_at, jamais le prix, le
      // passager ou une autre colonne.
      const { data, error } = await window.camtravelSupabase
        .rpc('camtravel_mark_ticket_used', { p_reservation_id: reservationId });
      if (error) throw error;
      return !!data;
    } catch (e) {
      console.warn('Supabase indisponible, mise à jour locale de secours.', e);
    }
  }
  const all = camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
  const idx = all.findIndex(r => r.id === reservationId);
  if (idx >= 0) {
    all[idx].used = true;
    all[idx].usedAt = new Date().toISOString();
    localStorage.setItem(CAMTRAVEL_RESERVATIONS_KEY, JSON.stringify(all));
    return true;
  }
  return false;
}

// ---------- COMPTES ADMIN (rôle) ----------
async function camtravelIsAdminEmail(email) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('admins').select('is_admin').eq('email', cleanEmail).maybeSingle();
      if (error) throw error;
      return !!(data && data.is_admin);
    } catch (e) {
      console.warn('Supabase indisponible pour la vérification admin.', e);
      return false;
    }
  }
  // Mode démo local : pas de vraie vérification possible sans Supabase configuré.
  return true;
}

// ---------- Notifications admin (marqueur "vu", toujours local à l'appareil admin) ----------
async function camtravelGetUnseenCount() {
  const lastSeen = localStorage.getItem(CAMTRAVEL_LAST_SEEN_KEY) || '1970-01-01T00:00:00.000Z';
  const [users, reservations, colis] = await Promise.all([
    camtravelGetUsers(), camtravelGetReservations(), camtravelGetColis()
  ]);
  const count = users.filter(u => u.createdAt > lastSeen).length
    + reservations.filter(r => r.createdAt > lastSeen).length
    + colis.filter(c => c.createdAt > lastSeen).length;
  return count;
}

function camtravelMarkAllSeen() {
  localStorage.setItem(CAMTRAVEL_LAST_SEEN_KEY, new Date().toISOString());
}

// ---------- Notifications client (marqueur "vu", par compte client) ----------
function camtravelGetClientLastSeen(userId) {
  return localStorage.getItem('camtravel_client_last_seen_' + userId) || '1970-01-01T00:00:00.000Z';
}

function camtravelMarkClientAllSeen(userId) {
  localStorage.setItem('camtravel_client_last_seen_' + userId, new Date().toISOString());
}

// ---------- TRAJETS (recherche publique, remplace l'ancien tableau en dur) ----------
async function camtravelGetTrips(criteria) {
  if (!camtravelSupabaseReady()) return [];
  const from = criteria && criteria.from;
  const to = criteria && criteria.to;
  try {
    let query = window.camtravelSupabase.from('trips').select('*, agencies(name)').eq('active', true);
    if (from) query = query.eq('from_city', from);
    if (to) query = query.eq('to_city', to);
    const { data, error } = await query.order('dep_time', { ascending: true });
    if (error) throw error;
    return data.map(camtravelMapTripRow);
  } catch (e) {
    console.warn('Supabase indisponible pour la recherche de trajets.', e);
    return [];
  }
}

async function camtravelGetTripById(id) {
  if (!camtravelSupabaseReady() || !id) return null;
  try {
    const { data, error } = await window.camtravelSupabase
      .from('trips').select('*, agencies(name)').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? camtravelMapTripRow(data) : null;
  } catch (e) {
    console.warn('Supabase indisponible pour charger ce trajet.', e);
    return null;
  }
}

// Sièges déjà pris pour CE trajet à CETTE date précise (une même ligne
// roule tous les jours ; ce sont les places du jour choisi qui comptent).
async function camtravelGetOccupiedSeats(tripId, travelDate) {
  if (!camtravelSupabaseReady() || !tripId) return [];
  try {
    // Passe par une fonction RPC dédiée (voir supabase-schema.sql) plutôt
    // que par une lecture directe de "reservations" : celle-ci est
    // maintenant réservée au propriétaire/admin/agence, alors que cette
    // page doit rester consultable sans compte. La fonction ne renvoie
    // que les numéros de sièges, jamais les infos passager.
    const { data, error } = await window.camtravelSupabase
      .rpc('camtravel_get_occupied_seats', { p_trip_id: tripId, p_travel_date: travelDate });
    if (error) throw error;
    const occupied = [];
    (data || []).forEach(r => {
      (r.seat_numbers || '').split(',').forEach(s => {
        const n = parseInt(s.trim(), 10);
        if (!isNaN(n)) occupied.push(n);
      });
    });
    return occupied;
  } catch (e) {
    console.warn('Impossible de charger les sièges occupés.', e);
    return [];
  }
}

// ---------- AGENCES ----------
// Agence correspondant au compte actuellement connecté (agency-dashboard.html).
async function camtravelGetMyAgency() {
  if (!camtravelSupabaseReady()) return null;
  const user = await camtravelGetCurrentUser();
  if (!user || !user.email) return null;
  const email = user.email.toLowerCase();
  try {
    // 1) Ancien mode : email directement sur agencies
    const { data, error } = await window.camtravelSupabase
      .from('agencies').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    if (data) return data;

    // 2) Nouveau mode : membre actif dans agency_members
    const membership = await camtravelGetMyMembership();
    if (membership && membership.agency_id && membership.status === 'active') {
      const { data: agency, error: aErr } = await window.camtravelSupabase
        .from('agencies').select('*').eq('id', membership.agency_id).maybeSingle();
      if (aErr) throw aErr;
      if (agency) {
        agency._membership = membership;
        return agency;
      }
    }
    return null;
  } catch (e) {
    console.warn('Supabase indisponible pour charger l\'agence.', e);
    return null;
  }
}

// Toutes les agences (page admin "agencies.html").
async function camtravelGetAgencies() {
  if (!camtravelSupabaseReady()) return [];
  try {
    const { data, error } = await window.camtravelSupabase
      .from('agencies').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('Supabase indisponible pour charger les agences.', e);
    return [];
  }
}

async function camtravelSaveAgency(agency) {
  if (!camtravelSupabaseReady()) return { ok: false };
  try {
    const row = {
      name: agency.name, email: agency.email ? agency.email.toLowerCase() : null,
      tel: agency.tel, ville: agency.ville,
      commission_percent: agency.commissionPercent
    };
    const { error } = await window.camtravelSupabase.from('agencies').insert(row);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn("Impossible d'ajouter l'agence.", e);
    return { ok: false };
  }
}

async function camtravelUpdateAgencyStatus(id, status) {
  if (!camtravelSupabaseReady()) return false;
  try {
    const { error } = await window.camtravelSupabase.from('agencies').update({ status }).eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Impossible de mettre à jour l'agence.", e);
    return false;
  }
}

// ---------- TRAJETS D'UNE AGENCE (agency-dashboard.html) ----------
async function camtravelGetAgencyTrips(agencyId) {
  if (!camtravelSupabaseReady() || !agencyId) return [];
  try {
    const { data, error } = await window.camtravelSupabase
      .from('trips').select('*').eq('agency_id', agencyId).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(camtravelMapTripRow);
  } catch (e) {
    console.warn('Impossible de charger les trajets de l\'agence.', e);
    return [];
  }
}

async function camtravelSaveTrip(trip) {
  if (!camtravelSupabaseReady()) return { ok: false };
  try {
    const seatCount = trip.seatCount || 40;
    let agencyQuota = trip.agencyQuota != null ? Number(trip.agencyQuota) : 10;
    if (isNaN(agencyQuota) || agencyQuota < 0) agencyQuota = 10;
    if (agencyQuota > seatCount) agencyQuota = seatCount;
    const row = {
      agency_id: trip.agencyId, from_city: trip.from, to_city: trip.to,
      dep_time: trip.dep, arr_time: trip.arr, duration: trip.duration,
      price: trip.price, tags: trip.tags,
      seat_count: seatCount,
      agency_quota: agencyQuota
    };
    const { error } = await window.camtravelSupabase.from('trips').insert(row);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn("Impossible d'ajouter le trajet.", e);
    return { ok: false };
  }
}

/**
 * Sièges occupés pour un trajet + date, y compris les ventes encore
 * en file d'attente sur CE poste (hors ligne).
 */
async function camtravelGetOccupiedSeatsIncludingPending(tripId, travelDate) {
  const occupied = typeof camtravelGetOccupiedSeats === 'function'
    ? await camtravelGetOccupiedSeats(tripId, travelDate)
    : [];
  const pending = camtravelGetPendingReservations().filter(
    r => r.tripId === tripId && String(r.date) === String(travelDate)
  );
  pending.forEach(r => {
    String(r.seatNumbers || '').split(',').forEach(s => {
      const n = parseInt(s.trim(), 10);
      if (!isNaN(n)) occupied.push(n);
    });
  });
  return [...new Set(occupied)];
}

async function camtravelUpdateTripActive(id, active) {
  if (!camtravelSupabaseReady()) return false;
  try {
    const { error } = await window.camtravelSupabase.from('trips').update({ active }).eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Impossible de mettre à jour le trajet.', e);
    return false;
  }
}

async function camtravelDeleteTrip(id) {
  if (!camtravelSupabaseReady()) return false;
  try {
    const { error } = await window.camtravelSupabase.from('trips').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Impossible de supprimer le trajet.', e);
    return false;
  }
}

// Réservations touchant les trajets d'UNE agence (deux requêtes simples
// au lieu d'une jointure, pour rester compatible avec toutes les versions
// de Supabase sans configuration supplémentaire).
// Fusionne aussi les ventes encore en file d'attente hors ligne sur CE poste,
// pour que le guichet les voie immédiatement même sans Internet.
async function camtravelGetAgencyReservations(agencyId) {
  const pendingForAgency = () => camtravelGetPendingReservations()
    .filter(r => !agencyId || r.soldByAgencyId === agencyId)
    .map(r => ({ ...r, pending: true, source: r.source || 'agency' }));

  if (!camtravelSupabaseReady() || !agencyId) {
    return pendingForAgency();
  }
  try {
    const { data: trips, error: tripsError } = await window.camtravelSupabase
      .from('trips').select('id').eq('agency_id', agencyId);
    if (tripsError) throw tripsError;
    const tripIds = (trips || []).map(t => t.id);

    let remote = [];
    if (tripIds.length > 0) {
      const { data, error } = await window.camtravelSupabase
        .from('reservations').select('*').in('trip_id', tripIds).order('created_at', { ascending: false });
      if (error) throw error;
      remote = data.map(camtravelMapReservationRow);
    }

    // Aussi les ventes liées à l'agence via sold_by_agency_id (sans trip_id)
    try {
      const { data: byAgency, error: byAgencyErr } = await window.camtravelSupabase
        .from('reservations')
        .select('*')
        .eq('sold_by_agency_id', agencyId)
        .order('created_at', { ascending: false });
      if (!byAgencyErr && byAgency) {
        const seen = new Set(remote.map(r => r.id));
        byAgency.map(camtravelMapReservationRow).forEach(r => {
          if (!seen.has(r.id)) remote.push(r);
        });
      }
    } catch (_) { /* colonne absente si schéma pas encore mis à jour */ }

    const pending = pendingForAgency();
    const remoteLocalIds = new Set(remote.map(r => r.clientLocalId).filter(Boolean));
    const onlyPending = pending.filter(r => !remoteLocalIds.has(r.clientLocalId));

    return [...onlyPending, ...remote].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  } catch (e) {
    console.warn("Impossible de charger les réservations de l'agence.", e);
    return pendingForAgency();
  }
}

// ---------- COMMISSIONS (page admin "commissions.html") ----------
async function camtravelGetCommissionsReport() {
  if (!camtravelSupabaseReady()) return [];
  try {
    const [agenciesRes, tripsRes, reservationsRes] = await Promise.all([
      window.camtravelSupabase.from('agencies').select('*'),
      window.camtravelSupabase.from('trips').select('id, agency_id'),
      window.camtravelSupabase.from('reservations').select('trip_id, total').not('trip_id', 'is', null)
    ]);
    if (agenciesRes.error) throw agenciesRes.error;
    if (tripsRes.error) throw tripsRes.error;
    if (reservationsRes.error) throw reservationsRes.error;

    const tripToAgency = new Map((tripsRes.data || []).map(t => [t.id, t.agency_id]));
    const revenueByAgency = new Map();
    (reservationsRes.data || []).forEach(r => {
      const agencyId = tripToAgency.get(r.trip_id);
      if (!agencyId) return;
      revenueByAgency.set(agencyId, (revenueByAgency.get(agencyId) || 0) + Number(r.total || 0));
    });

    return (agenciesRes.data || []).map(a => {
      const revenue = revenueByAgency.get(a.id) || 0;
      const commissionPercent = Number(a.commission_percent) || 0;
      const commission = Math.round(revenue * commissionPercent / 100);
      return {
        id: a.id, name: a.name, status: a.status, commissionPercent,
        revenue, commission, net: revenue - commission
      };
    }).sort((x, y) => y.revenue - x.revenue);
  } catch (e) {
    console.warn('Impossible de calculer les commissions.', e);
    return [];
  }
}

// ---------- REMBOURSEMENTS ----------
async function camtravelRequestRefund(reservationId, reason) {
  if (!camtravelSupabaseReady()) return false;
  try {
    // Passe par une fonction RPC dédiée (voir supabase-schema.sql) qui
    // vérifie que la réservation appartient bien à la personne connectée
    // AVANT de modifier les champs de remboursement — impossible de
    // modifier used/prix/etc. ni la réservation de quelqu'un d'autre.
    const { data, error } = await window.camtravelSupabase
      .rpc('camtravel_request_refund', { p_reservation_id: reservationId, p_reason: reason || null });
    if (error) throw error;
    return !!data;
  } catch (e) {
    console.warn('Impossible de demander le remboursement.', e);
    return false;
  }
}

async function camtravelSetRefundStatus(reservationId, status) {
  if (!camtravelSupabaseReady()) return false;
  try {
    const { error } = await window.camtravelSupabase
      .from('reservations').update({ refund_status: status }).eq('id', reservationId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Impossible de mettre à jour le remboursement.', e);
    return false;
  }
}

// ---------- ÉQUIPE AGENCE (membres, licenciements, historique) ----------
function camtravelMapMemberRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    agencyId: row.agency_id,
    branchId: row.branch_id,
    counterId: row.counter_id,
    email: row.email,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    hiredAt: row.hired_at,
    terminatedAt: row.terminated_at,
    terminationReason: row.termination_reason,
    terminationNote: row.termination_note,
    createdAt: row.created_at
  };
}

/** Membre actif lié à l'email connecté (null si licencié / inexistant). */
async function camtravelGetMyMembership() {
  if (!camtravelSupabaseReady()) return null;
  const user = await camtravelGetCurrentUser();
  if (!user || !user.email) return null;
  try {
    const { data, error } = await window.camtravelSupabase
      .from('agency_members')
      .select('*')
      .eq('email', user.email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw error;
    const active = (data || []).find(m => m.status === 'active');
    return active || null;
  } catch (e) {
    console.warn('Impossible de charger le membership.', e);
    return null;
  }
}

async function camtravelGetAgencyMembers(agencyId, opts) {
  if (!camtravelSupabaseReady() || !agencyId) return [];
  const includeTerminated = !!(opts && opts.includeTerminated);
  try {
    let q = window.camtravelSupabase
      .from('agency_members')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });
    if (!includeTerminated) q = q.in('status', ['active', 'invited', 'suspended']);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(camtravelMapMemberRow);
  } catch (e) {
    console.warn('Impossible de lister les membres.', e);
    return [];
  }
}

async function camtravelAddAgencyMember(agencyId, email, role, branchId, counterId) {
  if (!camtravelSupabaseReady()) return { ok: false, reason: 'no-supabase' };
  try {
    const { data, error } = await window.camtravelSupabase.rpc('camtravel_add_agency_member', {
      p_agency_id: agencyId,
      p_email: email,
      p_role: role || 'cashier',
      p_branch_id: branchId || null,
      p_counter_id: counterId || null
    });
    if (error) throw error;
    return { ok: true, member: camtravelMapMemberRow(data) };
  } catch (e) {
    console.warn("Impossible d'ajouter le membre.", e);
    return { ok: false, reason: (e && e.message) || 'error' };
  }
}

async function camtravelTerminateMember(memberId, reason, note) {
  if (!camtravelSupabaseReady()) return { ok: false, reason: 'no-supabase' };
  try {
    const { data, error } = await window.camtravelSupabase.rpc('camtravel_terminate_member', {
      p_member_id: memberId,
      p_reason: reason || 'layoff',
      p_note: note || null
    });
    if (error) throw error;
    return { ok: !!data };
  } catch (e) {
    console.warn('Impossible de licencier le membre.', e);
    return { ok: false, reason: (e && e.message) || 'error' };
  }
}

async function camtravelGetAgencyBranches(agencyId) {
  if (!camtravelSupabaseReady() || !agencyId) return [];
  try {
    const { data, error } = await window.camtravelSupabase
      .from('agency_branches').select('*').eq('agency_id', agencyId).order('city');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('Impossible de charger les succursales.', e);
    return [];
  }
}

async function camtravelSaveAgencyBranch(agencyId, name, city, address) {
  if (!camtravelSupabaseReady()) return { ok: false };
  try {
    const { error } = await window.camtravelSupabase.from('agency_branches').insert({
      agency_id: agencyId, name, city, address: address || null
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn("Impossible d'ajouter la succursale.", e);
    return { ok: false };
  }
}

async function camtravelGetAgencyCounters(branchId) {
  if (!camtravelSupabaseReady() || !branchId) return [];
  try {
    const { data, error } = await window.camtravelSupabase
      .from('agency_counters').select('*').eq('branch_id', branchId).order('name');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('Impossible de charger les guichets.', e);
    return [];
  }
}

async function camtravelSaveAgencyCounter(branchId, name, neighborhood, address) {
  if (!camtravelSupabaseReady()) return { ok: false };
  try {
    const { error } = await window.camtravelSupabase.from('agency_counters').insert({
      branch_id: branchId, name, neighborhood: neighborhood || null, address: address || null
    });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn("Impossible d'ajouter le guichet.", e);
    return { ok: false };
  }
}
