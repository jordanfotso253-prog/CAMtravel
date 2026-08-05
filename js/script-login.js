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

  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    // Vraie vérification du mot de passe via Supabase Authentication
    banner.className = 'status-banner show success';
    banner.textContent = "Connexion en cours...";
    try {
      const { error } = await window.camtravelSupabase.auth.signInWithPassword({ email: identifiant, password: pass });
      if (error) throw error;
      banner.textContent = "Connexion réussie ! Redirection vers votre tableau de bord...";

      let destination = 'dashboard.html';
      try {
        if (typeof camtravelIsAdminEmail === 'function' && await camtravelIsAdminEmail(identifiant)) {
          destination = 'admin-dashboard.html';
        } else if (typeof camtravelGetMyAgency === 'function' && await camtravelGetMyAgency()) {
          destination = 'agency-dashboard.html';
        }
      } catch (e) { /* en cas de doute, direction le tableau de bord client */ }

      setTimeout(() => { window.location.href = destination; }, 1000);
    } catch (err) {
      banner.className = 'status-banner show error';
      const messages = {
        'invalid_credentials': "Email ou mot de passe incorrect.",
        'email_not_confirmed': "Confirmez votre email avant de vous connecter (vérifiez votre boîte de réception).",
        'over_request_rate_limit': "Trop de tentatives. Réessayez dans quelques minutes.",
      };
      banner.textContent = messages[err.code] || "Erreur de connexion : " + err.message;
    }
    return;
  }

  // Mode local : compte agence (role agence_admin + agency_id) ou client
  const emailVal = (document.getElementById('identifiant') || document.getElementById('email') || {}).value
    || form.querySelector('input[type="email"]')?.value || '';
  const passVal = (document.getElementById('pass') || document.getElementById('password') || {}).value
    || form.querySelector('input[type="password"]')?.value || '';

  if (typeof camtravelAgencyLoginLocal === 'function') {
    const agLogin = camtravelAgencyLoginLocal(emailVal, passVal);
    if (agLogin.ok) {
      banner.className = 'status-banner show success';
      banner.textContent = 'Espace agence « ' + (agLogin.agency.name || '') + ' » — redirection...';
      setTimeout(() => { window.location.href = 'agency-dashboard.html'; }, 900);
      return;
    }
  }

  banner.className = 'status-banner show success';
  banner.textContent = "Connexion réussie (mode démo — configurez Supabase pour une vraie vérification du mot de passe). Redirection...";
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
});
