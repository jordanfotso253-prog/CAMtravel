const form = document.getElementById('searchForm');
const banner = document.getElementById('statusBanner');

function setError(fieldId, hasError) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle('error', hasError);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  const depart = document.getElementById('depart').value;
  const arrivee = document.getElementById('arrivee').value;
  const date = document.getElementById('dateDepart').value;

  setError('f-depart', !depart); if (!depart) valid = false;
  setError('f-arrivee', !arrivee); if (!arrivee) valid = false;
  setError('f-date', !date); if (!date) valid = false;

  if (depart && arrivee && depart === arrivee) {
    setError('f-arrivee', true);
    valid = false;
  }

  if (!valid) {
    banner.className = 'status-banner show error';
    banner.textContent = "Merci de remplir tous les champs (départ, arrivée et date différents).";
    return;
  }

  // Redirige vers la page de résultats avec les critères de recherche
  const params = new URLSearchParams({ from: depart, to: arrivee, date });
  window.location.href = `resultats.html?${params.toString()}`;
});
