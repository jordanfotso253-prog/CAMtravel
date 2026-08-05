/**
 * CAM travel — Notifications par e-mail
 * Respecte les préférences (settings.email / settings.promo).
 * Envoi via EmailJS si configuré, sinon file d'attente locale.
 */
(function () {
  const SETTINGS_KEY = 'camtravel_settings';
  const OUTBOX_KEY = 'camtravel_email_outbox';
  const PROFILE_KEY_HINT = 'camtravel_user'; // fallback

  function cfg() {
    return window.CAMTRAVEL_EMAIL || { enabled: true };
  }

  function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function emailEnabled(kind) {
    if (cfg().enabled === false) return false;
    const s = loadSettings();
    if (kind === 'promo') return s.promo !== false && s.email !== false;
    // booking, refund, depart, system
    return s.email !== false; // défaut activé
  }

  function loadOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveOutbox(list) {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(0, 40)));
  }

  async function resolveRecipient() {
    let email = '';
    let name = '';
    if (typeof camtravelGetMyProfile === 'function') {
      try {
        const p = await camtravelGetMyProfile();
        if (p) {
          email = p.email || '';
          name = p.nom || p.name || '';
        }
      } catch (e) {}
    }
    if (!email && typeof camtravelGetCurrentUser === 'function') {
      try {
        const u = await camtravelGetCurrentUser();
        if (u) {
          email = u.email || '';
          name = u.nom || u.user_metadata?.nom || '';
        }
      } catch (e) {}
    }
    return { email, name };
  }

  function templates(type, data) {
    const d = data || {};
    const fr = {
      booking: {
        subject: `Confirmation de réservation ${d.ref || ''} — CAM travel`,
        message:
`Bonjour ${d.name || ''},

Votre réservation a bien été confirmée.

Référence : ${d.ref || '—'}
Trajet    : ${d.from || ''} → ${d.to || ''}
Date      : ${d.date || '—'}
Départ    : ${d.dep || '—'}
Montant   : ${d.total != null ? Number(d.total).toLocaleString('fr-FR') + ' FCFA' : '—'}

Présentez votre billet (QR) à l'embarquement.
Suivi GPS : disponible depuis votre espace client.

Merci de voyager avec CAM travel.
`
      },
      refund_requested: {
        subject: `Demande de remboursement ${d.ref || ''} — CAM travel`,
        message:
`Bonjour ${d.name || ''},

Nous avons bien reçu votre demande de remboursement pour la réservation ${d.ref || ''}.
Elle sera examinée par notre équipe. Vous serez informé(e) par e-mail du résultat.

Cordialement,
L'équipe CAM travel
`
      },
      refund_approved: {
        subject: `Remboursement approuvé ${d.ref || ''} — CAM travel`,
        message:
`Bonjour ${d.name || ''},

Votre demande de remboursement pour ${d.ref || ''} a été approuvée.
Le montant sera crédité selon le mode de paiement d'origine sous quelques jours ouvrés.

Cordialement,
L'équipe CAM travel
`
      },
      refund_rejected: {
        subject: `Remboursement refusé ${d.ref || ''} — CAM travel`,
        message:
`Bonjour ${d.name || ''},

Votre demande de remboursement pour ${d.ref || ''} n'a pas pu être acceptée.
Pour plus d'informations, contactez le support CAM travel.

Cordialement,
L'équipe CAM travel
`
      },
      depart: {
        subject: `Rappel de départ ${d.ref || ''} — CAM travel`,
        message:
`Bonjour ${d.name || ''},

Rappel : votre bus ${d.from || ''} → ${d.to || ''} part bientôt (réf. ${d.ref || ''}).
Pensez à arriver en avance à la gare et à avoir votre billet prêt.

Bon voyage !
CAM travel
`
      },
      test: {
        subject: 'Test de notification e-mail — CAM travel',
        message:
`Bonjour ${d.name || ''},

Ceci est un e-mail de test. Vos notifications par e-mail sont correctement configurées.

CAM travel
`
      },
      promo: {
        subject: d.subject || 'Offre CAM travel',
        message: d.message || 'Découvrez nos offres du moment sur CAM travel.'
      }
    };
    return fr[type] || fr.test;
  }

  function emailjsReady() {
    const c = cfg();
    return !!(c.emailjsPublicKey && c.emailjsServiceId && c.emailjsTemplateId);
  }

  async function sendViaEmailJS(toEmail, toName, subject, message) {
    const c = cfg();
    // Charge le SDK si besoin
    if (!window.emailjs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    window.emailjs.init({ publicKey: c.emailjsPublicKey });
    return window.emailjs.send(c.emailjsServiceId, c.emailjsTemplateId, {
      to_email: toEmail,
      to_name: toName || '',
      subject,
      message,
      from_name: c.fromName || 'CAM travel'
    });
  }

  /**
   * Envoie (ou met en file) un e-mail transactionnel.
   * @param {string} type booking|refund_*|depart|test|promo
   * @param {object} data champs template + email/name optionnels
   */
  async function send(type, data) {
    data = data || {};
    const kind = type === 'promo' ? 'promo' : 'email';
    if (!emailEnabled(kind)) {
      return { ok: false, reason: 'disabled' };
    }

    const recipient = await resolveRecipient();
    const toEmail = data.email || recipient.email;
    const toName = data.name || recipient.name || '';
    if (!toEmail) {
      return { ok: false, reason: 'no-email' };
    }

    const tpl = templates(type, { ...data, name: toName });
    const subject = tpl.subject;
    const message = tpl.message;

    const entry = {
      id: 'E' + Date.now().toString(36),
      type,
      to: toEmail,
      subject,
      message,
      status: 'queued',
      at: new Date().toISOString()
    };

    try {
      if (emailjsReady()) {
        await sendViaEmailJS(toEmail, toName, subject, message);
        entry.status = 'sent';
      } else {
        entry.status = 'local'; // file locale — pas de fournisseur configuré
      }
    } catch (e) {
      entry.status = 'error';
      entry.error = String(e && e.message || e);
      console.warn('Email send failed', e);
    }

    const box = loadOutbox();
    box.unshift(entry);
    saveOutbox(box);

    document.dispatchEvent(new CustomEvent('camtravel:email', { detail: entry }));
    return { ok: entry.status === 'sent' || entry.status === 'local', entry };
  }

  // Raccourcis
  async function sendBooking(data) { return send('booking', data); }
  async function sendRefund(status, data) {
    const map = { requested: 'refund_requested', approved: 'refund_approved', rejected: 'refund_rejected' };
    return send(map[status] || 'refund_requested', data);
  }
  async function sendDepart(data) { return send('depart', data); }
  async function sendTest() { return send('test', {}); }

  window.camtravelEmail = {
    send, sendBooking, sendRefund, sendDepart, sendTest,
    emailEnabled, loadOutbox, emailjsReady, templates, resolveRecipient
  };
})();
