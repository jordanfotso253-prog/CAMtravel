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

// ---------- DONNÉES LOCALES (mode hors-ligne / sans Supabase) ----------
const CAMTRAVEL_TRIPS_KEY = 'camtravel_trips';
const CAMTRAVEL_AGENCIES_KEY = 'camtravel_agencies_local';
const CAMTRAVEL_AGENCY_SESSION = 'camtravel_agency_session';
const CAMTRAVEL_AGENCY_ACCOUNTS_KEY = 'camtravel_agency_accounts';


function camtravelSeedLocalCatalog() {
  try {
    const resetLocked = localStorage.getItem('camtravel_stats_reset_lock') === '1';
    if (resetLocked) return;
    const ver = localStorage.getItem('camtravel_catalog_ver');
    if (ver === '4') return; // catalogue sans agence CAM travel
    // Invalide l'ancien catalogue (qui pouvait contenir CAM travel comme agence)
    localStorage.removeItem(CAMTRAVEL_TRIPS_KEY);
    localStorage.removeItem(CAMTRAVEL_AGENCIES_KEY);
    localStorage.setItem('camtravel_catalog_ver', '4');
  } catch (e) {}
  // (ré)initialise le catalogue
  const agencies = [
    { id: 'ag-exp', name: 'Express Voyages', email: 'admin@expressvoyages.cm', tel: '690000001', ville: 'Douala', commission_percent: 10, status: 'active', role: 'agence_admin', created_at: new Date().toISOString() },
    { id: 'ag-gen', name: 'General Express', email: 'admin@generalexpress.cm', tel: '691000001', ville: 'Yaoundé', commission_percent: 10, status: 'active', role: 'agence_admin', created_at: new Date().toISOString() },
    { id: 'ag-roy', name: 'Royal Bus', email: 'admin@royalbus.cm', tel: '692000001', ville: 'Douala', commission_percent: 10, status: 'active', role: 'agence_admin', created_at: new Date().toISOString() },
    { id: 'ag-dre', name: 'Dream Transport', email: 'admin@dreamtransport.cm', tel: '693000001', ville: 'Bertoua', commission_percent: 10, status: 'active', role: 'agence_admin', created_at: new Date().toISOString() },
    { id: 'ag-amour', name: 'Amour Voyage', email: 'admin@amourvoyage.com', tel: '694000001', ville: 'Yaoundé', commission_percent: 10, status: 'active', role: 'agence_admin', created_at: new Date().toISOString() }
  ];
  // Comptes agence (email → agency_id) pour mode local
  const accounts = agencies.map(a => ({
    email: a.email,
    password: 'agence123',
    role: 'agence_admin',
    agency_id: a.id,
    name: a.name
  }));
  localStorage.setItem(CAMTRAVEL_AGENCY_ACCOUNTS_KEY, JSON.stringify(accounts));

  const trips = [
    { id: 't1', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Yaoundé', to: 'Douala', dep: '06:00 AM', arr: '09:00 AM', duration: '3h00m', price: 12000, tags: ['VIP','Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't2', agencyId: 'ag-gen', company: 'General Express', from: 'Yaoundé', to: 'Douala', dep: '08:00 AM', arr: '10:30 AM', duration: '2h30m', price: 12500, tags: ['VIP','Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't3', agencyId: 'ag-roy', company: 'Royal Bus', from: 'Yaoundé', to: 'Douala', dep: '02:00 PM', arr: '05:00 PM', duration: '3h00m', price: 12000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't4', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Douala', to: 'Yaoundé', dep: '07:00 AM', arr: '10:00 AM', duration: '3h00m', price: 12500, tags: ['VIP','Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't5', agencyId: 'ag-gen', company: 'General Express', from: 'Yaoundé', to: 'Bafoussam', dep: '07:30 AM', arr: '12:00 PM', duration: '4h30m', price: 10000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't6', agencyId: 'ag-roy', company: 'Royal Bus', from: 'Yaoundé', to: 'Bamenda', dep: '06:30 AM', arr: '01:00 PM', duration: '6h30m', price: 12000, tags: ['Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't7', agencyId: 'ag-dre', company: 'Dream Transport', from: 'Yaoundé', to: 'Kribi', dep: '08:00 AM', arr: '12:00 PM', duration: '4h00m', price: 8000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't8', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Yaoundé', to: 'Douala', dep: '08:00 AM', arr: '11:30 AM', duration: '3h30m', price: 11000, tags: ['VIP','Climatisé'], seatCount: 40, active: true },
    { id: 't9', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Douala', to: 'Bafoussam', dep: '07:00 AM', arr: '11:00 AM', duration: '4h00m', price: 10000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't10', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Douala', to: 'Bamenda', dep: '06:00 AM', arr: '12:30 PM', duration: '6h30m', price: 11000, tags: ['Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't11', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Douala', to: 'Limbé', dep: '09:00 AM', arr: '10:30 AM', duration: '1h30m', price: 2500, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't12', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Douala', to: 'Buea', dep: '10:00 AM', arr: '11:30 AM', duration: '1h30m', price: 3000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't13', agencyId: 'ag-gen', company: 'General Express', from: 'Yaoundé', to: 'Douala', dep: '10:00 AM', arr: '12:30 PM', duration: '2h30m', price: 13000, tags: ['VIP','Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't14', agencyId: 'ag-gen', company: 'General Express', from: 'Yaoundé', to: 'Garoua', dep: '06:00 AM', arr: '06:00 PM', duration: '12h00m', price: 25000, tags: ['VIP','Climatisé'], seatCount: 40, active: true },
    { id: 't15', agencyId: 'ag-gen', company: 'General Express', from: 'Yaoundé', to: 'Ngaoundéré', dep: '05:30 AM', arr: '04:00 PM', duration: '10h30m', price: 20000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't16', agencyId: 'ag-gen', company: 'General Express', from: 'Yaoundé', to: 'Maroua', dep: '05:00 AM', arr: '08:00 PM', duration: '15h00m', price: 30000, tags: ['VIP','Climatisé'], seatCount: 40, active: true },
    { id: 't17', agencyId: 'ag-roy', company: 'Royal Bus', from: 'Yaoundé', to: 'Douala', dep: '11:00 AM', arr: '01:30 PM', duration: '2h30m', price: 12000, tags: ['Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't18', agencyId: 'ag-roy', company: 'Royal Bus', from: 'Douala', to: 'Bafoussam', dep: '07:00 AM', arr: '11:00 AM', duration: '4h00m', price: 10000, tags: ['Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't19', agencyId: 'ag-roy', company: 'Royal Bus', from: 'Douala', to: 'Nkongsamba', dep: '08:00 AM', arr: '10:00 AM', duration: '2h00m', price: 4000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't20', agencyId: 'ag-roy', company: 'Royal Bus', from: 'Bafoussam', to: 'Bamenda', dep: '09:00 AM', arr: '11:00 AM', duration: '2h00m', price: 3500, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't21', agencyId: 'ag-dre', company: 'Dream Transport', from: 'Yaoundé', to: 'Douala', dep: '01:00 PM', arr: '03:30 PM', duration: '2h30m', price: 11500, tags: ['VIP','Climatisé'], seatCount: 40, active: true },
    { id: 't22', agencyId: 'ag-dre', company: 'Dream Transport', from: 'Bertoua', to: 'Yaoundé', dep: '09:00 AM', arr: '02:00 PM', duration: '5h00m', price: 15000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't23', agencyId: 'ag-dre', company: 'Dream Transport', from: 'Yaoundé', to: 'Bertoua', dep: '08:00 AM', arr: '01:00 PM', duration: '5h00m', price: 15000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't24', agencyId: 'ag-dre', company: 'Dream Transport', from: 'Yaoundé', to: 'Ebolowa', dep: '07:00 AM', arr: '10:00 AM', duration: '3h00m', price: 5000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't25', agencyId: 'ag-gen', company: 'General Express', from: 'Garoua', to: 'Maroua', dep: '08:00 AM', arr: '11:00 AM', duration: '3h00m', price: 5000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't26', agencyId: 'ag-roy', company: 'Royal Bus', from: 'Ngaoundéré', to: 'Garoua', dep: '07:00 AM', arr: '12:00 PM', duration: '5h00m', price: 8000, tags: ['Climatisé'], seatCount: 40, active: true },
    { id: 't27', agencyId: 'ag-exp', company: 'Express Voyages', from: 'Douala', to: 'Kribi', dep: '08:30 AM', arr: '11:00 AM', duration: '2h30m', price: 5000, tags: ['Climatisé','WiFi'], seatCount: 40, active: true },
    { id: 't28', agencyId: 'ag-gen', company: 'General Express', from: 'Yaoundé', to: 'Bafoussam', dep: '09:00 AM', arr: '01:30 PM', duration: '4h30m', price: 9500, tags: ['Climatisé'], seatCount: 40, active: true }
  ];
  localStorage.setItem(CAMTRAVEL_AGENCIES_KEY, JSON.stringify(agencies));
  localStorage.setItem(CAMTRAVEL_TRIPS_KEY, JSON.stringify(trips));
}

function camtravelLocalGetTrips() {
  camtravelSeedLocalCatalog();
  try { return JSON.parse(localStorage.getItem(CAMTRAVEL_TRIPS_KEY)) || []; }
  catch (e) { return []; }
}
function camtravelLocalGetAgencies() {
  camtravelSeedLocalCatalog();
  try { return JSON.parse(localStorage.getItem(CAMTRAVEL_AGENCIES_KEY)) || []; }
  catch (e) { return []; }
}



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
        .from('admins').select('is_admin').ilike('email', cleanEmail).maybeSingle();
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

function camtravelResetLocalStats(scope = 'all') {
  try {
    const targets = {
      all: [
        CAMTRAVEL_USERS_KEY,
        CAMTRAVEL_RESERVATIONS_KEY,
        CAMTRAVEL_COLIS_KEY,
        'camtravel_passengers',
        CAMTRAVEL_TRIPS_KEY,
        CAMTRAVEL_AGENCIES_KEY,
        CAMTRAVEL_AGENCY_ACCOUNTS_KEY
      ],
      client: [
        CAMTRAVEL_USERS_KEY,
        CAMTRAVEL_RESERVATIONS_KEY,
        CAMTRAVEL_COLIS_KEY,
        'camtravel_passengers'
      ],
      agency: [
        CAMTRAVEL_TRIPS_KEY,
        CAMTRAVEL_AGENCY_ACCOUNTS_KEY,
        CAMTRAVEL_AGENCIES_KEY
      ],
      admin: [
        CAMTRAVEL_USERS_KEY,
        CAMTRAVEL_RESERVATIONS_KEY,
        CAMTRAVEL_COLIS_KEY,
        'camtravel_passengers',
        CAMTRAVEL_AGENCIES_KEY,
        CAMTRAVEL_AGENCY_ACCOUNTS_KEY
      ]
    };

    const keys = targets[scope] || targets.all;
    keys.forEach(key => localStorage.removeItem(key));
    localStorage.setItem('camtravel_stats_reset_lock', '1');
    return true;
  } catch (e) {
    console.warn('Réinitialisation des statistiques impossible.', e);
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.camtravelResetLocalStats = camtravelResetLocalStats;
}
if (typeof globalThis !== 'undefined') {
  globalThis.camtravelResetLocalStats = camtravelResetLocalStats;
}

// ---------- TRAJETS (recherche publique, remplace l'ancien tableau en dur) ----------
async function camtravelGetTrips(criteria) {
  const from = criteria && criteria.from;
  const to = criteria && criteria.to;
  if (camtravelSupabaseReady()) {
    try {
      let query = window.camtravelSupabase.from('trips').select('*, agencies(name)').eq('active', true);
      if (from) query = query.eq('from_city', from);
      if (to) query = query.eq('to_city', to);
      const { data, error } = await query.order('dep_time', { ascending: true });
      if (error) throw error;
      return data.map(camtravelMapTripRow);
    } catch (e) {
      console.warn('Supabase indisponible pour la recherche de trajets, mode local.', e);
    }
  }
  let trips = camtravelLocalGetTrips().filter(t => t.active !== false);
  if (from) trips = trips.filter(t => t.from === from);
  if (to) trips = trips.filter(t => t.to === to);
  return trips;
}

async function camtravelGetTripById(id) {
  if (!id) return null;
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('trips').select('*, agencies(name)').eq('id', id).maybeSingle();
      if (error) throw error;
      if (data) return camtravelMapTripRow(data);
    } catch (e) {
      console.warn('Supabase indisponible pour charger ce trajet.', e);
    }
  }
  return camtravelLocalGetTrips().find(t => t.id === id) || null;
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
  // 1) Session agence locale (mode hors-ligne / démo)
  try {
    const sess = JSON.parse(localStorage.getItem(CAMTRAVEL_AGENCY_SESSION) || 'null');
    if (sess && sess.agency_id) {
      const agencies = camtravelLocalGetAgencies();
      const found = agencies.find(a => a.id === sess.agency_id);
      if (found) {
        return {
          id: found.id,
          name: found.name,
          email: found.email || sess.email,
          tel: found.tel,
          ville: found.ville,
          commission_percent: found.commission_percent || 10,
          status: found.status || 'active',
          avatarData: found.avatarData || found.avatar_data || null,
          role: sess.role || 'agence_admin'
        };
      }
      // session seule
      return {
        id: sess.agency_id,
        name: sess.name || 'Agence',
        email: sess.email,
        commission_percent: 10,
        status: 'active',
        role: sess.role || 'agence_admin'
      };
    }
  } catch (e) {}

  // 2) Supabase : email du compte = email de l'agence (role agence_admin)
  if (!camtravelSupabaseReady()) return null;
  const user = await camtravelGetCurrentUser();
  if (!user || !user.email) return null;
  try {
    const { data, error } = await window.camtravelSupabase
      .from('agencies').select('*').ilike('email', user.email.toLowerCase()).maybeSingle();
    if (error) throw error;
    if (data) return { ...data, avatarData: data.avatar_data || null, role: 'agence_admin' };
    return null;
  } catch (e) {
    console.warn('Supabase indisponible pour charger l\'agence.', e);
    return null;
  }
}

/** Connexion locale d'un compte agence (email + mot de passe) */
function camtravelAgencyLoginLocal(email, password) {
  camtravelSeedLocalCatalog();
  let accounts = [];
  try { accounts = JSON.parse(localStorage.getItem(CAMTRAVEL_AGENCY_ACCOUNTS_KEY) || '[]'); } catch (e) {}
  const emailL = (email || '').trim().toLowerCase();
  const acc = accounts.find(a => a.email === emailL && a.password === password);
  if (!acc) {
    // aussi accepter email d'agence listée avec mot de passe agence123
    const agencies = camtravelLocalGetAgencies();
    const ag = agencies.find(a => (a.email || '').toLowerCase() === emailL);
    if (ag && (password === 'agence123' || password === 'password')) {
      const session = { email: emailL, agency_id: ag.id, name: ag.name, role: 'agence_admin' };
      localStorage.setItem(CAMTRAVEL_AGENCY_SESSION, JSON.stringify(session));
      return { ok: true, session, agency: ag };
    }
    return { ok: false, reason: 'invalid' };
  }
  const session = {
    email: acc.email,
    agency_id: acc.agency_id,
    name: acc.name,
    role: acc.role || 'agence_admin'
  };
  localStorage.setItem(CAMTRAVEL_AGENCY_SESSION, JSON.stringify(session));
  const agencies = camtravelLocalGetAgencies();
  const agency = agencies.find(a => a.id === acc.agency_id) || { id: acc.agency_id, name: acc.name };
  return { ok: true, session, agency };
}

function camtravelAgencyLogoutLocal() {
  localStorage.removeItem(CAMTRAVEL_AGENCY_SESSION);
}

function camtravelGetAgencySession() {
  try { return JSON.parse(localStorage.getItem(CAMTRAVEL_AGENCY_SESSION) || 'null'); }
  catch (e) { return null; }
}

async function camtravelUpdateMyAgency(fields) {
  if (!camtravelSupabaseReady()) return { ok: false, mode: 'supabase' };
  const agency = await camtravelGetMyAgency();
  if (!agency || !agency.id) return { ok: false, mode: 'supabase' };
  try {
    const { error } = await window.camtravelSupabase.from('agencies').update({
      name: fields.name,
      tel: fields.tel,
      ville: fields.ville,
      avatar_data: fields.avatarData || null
    }).eq('id', agency.id);
    if (error) throw error;
    return { ok: true, mode: 'supabase' };
  } catch (e) {
    console.warn("Impossible d'enregistrer le profil agence.", e);
    return { ok: false, mode: 'supabase' };
  }
}


// Toutes les agences (page admin "agencies.html").
async function camtravelGetAgencies() {
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('agencies').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase indisponible pour charger les agences.', e);
    }
  }
  return camtravelLocalGetAgencies();
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
  if (!agencyId) return [];
  const local = () => camtravelLocalGetTrips().filter(t => t.agencyId === agencyId || t.agency_id === agencyId);
  // IDs locaux (ag-exp, ag-amour…) → catalogue local en priorité
  if (typeof agencyId === 'string' && agencyId.indexOf('ag-') === 0) {
    return local();
  }
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('trips').select('*').eq('agency_id', agencyId).order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data || []).map(camtravelMapTripRow);
      if (mapped.length) return mapped;
    } catch (e) {
      console.warn('Impossible de charger les trajets de l\'agence.', e);
    }
  }
  return local();
}

