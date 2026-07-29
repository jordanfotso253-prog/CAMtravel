function getInitials(name) {
  return (name || 'Client').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function setAvatarDisplay(nom, avatarData) {
  const initialsEl = document.getElementById('avatarInitials');
  const imgEl = document.getElementById('avatarImage');
  if (avatarData) {
    imgEl.src = avatarData;
    imgEl.style.display = 'block';
    initialsEl.style.display = 'none';
  } else {
    imgEl.style.display = 'none';
    imgEl.removeAttribute('src');
    initialsEl.style.display = '';
    initialsEl.textContent = getInitials(nom);
  }
}

let currentAvatarData = null;

(async function init() {
  const banner = document.getElementById('statusBanner');
  const profile = typeof camtravelGetMyProfile === 'function' ? await camtravelGetMyProfile() : null;

  if (profile) {
    currentAvatarData = profile.avatarData || null;
    setAvatarDisplay(profile.nom, currentAvatarData);
    document.getElementById('pNom').value = profile.nom || '';
    document.getElementById('pTel').value = profile.tel || '';
    document.getElementById('pEmail').value = profile.email || '';
    document.getElementById('pVille').value = profile.ville || '';
  } else {
    setAvatarDisplay('Client', null);
  }

  // Upload + compression de la photo de profil (même méthode que pour
  // les photos de pièce d'identité : redimensionnée puis stockée en
  // base64, pas besoin de configurer de stockage de fichiers à part).
  const avatarInput = document.getElementById('avatarInput');
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        currentAvatarData = canvas.toDataURL('image/jpeg', 0.75);
        setAvatarDisplay(document.getElementById('pNom').value, currentAvatarData);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const nom = document.getElementById('pNom').value.trim();
    const tel = document.getElementById('pTel').value.trim();
    const email = document.getElementById('pEmail').value.trim();
    const ville = document.getElementById('pVille').value.trim();

    const result = typeof camtravelUpdateMyProfile === 'function'
      ? await camtravelUpdateMyProfile({ nom, tel, email, ville, avatarData: currentAvatarData })
      : { ok: false };

    submitBtn.disabled = false;

    if (result.ok) {
      banner.className = 'status-banner show success';
      banner.textContent = 'Modifications enregistrées.';
      setAvatarDisplay(nom, currentAvatarData);
    } else {
      banner.className = 'status-banner show error';
      banner.textContent = "Impossible d'enregistrer les modifications pour le moment. Vérifiez votre connexion et réessayez.";
    }
  });
})();
