/**
 * Protection des pages agence.
 * - Supabase : session auth + ligne agencies.email
 * - Local : session camtravel_agency_session (role agence_admin + agency_id)
 * Une seule base : filtrage par agency_id dans le dashboard.
 */
(async function () {
  // Mode local
  if (!(window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase)) {
    const sess = typeof camtravelGetAgencySession === 'function' ? camtravelGetAgencySession() : null;
    if (!sess || !sess.agency_id) {
      // laisser un peu de temps au data-store
      const agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
      if (!agency) {
        window.location.href = 'connexion.html?role=agence';
      }
    }
    return;
  }

  window.camtravelSupabase.auth.onAuthStateChange((event, session) => {
    if (!session) window.location.href = 'connexion.html';
  });

  const { data } = await window.camtravelSupabase.auth.getUser();
  if (!data.user) {
    window.location.href = 'connexion.html';
    return;
  }

  const agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
  if (!agency) {
    window.location.href = 'index.html';
  }
})();
