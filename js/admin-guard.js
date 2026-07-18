/**
 * Protection du tableau de bord admin : en plus d'être connecté, l'utilisateur
 * doit figurer dans la table "admins" (voir js/supabase-config.js pour la
 * procédure de désignation d'un administrateur).
 * En mode démo (Supabase non configuré), l'accès reste libre pour pouvoir tester.
 */
if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
  window.camtravelSupabase.auth.onAuthStateChange(async (event, session) => {
    if (!session) {
      window.location.href = 'connexion.html';
      return;
    }
    const isAdmin = typeof camtravelIsAdminEmail === 'function' ? await camtravelIsAdminEmail(session.user.email) : false;
    if (!isAdmin) {
      alert("Accès réservé aux administrateurs. Votre compte (" + session.user.email + ") n'a pas ce rôle.");
      window.location.href = 'dashboard.html';
    }
  });
}

function camtravelLogout(event) {
  if (event) event.preventDefault();
  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    window.camtravelSupabase.auth.signOut().finally(() => { window.location.href = 'index.html'; });
  } else {
    window.location.href = 'index.html';
  }
}
