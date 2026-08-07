/**
 * Protection des pages client : redirige vers la connexion si personne n'est
 * connecté (uniquement quand Supabase est configuré — en mode démo, sans
 * vraie authentification possible, l'accès reste libre).
 */
if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
  window.camtravelSupabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      // Ne pas bloquer si une session agence locale est active
      try {
        const sess = JSON.parse(localStorage.getItem('camtravel_agency_session') || 'null');
        if (sess && sess.agency_id) return;
      } catch (e) {}
      window.location.href = 'connexion.html';
    }
  });
}

// Déconnexion réelle (utilisée par les liens "Déconnexion")
function camtravelLogout(event) {
  if (event) event.preventDefault();
  try {
    if (typeof camtravelAgencyLogoutLocal === 'function') camtravelAgencyLogoutLocal();
    else localStorage.removeItem('camtravel_agency_session');
  } catch (e) {}
  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    window.camtravelSupabase.auth.signOut().finally(() => { window.location.href = 'index.html'; });
  } else {
    window.location.href = 'index.html';
  }
}