async function camtravelSaveTrip(trip) {
  if (camtravelSupabaseReady()) {
    try {
      const row = {
        agency_id: trip.agencyId, from_city: trip.from, to_city: trip.to,
        dep_time: trip.dep, arr_time: trip.arr, duration: trip.duration,
        price: trip.price, tags: trip.tags, seat_count: trip.seatCount || 40
      };
      if (trip.id) {
        const { error } = await window.camtravelSupabase.from('trips').update(row).eq('id', trip.id);
        if (error) throw error;
      } else {
        const { error } = await window.camtravelSupabase.from('trips').insert(row);
        if (error) throw error;
      }
      return { ok: true };
    } catch (e) {
      console.warn("Impossible d'enregistrer le trajet (Supabase).", e);
    }
  }
  // Mode local
  const trips = camtravelLocalGetTrips();
  if (trip.id) {
    const i = trips.findIndex(x => x.id === trip.id);
    if (i >= 0) {
      trips[i] = {
        ...trips[i],
        from: trip.from, to: trip.to, dep: trip.dep, arr: trip.arr,
        duration: trip.duration || trips[i].duration,
        price: Number(trip.price), tags: Array.isArray(trip.tags) ? trip.tags : String(trip.tags || '').split(',').map(s => s.trim()).filter(Boolean),
        seatCount: trip.seatCount || 40, active: trip.active !== false,
        vehicleId: trip.vehicleId !== undefined ? trip.vehicleId : trips[i].vehicleId,
        busName: trip.busName !== undefined ? trip.busName : trips[i].busName,
        matricule: trip.matricule !== undefined ? trip.matricule : trips[i].matricule,
        layoutId: trip.layoutId !== undefined ? trip.layoutId : trips[i].layoutId,
        vip: trip.vip !== undefined ? !!trip.vip : trips[i].vip
      };
      localStorage.setItem(CAMTRAVEL_TRIPS_KEY, JSON.stringify(trips));
      return { ok: true, entry: trips[i] };
    }
  }
  const entry = {
    id: 't-' + Date.now().toString(36),
    agencyId: trip.agencyId,
    company: trip.company || '',
    from: trip.from, to: trip.to,
    dep: trip.dep, arr: trip.arr,
    duration: trip.duration || '',
    price: Number(trip.price) || 0,
    tags: Array.isArray(trip.tags) ? trip.tags : String(trip.tags || 'Climatisé').split(',').map(s => s.trim()).filter(Boolean),
    seatCount: trip.seatCount || 40,
    vehicleId: trip.vehicleId || '',
    busName: trip.busName || '',
    matricule: trip.matricule || '',
    layoutId: trip.layoutId || '',
    vip: !!trip.vip,
    active: true
  };
  trips.unshift(entry);
  localStorage.setItem(CAMTRAVEL_TRIPS_KEY, JSON.stringify(trips));
  return { ok: true, entry };
}

