// Affichage / masquage du mot de passe
document.querySelectorAll('.toggle-eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

const form = document.getElementById('loginForm');
const banner = document.getElementById('statusBanner');

function setError(fieldId, hasError) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle('error', hasError);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;

  const identifiant = document.getElementById('identifiant').value.trim();
  const pass = document.getElementById('pass').value;

  setError('f-identifiant', !identifiant); if (!identifiant) valid = false;
  setError('f-pass', pass.length === 0); if (pass.length === 0) valid = false;

  if (!valid) {
    banner.className = 'status-banner show error';
    banner.textContent = "Merci de renseigner vos identifiants.";
    return;
  }

  // Les comptes agence de démonstration doivent rester accessibles même
  // lorsque Supabase est configuré pour les comptes de production.
  if (typeof camtravelAgencyLoginLocal === 'function') {
    const localAgency = camtravelAgencyLoginLocal(identifiant, pass);
    if (localAgency.ok) {
      banner.className = 'status-banner show success';
      banner.textContent = "Connexion réussie ! Redirection vers votre espace agence...";
      setTimeout(() => { window.location.href = 'agency-dashboard.html'; }, 500);
      return;
    }
  }

  // Les comptes client, admin et agence sont vérifiés par Supabase.
  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    banner.className = 'status-banner show success';
    banner.textContent = "Connexion en cours...";
    try {
      const { error } = await window.camtravelSupabase.auth.signInWithPassword({
        email: identifiant,
        password: pass
      });
      if (error) throw error;

      // Après auth Supabase : résoudre le rôle.
      // Utiliser l'email du compte connecté pour éviter les différences de casse.
      let destination = 'dashboard.html';
      try {
        const currentUser = typeof camtravelGetCurrentUser === 'function'
          ? await camtravelGetCurrentUser()
          : null;
        const email = (currentUser && currentUser.email) ? currentUser.email : identifiant;
        if (typeof camtravelIsAdminEmail === 'function' && await camtravelIsAdminEmail(email)) {
          destination = 'admin-dashboard.html';
        } else {
          const agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
          if (agency && agency.id) {
            try {
              localStorage.setItem('camtravel_agency_session', JSON.stringify({
                email: (email || '').toLowerCase(),
                agency_id: agency.id,
                name: agency.name,
                role: 'agence_admin'
              }));
            } catch (e) {}
            destination = 'agency-dashboard.html';
          }
        }
      } catch (e) { /* en cas de doute → dashboard client */ }

      banner.textContent = "Connexion réussie ! Redirection vers votre tableau de bord...";
      setTimeout(() => { window.location.href = destination; }, 1000);
    } catch (err) {
      banner.className = 'status-banner show error';
      const messages = {
        'invalid_credentials': "Email ou mot de passe incorrect.",
        'email_not_confirmed': "Confirmez votre email avant de vous connecter (vérifiez votre boîte de réception).",
        'over_request_rate_limit': "Trop de tentatives. Réessayez dans quelques minutes.",
      };
      banner.textContent = messages[err.code] || "Erreur de connexion : " + (err.message || err);
    }
    return;
  }

  banner.className = 'status-banner show error';
  banner.textContent = "Email ou mot de passe incorrect, ou configurez Supabase pour utiliser un compte réel.";
});
