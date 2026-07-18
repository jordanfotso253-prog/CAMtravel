const params = new URLSearchParams(window.location.search);
const blocksContainer = document.getElementById('passengerBlocks');
const addBtn = document.getElementById('addPassengerBtn');
const form = document.getElementById('passengerForm');
const banner = document.getElementById('statusBanner');

let passengerCount = 0;

function addPassengerBlock() {
  passengerCount++;
  const n = passengerCount;
  const block = document.createElement('div');
  block.className = 'passenger-block';
  block.innerHTML = `
    <h3>Passager ${n}</h3>
    <div class="row">
      <div class="field" id="f-nom-${n}">
        <label for="nom-${n}">Nom complet</label>
        <div class="input-wrap">
          <svg class="leading" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input type="text" id="nom-${n}" placeholder="Entrez votre nom complet">
        </div>
        <div class="err-msg">Champ requis.</div>
      </div>
      <div class="field" id="f-tel-${n}">
        <label for="tel-${n}">Téléphone</label>
        <div class="input-wrap">
          <svg class="leading" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <input type="tel" id="tel-${n}" placeholder="Ex : 6 96 74 53 24">
        </div>
        <div class="err-msg">Champ requis.</div>
      </div>
    </div>
    <div class="field" id="f-email-${n}">
      <label for="email-${n}">Email</label>
      <div class="input-wrap">
        <svg class="leading" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>
        <input type="email" id="email-${n}" placeholder="Entrez votre email">
      </div>
      <div class="err-msg">Email invalide.</div>
    </div>
    <div class="row">
      <div class="field">
        <label for="piece-${n}">Pièce d'identité</label>
        <select class="select-input" id="piece-${n}">
          <option value="">Sélectionner</option>
          <option>Carte Nationale d'Identité</option>
          <option>Passeport</option>
          <option>Permis de conduire</option>
        </select>
      </div>
      <div class="field" id="f-piece-num-${n}">
        <label for="piece-num-${n}">N° pièce d'identité</label>
        <div class="input-wrap">
          <input type="text" id="piece-num-${n}" placeholder="Entrez le numéro" style="padding-left:14px;">
        </div>
      </div>
    </div>
    <div class="field">
      <label>Photo de la pièce d'identité (recto)</label>
      <div class="id-upload-box" id="idBox-${n}">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gray-text);"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        <div class="s-title" style="margin-top:6px;">Prendre une photo ou choisir un fichier</div>
        <div class="hint">JPG, PNG — utilisé uniquement pour vérifier l'identité du passager</div>
        <input type="file" accept="image/*" capture="environment" id="idPhoto-${n}">
        <img class="id-preview" id="idPreview-${n}">
      </div>
    </div>
  `;
  blocksContainer.appendChild(block);

  // Compression + aperçu de la photo de pièce d'identité
  const photoInput = document.getElementById(`idPhoto-${n}`);
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 700;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        photoInput.dataset.photoData = compressed;
        const preview = document.getElementById(`idPreview-${n}`);
        preview.src = compressed;
        preview.style.display = 'block';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

addPassengerBlock(); // Passager 1 par défaut
addBtn.addEventListener('click', addPassengerBlock);

function setError(fieldId, hasError) {
  const el = document.getElementById(fieldId);
  if (el) el.classList.toggle('error', hasError);
}

const NAME_REGEX = /^[A-Za-zÀ-ÿ' -]{2,50}$/;
const PHONE_REGEX = /^(\+237)?6\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;
  const passengers = [];

  for (let n = 1; n <= passengerCount; n++) {
    const nom = document.getElementById(`nom-${n}`).value.trim();
    const tel = document.getElementById(`tel-${n}`).value.trim().replace(/\s+/g, '');
    const email = document.getElementById(`email-${n}`).value.trim();

    const nomOk = NAME_REGEX.test(nom);
    setError(`f-nom-${n}`, !nomOk); if (!nomOk) valid = false;

    const telOk = PHONE_REGEX.test(tel);
    setError(`f-tel-${n}`, !telOk); if (!telOk) valid = false;

    const emailOk = EMAIL_REGEX.test(email);
    setError(`f-email-${n}`, !emailOk); if (!emailOk) valid = false;

    const piece = document.getElementById(`piece-${n}`)?.value || '';
    const pieceNum = document.getElementById(`piece-num-${n}`)?.value.trim() || '';
    const photoData = document.getElementById(`idPhoto-${n}`)?.dataset.photoData || null;

    passengers.push({ nom, tel, email, piece, pieceNum, photoData });
  }

  if (!valid) {
    banner.className = 'status-banner show error';
    banner.textContent = "Merci de compléter les informations de chaque passager.";
    return;
  }

  banner.className = 'status-banner show success';
  banner.textContent = "Informations enregistrées ! Redirection vers le paiement...";

  // Enregistre chaque passager (avec sa pièce d'identité) — consultable par
  // le gérant, séparément de la réservation (les photos sont trop lourdes
  // pour être transmises via l'URL comme le reste du parcours).
  if (typeof camtravelSavePassenger === 'function') {
    passengers.forEach(p => {
      camtravelSavePassenger({
        nom: p.nom, tel: p.tel, email: p.email,
        piece: p.piece, pieceNum: p.pieceNum,
        photoData: p.photoData,
        trajet: `${params.get('from') || ''} → ${params.get('to') || ''}`,
        date: params.get('date') || ''
      });
    });
  }

  // Transmet le trajet + le nombre de passagers vers la page de paiement
  const next = new URLSearchParams(params);
  next.set('passagers', passengerCount);
  next.set('passagerNom', passengers[0].nom);
  next.set('passagerTel', passengers[0].tel);
  setTimeout(() => {
    window.location.href = `paiement.html?${next.toString()}`;
  }, 900);
});
