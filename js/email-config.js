/**
 * ============================================================
 * CONFIGURATION EMAIL — Notifications par e-mail CAM travel
 * ============================================================
 * Option A — EmailJS (recommandé pour un site statique) :
 *   1. Créez un compte sur https://www.emailjs.com (gratuit)
 *   2. Ajoutez un service e-mail (Gmail, Outlook…)
 *   3. Créez un template avec les variables :
 *        {{to_email}} {{to_name}} {{subject}} {{message}}
 *   4. Remplissez les 3 valeurs ci-dessous
 *
 * Option B — Sans EmailJS :
 *   Les e-mails sont enregistrés dans une file locale (outbox)
 *   visible dans Paramètres → Historique e-mails.
 *   Branchez plus tard une Edge Function Supabase / Resend.
 */
window.CAMTRAVEL_EMAIL = {
  enabled: true,
  // EmailJS — laisser vide pour mode « outbox local »
  emailjsPublicKey: '',      // ex: 'user_xxxxxxxxxxxx'
  emailjsServiceId: '',      // ex: 'service_xxxxxxx'
  emailjsTemplateId: '',     // ex: 'template_xxxxxxx'
  // Expéditeur affiché dans les messages
  fromName: 'CAM travel',
  fromEmail: 'noreply@camtravel.cm'
};
