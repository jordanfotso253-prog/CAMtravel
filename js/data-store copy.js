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
    refundStatus: row.refund_status, refundReason: row.refund_reason, refundRequestedAt: row.refund_requested_at
  };
}
function camtravelMapTripRow(row) {
  return {
    id: row.id, agencyId: row.agency_id,
    company: row.agencies ? row.agencies.name : 'Agence partenaire',
    from: row.from_city, to: row.to_city,
    dep: row.dep_time, arr: row.arr_time, duration: row.duration,
    price: row.price, tags: (row.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    seatCount: row.seat_count, active: row.active, createdAt: row.created_at
  };
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

// ---------- RÉSERVATIONS (billets) ----------
async function camtravelSaveReservation(reservation) {
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
        seat_numbers: reservation.seatNumbers || null
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
  try {
    const { data, error } = await window.camtravelSupabase
      .from('agencies').select('*').eq('email', user.email.toLowerCase()).maybeSingle();
    if (error) throw error;
    return data;
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
    const row = {
      agency_id: trip.agencyId, from_city: trip.from, to_city: trip.to,
      dep_time: trip.dep, arr_time: trip.arr, duration: trip.duration,
      price: trip.price, tags: trip.tags, seat_count: trip.seatCount || 40
    };
    const { error } = await window.camtravelSupabase.from('trips').insert(row);
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    console.warn("Impossible d'ajouter le trajet.", e);
    return { ok: false };
  }
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
async function camtravelGetAgencyReservations(agencyId) {
  if (!camtravelSupabaseReady() || !agencyId) return [];
  try {
    const { data: trips, error: tripsError } = await window.camtravelSupabase
      .from('trips').select('id').eq('agency_id', agencyId);
    if (tripsError) throw tripsError;
    const tripIds = (trips || []).map(t => t.id);
    if (tripIds.length === 0) return [];
    const { data, error } = await window.camtravelSupabase
      .from('reservations').select('*').in('trip_id', tripIds).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(camtravelMapReservationRow);
  } catch (e) {
    console.warn("Impossible de charger les réservations de l'agence.", e);
    return [];
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
