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

/** Tente une connexion agence locale (comptes démo / hors-ligne). */
function tryAgencyLocalLogin(email, password) {
  if (typeof camtravelAgencyLoginLocal !== 'function') return null;
  const result = camtravelAgencyLoginLocal(email, password);
  return result && result.ok ? result : null;
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

  // 1) Comptes agence locaux en priorité (démo / hors-ligne)
  //    → fonctionne même si Supabase est configuré
  const agLogin = tryAgencyLocalLogin(identifiant, pass);
  if (agLogin) {
    banner.className = 'status-banner show success';
    banner.textContent = 'Espace agence « ' + (agLogin.agency.name || '') + ' » — redirection...';
    setTimeout(() => { window.location.href = 'agency-dashboard.html'; }, 900);
    return;
  }

  // 2) Supabase (admin, client, ou agence enregistrée en base)
  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    banner.className = 'status-banner show success';
    banner.textContent = "Connexion en cours...";
    try {
      const { error } = await window.camtravelSupabase.auth.signInWithPassword({
        email: identifiant,
        password: pass
      });
      if (error) throw error;

      // Après auth Supabase : résoudre le rôle
      let destination = 'dashboard.html';
      try {
        if (typeof camtravelIsAdminEmail === 'function' && await camtravelIsAdminEmail(identifiant)) {
          destination = 'admin-dashboard.html';
        } else {
          const agency = typeof camtravelGetMyAgency === 'function' ? await camtravelGetMyAgency() : null;
          if (agency) {
            try {
              localStorage.setItem('camtravel_agency_session', JSON.stringify({
                email: (identifiant || '').toLowerCase(),
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

  // 3) Mode démo pur (pas de Supabase) : client
  banner.className = 'status-banner show success';
  banner.textContent = "Connexion réussie (mode démo — configurez Supabase pour une vraie vérification du mot de passe). Redirection...";
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
});