async function camtravelUpdateTripActive(id, active) {
  if (camtravelSupabaseReady()) {
    try {
      const { error } = await window.camtravelSupabase.from('trips').update({ active }).eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Impossible de changer le statut du trajet.', e);
    }
  }
  const trips = camtravelLocalGetTrips();
  const i = trips.findIndex(x => x.id === id);
  if (i < 0) return false;
  trips[i].active = !!active;
  localStorage.setItem(CAMTRAVEL_TRIPS_KEY, JSON.stringify(trips));
  return true;
}

async function camtravelDeleteTrip(id) {
  if (camtravelSupabaseReady()) {
    try {
      const { error } = await window.camtravelSupabase.from('trips').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Impossible de supprimer le trajet.', e);
    }
  }
  const trips = camtravelLocalGetTrips().filter(x => x.id !== id);
  localStorage.setItem(CAMTRAVEL_TRIPS_KEY, JSON.stringify(trips));
  return true;
}

async function camtravelGetAgencyReservations(agencyId) {
  if (!agencyId) return [];

  // Mode local / IDs démo (ag-*)
  function localReservations() {
    let all = [];
    try { all = JSON.parse(localStorage.getItem(CAMTRAVEL_RESERVATIONS_KEY) || '[]'); } catch (e) {}
    const tripIds = new Set(
      camtravelLocalGetTrips()
        .filter(t => t.agencyId === agencyId || t.agency_id === agencyId)
        .map(t => t.id)
    );
    return all.filter(r =>
      (r.agencyId && r.agencyId === agencyId) ||
      (r.tripId && tripIds.has(r.tripId)) ||
      (r.company && (() => {
        const ag = camtravelLocalGetAgencies().find(a => a.id === agencyId);
        return ag && r.company === ag.name;
      })())
    );
  }

  if (typeof agencyId === 'string' && agencyId.indexOf('ag-') === 0) {
    return localReservations();
  }

  if (!camtravelSupabaseReady()) return localReservations();

  try {
    const { data: trips, error: tripsError } = await window.camtravelSupabase
      .from('trips').select('id').eq('agency_id', agencyId);
    if (tripsError) throw tripsError;
    const tripIds = (trips || []).map(t => t.id);
    if (tripIds.length === 0) return localReservations();
    const { data, error } = await window.camtravelSupabase
      .from('reservations').select('*').in('trip_id', tripIds).order('created_at', { ascending: false });
    if (error) throw error;
    const mapped = (data || []).map(camtravelMapReservationRow);
    return mapped.length ? mapped : localReservations();
  } catch (e) {
    console.warn("Impossible de charger les réservations de l'agence.", e);
    return localReservations();
  }
}

