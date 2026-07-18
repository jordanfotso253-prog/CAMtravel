// Affichage / masquage des mots de passe
document.querySelectorAll('.toggle-eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

const form = document.getElementById('signupForm');
const banner = document.getElementById('statusBanner');

function setError(fieldId, hasError) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle('error', hasError);
}

// Règles de validation strictes (sécurité + cohérence des données)
const NAME_REGEX = /^[A-Za-zÀ-ÿ' -]{2,50}$/;           // lettres, accents, espaces, tirets, apostrophes uniquement
const CITY_REGEX = /^[A-Za-zÀ-ÿ' -]{2,40}$/;
const PHONE_REGEX = /^(\+237)?6\d{8}$/;                  // format camerounais : 6XXXXXXXX (9 chiffres)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;

  const nom = document.getElementById('nom').value.trim();
  const telRaw = document.getElementById('tel').value.trim();
  const tel = telRaw.replace(/\s+/g, '');
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('pass').value;
  const pass2 = document.getElementById('pass2').value;
  const ville = document.getElementById('ville').value.trim();
  const accepted = document.getElementById('acceptTerms').checked;

  const nomOk = NAME_REGEX.test(nom);
  setError('f-nom', !nomOk); if (!nomOk) valid = false;

  const telOk = PHONE_REGEX.test(tel);
  setError('f-tel', !telOk); if (!telOk) valid = false;

  const emailOk = EMAIL_REGEX.test(email);
  setError('f-email', !emailOk); if (!emailOk) valid = false;

  const passOk = pass.length >= 6;
  setError('f-pass', !passOk); if (!passOk) valid = false;

  const matchOk = pass === pass2 && pass2.length > 0;
  setError('f-pass2', !matchOk); if (!matchOk) valid = false;

  const villeOk = CITY_REGEX.test(ville);
  setError('f-ville', !villeOk); if (!villeOk) valid = false;

  if (!accepted) valid = false;

  if (!valid) {
    banner.className = 'status-banner show error';
    banner.textContent = "Merci de corriger les champs en rouge (nom : lettres uniquement, téléphone : format 6XXXXXXXX) et d'accepter les conditions.";
    return;
  }

  // Crée le compte : avec un vrai mot de passe vérifié si Supabase est
  // configuré, sinon en mode démonstration (comme avant).
  banner.className = 'status-banner show success';
  banner.textContent = "Création du compte en cours...";

  if (window.CAMTRAVEL_SUPABASE_ENABLED && window.camtravelSupabase) {
    try {
      const { data, error } = await window.camtravelSupabase.auth.signUp({ email, password: pass });
      if (error) throw error;
      if (typeof camtravelSaveUser === 'function') {
        await camtravelSaveUser({ uid: data.user ? data.user.id : null, nom, tel, email, ville });
      }
      banner.className = 'status-banner show success';
      if (data.session) {
        banner.textContent = "Compte créé avec succès pour " + nom + " ! Redirection...";
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
      } else {
        banner.textContent = "Compte créé avec succès pour " + nom + " ! Vérifiez votre email pour confirmer votre compte, puis connectez-vous.";
        setTimeout(() => { window.location.href = 'connexion.html'; }, 1800);
      }
    } catch (err) {
      banner.className = 'status-banner show error';
      const messages = {
        'user_already_exists': "Cet email est déjà utilisé par un compte existant.",
        'email_address_invalid': "Cette adresse email n'est pas acceptée, essayez-en une autre.",
        'weak_password': "Le mot de passe est trop faible (6 caractères minimum).",
      };
      banner.textContent = messages[err.code] || "Erreur lors de la création du compte : " + err.message;
    }
    return;
  }

  // Mode démonstration (Supabase non configuré) : pas de vraie vérification de mot de passe.
  if (typeof camtravelSaveUser === 'function') {
    await camtravelSaveUser({ nom, tel, email, ville });
  }
  banner.className = 'status-banner show success';
  banner.textContent = "Compte créé avec succès pour " + nom + " ! (mode démo — configurez Supabase pour un vrai mot de passe sécurisé). Vous pouvez maintenant vous connecter.";
  form.reset();
});
