const DEMO_USER = { nom: 'Jean Dupont', tel: '696745324', email: 'jean.dupont@example.com', ville: 'Yaoundé' };

function getInitials(name) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

(async function init() {
  const users = typeof camtravelGetUsers === 'function' ? await camtravelGetUsers() : [];
  const user = users[0] || DEMO_USER;

  document.getElementById('avatarInitials').textContent = getInitials(user.nom || 'Client');
  document.getElementById('pNom').value = user.nom || '';
  document.getElementById('pTel').value = user.tel || '';
  document.getElementById('pEmail').value = user.email || '';
  document.getElementById('pVille').value = user.ville || '';

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const banner = document.getElementById('statusBanner');
    banner.className = 'status-banner show success';
    banner.textContent = "Modifications enregistrées (démonstration — un vrai système de compte permettrait de les sauvegarder durablement).";
    document.getElementById('avatarInitials').textContent = getInitials(document.getElementById('pNom').value || 'Client');
  });
})();