// ---------- COMMISSIONS (page admin "commissions.html") ----------
async function camtravelGetCommissionsReport() {
  function localReport() {
    const agencies = camtravelLocalGetAgencies();
    const trips = camtravelLocalGetTrips();
    let reservations = [];
    try { reservations = JSON.parse(localStorage.getItem(CAMTRAVEL_RESERVATIONS_KEY) || '[]'); } catch (e) {}
    const tripToAgency = new Map(trips.map(t => [t.id, t.agencyId || t.agency_id]));
    const revenueByAgency = new Map();
    reservations.forEach(r => {
      let agencyId = r.agencyId || tripToAgency.get(r.tripId);
      if (!agencyId && r.company) {
        const ag = agencies.find(a => a.name === r.company);
        if (ag) agencyId = ag.id;
      }
      if (!agencyId) return;
      revenueByAgency.set(agencyId, (revenueByAgency.get(agencyId) || 0) + Number(r.total || 0));
    });
    return agencies.map(a => {
      const revenue = revenueByAgency.get(a.id) || 0;
      const commissionPercent = Number(a.commission_percent) || 10;
      const commission = Math.round(revenue * commissionPercent / 100);
      return {
        id: a.id, name: a.name, status: a.status || 'active', commissionPercent,
        revenue, commission, net: revenue - commission
      };
    }).sort((x, y) => y.revenue - x.revenue);
  }

  if (!camtravelSupabaseReady()) return localReport();
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
    return localReport();
  }
}

// ---------- REMBOURSEMENTS ----------
async function camtravelRequestRefund(reservationId, reason) {
  if (!camtravelSupabaseReady()) {
    try {
      const all = JSON.parse(localStorage.getItem(CAMTRAVEL_RESERVATIONS_KEY) || '[]');
      const i = all.findIndex(r => r.id === reservationId);
      if (i < 0) return false;
      all[i].refundStatus = 'requested';
      all[i].refund_status = 'requested';
      all[i].refundReason = reason || '';
      all[i].refund_requested_at = new Date().toISOString();
      localStorage.setItem(CAMTRAVEL_RESERVATIONS_KEY, JSON.stringify(all));
      return true;
    } catch (e) { return false; }
  }
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
  if (!camtravelSupabaseReady()) {
    try {
      const all = JSON.parse(localStorage.getItem(CAMTRAVEL_RESERVATIONS_KEY) || '[]');
      const i = all.findIndex(r => r.id === reservationId);
      if (i < 0) return false;
      all[i].refundStatus = status;
      all[i].refund_status = status;
      localStorage.setItem(CAMTRAVEL_RESERVATIONS_KEY, JSON.stringify(all));
      return true;
    } catch (e) { return false; }
  }
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
