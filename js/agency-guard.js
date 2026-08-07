/**
 * Protection des pages agence.
 * - Session locale camtravel_agency_session (role agence_admin + agency_id)
 * - OU Supabase : session auth + ligne agencies.email
 * Une seule base : filtrage par agency_id dans le dashboard.
 *
 * Mode hybride : la session locale est acceptée même si Supabase est
 * configuré (comptes démo / hors-ligne).
 */
(async function () {
  // 1) Session locale agence (démo / hors-ligne) — priorité
  try {
    const sess = typeof camtravelGetAgencySession === 'function'
      ? camtravelGetAgencySession()
      : JSON.parse(localStorage.getItem('camtravel_agency_session') || 'null');
    if (sess && sess.agency_id) {
      return; // accès autorisé
    }
  } catch (e) {}

  // 2) camtravelGetMyAgency (session locale ou email Supabase lié à une agence)
  const agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
  if (agency && agency.id) {
    return;
  }

  // 3) Utilisateur Supabase connecté mais sans agence → accueil
  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    try {
      const { data } = await window.camtravelSupabase.auth.getUser();
      if (data && data.user) {
        window.location.href = 'index.html';
        return;
      }
    } catch (e) {}
  }

  // 4) Rien trouvé → page de connexion
  window.location.href = 'connexion.html?role=agence';
})();
