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
  return { id: row.id, uid: row.id, nom: row.nom, tel: row.tel, email: row.email, ville: row.ville, createdAt: row.created_at };
}
function camtravelMapReservationRow(row) {
  return {
    id: row.id, ref: row.ref, company: row.company,
    from: row.from_city, to: row.to_city, date: row.travel_date, dep: row.dep,
    price: row.price, passagers: row.passagers, total: row.total,
    passagerNom: row.passager_nom, passagerTel: row.passager_tel,
    method: row.method, methodLabel: row.method_label,
    used: row.used, usedAt: row.used_at, createdAt: row.created_at
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
      const row = {
        ref: reservation.ref, company: reservation.company,
        from_city: reservation.from, to_city: reservation.to,
        travel_date: reservation.date, dep: reservation.dep,
        price: reservation.price, passagers: reservation.passagers, total: reservation.total,
        passager_nom: reservation.passagerNom, passager_tel: reservation.passagerTel,
        method: reservation.method, method_label: reservation.methodLabel
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

async function camtravelGetReservations() {
  if (camtravelSupabaseReady()) {
    try {
      const { data, error } = await window.camtravelSupabase
        .from('reservations').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data.map(camtravelMapReservationRow);
    } catch (e) {
      console.warn('Supabase indisponible, lecture locale de secours.', e);
    }
  }
  return camtravelLocalGet(CAMTRAVEL_RESERVATIONS_KEY);
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
      const { data, error } = await window.camtravelSupabase
        .from('reservations').select('*').eq('ref', cleanRef).limit(1);
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
      const { error } = await window.camtravelSupabase
        .from('reservations')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', reservationId);
      if (error) throw error;
      return true;
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
