(function () {
  const input = document.getElementById('roleAvatarInput');
  const image = document.getElementById('roleAvatarImage');
  const initials = document.getElementById('roleAvatarInitials');
  const form = document.getElementById('roleProfileForm');
  if (!input || !image || !initials || !form) return;

  let avatarData = null;
  let profileEmail = '';
  const isAgency = document.body.classList.contains('role-agency');

  function initialsFor(name) {
    return (name || (isAgency ? 'Agence' : 'Admin')).split(' ')
      .filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  function display(name, data) {
    if (data) {
      image.src = data;
      image.style.display = 'block';
      initials.style.display = 'none';
    } else {
      image.removeAttribute('src');
      image.style.display = 'none';
      initials.textContent = initialsFor(name);
      initials.style.display = '';
    }
  }

  function compress(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = event => {
        const source = new Image();
        source.onerror = reject;
        source.onload = () => {
          const maxSize = 320;
          const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(source.width * scale));
          canvas.height = Math.max(1, Math.round(source.height * scale));
          canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        source.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function load() {
    const profile = isAgency
      ? await camtravelGetMyAgency()
      : await camtravelGetMyProfile();
    if (!profile) return;
    avatarData = profile.avatarData || null;
    profileEmail = profile.email || '';
    display(profile.name || profile.nom, avatarData);
    const name = document.getElementById('roleProfileName');
    const tel = document.getElementById('roleProfileTel');
    const ville = document.getElementById('roleProfileVille');
    if (name) name.value = profile.name || profile.nom || '';
    if (tel) tel.value = profile.tel || '';
    if (ville) ville.value = profile.ville || '';
  }

  input.addEventListener('change', async () => {
    if (!input.files[0]) return;
    try {
      avatarData = await compress(input.files[0]);
      display((document.getElementById('roleProfileName') || {}).value, avatarData);
    } catch (error) {
      console.warn('Impossible de charger cette image.', error);
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    const name = document.getElementById('roleProfileName')?.value.trim() || '';
    const tel = document.getElementById('roleProfileTel')?.value.trim() || '';
    const ville = document.getElementById('roleProfileVille')?.value.trim() || '';
    const result = isAgency
      ? await camtravelUpdateMyAgency({ name, tel, ville, avatarData })
      : await camtravelUpdateMyProfile({ nom: name, tel, email: profileEmail, ville, avatarData });
    if (button) button.disabled = false;
    const banner = document.getElementById('statusBanner');
    if (banner) {
      banner.className = 'status-banner show ' + (result.ok ? 'success' : 'error');
      banner.textContent = result.ok ? 'Profil enregistré.' : "Impossible d'enregistrer le profil.";
    }
  });

  load();
})();
