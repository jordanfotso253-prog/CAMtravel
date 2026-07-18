/**
 * Protection des pages client : redirige vers la connexion si personne n'est
 * connecté (uniquement quand Supabase est configuré — en mode démo, sans
 * vraie authentification possible, l'accès reste libre).
 */
if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
  window.camtravelSupabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      window.location.href = 'connexion.html';
    }
  });
}

// Déconnexion réelle (utilisée par les liens "Déconnexion")
function camtravelLogout(event) {
  if (event) event.preventDefault();
  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    window.camtravelSupabase.auth.signOut().finally(() => { window.location.href = 'index.html'; });
  } else {
    window.location.href = 'index.html';
  }
}
