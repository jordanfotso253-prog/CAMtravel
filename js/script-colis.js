const TARIFFS = [
  { a: 'Yaoundé', b: 'Douala', price: 3000, delay: '24h' },
  { a: 'Yaoundé', b: 'Bafoussam', price: 3500, delay: '24h' },
  { a: 'Douala', b: 'Bafoussam', price: 3000, delay: '24h' },
  { a: 'Yaoundé', b: 'Bertoua', price: 4000, delay: '24-48h' },
  { a: 'Yaoundé', b: 'Bamenda', price: 4000, delay: '24h' },
  { a: 'Douala', b: 'Buea', price: 2000, delay: 'Quelques heures' },
  { a: 'Yaoundé', b: 'Ebolowa', price: 3000, delay: '24h' },
  { a: 'Yaoundé', b: 'Ngaoundéré', price: 5500, delay: '48h' },
  { a: 'Yaoundé', b: 'Garoua', price: 6000, delay: '48h' },
  { a: 'Yaoundé', b: 'Maroua', price: 7000, delay: '48-72h' },
];
const DEFAULT_TARIFF = { price: 4500, delay: '24-48h' }; // pour les trajets non listés

function findTariff(from, to) {
  if (!from || !to) return null;
  const match = TARIFFS.find(t =>
    (t.a === from && t.b === to) || (t.a === to && t.b === from)
  );
  return match || DEFAULT_TARIFF;
}

const departSelect = document.getElementById('depart');
const arriveeSelect = document.getElementById('arrivee');
const tarifDisplay = document.getElementById('tarifEstime');
const poidsInput = document.getElementById('poids');

function updateTarif() {
  const from = departSelect.value;
  const to = arriveeSelect.value;
  const poids = Number(poidsInput.value) || 0;

  if (!from || !to || from === to) {
    tarifDisplay.textContent = '—';
    return;
  }

  const t = findTariff(from, to);
  const supplementPoids = poids > 10 ? (poids - 10) * 200 : 0; // supplément si > 10kg
  const total = t.price + supplementPoids;
  tarifDisplay.textContent = `${total.toLocaleString('fr-FR')} FCFA · Délai ${t.delay}`;
}

departSelect.addEventListener('change', updateTarif);
arriveeSelect.addEventListener('change', updateTarif);
poidsInput.addEventListener('input', updateTarif);

const form = document.getElementById('colisForm');
const banner = document.getElementById('statusBanner');

function setError(fieldId, hasError) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle('error', hasError);
}

const NAME_REGEX = /^[A-Za-zÀ-ÿ' -]{2,50}$/;
const PHONE_REGEX = /^(\+237)?6\d{8}$/;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  let valid = true;

  const depart = departSelect.value;
  const arrivee = arriveeSelect.value;
  const poids = Number(poidsInput.value);
  const typeColis = document.getElementById('typeColis').value;
  const nomExp = document.getElementById('nomExp').value.trim();
  const telExp = document.getElementById('telExp').value.trim().replace(/\s+/g, '');
  const nomDest = document.getElementById('nomDest').value.trim();
  const telDest = document.getElementById('telDest').value.trim().replace(/\s+/g, '');

  setError('f-depart', !depart); if (!depart) valid = false;
  setError('f-arrivee', !arrivee || arrivee === depart); if (!arrivee || arrivee === depart) valid = false;

  const poidsOk = poids >= 1 && poids <= 100;
  setError('f-poids', !poidsOk); if (!poidsOk) valid = false;

  const nomExpOk = NAME_REGEX.test(nomExp);
  setError('f-nomExp', !nomExpOk); if (!nomExpOk) valid = false;

  const telExpOk = PHONE_REGEX.test(telExp);
  setError('f-telExp', !telExpOk); if (!telExpOk) valid = false;

  const nomDestOk = NAME_REGEX.test(nomDest);
  setError('f-nomDest', !nomDestOk); if (!nomDestOk) valid = false;

  const telDestOk = PHONE_REGEX.test(telDest);
  setError('f-telDest', !telDestOk); if (!telDestOk) valid = false;

  if (!valid) {
    banner.className = 'status-banner show error';
    banner.textContent = "Merci de corriger les champs en rouge.";
    return;
  }

  const tarif = findTariff(depart, arrivee);
  const supplementPoids = poids > 10 ? (poids - 10) * 200 : 0;
  const montant = tarif.price + supplementPoids;
  const ref = 'CO' + Math.floor(100000 + Math.random() * 900000);

  if (typeof camtravelSaveColis === 'function') {
    await camtravelSaveColis({
      ref, depart, arrivee, poids, typeColis, nomExp, telExp, nomDest, telDest, montant
    });
  }

  banner.className = 'status-banner show success';
  banner.textContent = `Envoi enregistré ! Référence : ${ref} — ${montant.toLocaleString('fr-FR')} FCFA à payer au dépôt du colis.`;
  form.reset();
  tarifDisplay.textContent = '—';
});
