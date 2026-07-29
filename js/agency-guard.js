/**
 * Protection de agency-dashboard.html : redirige vers la connexion si
 * personne n'est connecté, ou vers l'accueil si le compte connecté ne
 * correspond à aucune agence (email trouvé dans la table "agencies").
 */
(async function () {
  if (!(window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase)) return;

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
