/**
 * Protection des pages agence.
 * - Session Supabase + ligne agencies.email correspondant au compte connecté
 * Une seule base : filtrage par agency_id dans le dashboard.
 *
 */
(async function () {
  if (!window.CAMTRAVEL_SUPABASE_ENABLED || !window.camtravelSupabase) {
    window.location.href = 'connexion.html?role=agence';
    return;
  }

  // Le compte doit être authentifié et lié à une agence réelle.
  const agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
  if (agency && agency.id) {
    return;
  }

  // Utilisateur connecté mais sans agence → accueil.
  try {
    const { data } = await window.camtravelSupabase.auth.getUser();
    if (data && data.user) {
      window.location.href = 'index.html';
      return;
    }
  } catch (e) {
  }

  // Rien trouvé → page de connexion.
  window.location.href = 'connexion.html?role=agence';
})();
