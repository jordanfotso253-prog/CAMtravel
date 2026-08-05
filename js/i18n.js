/**
 * CAM travel — système de traduction global (Français / English)
 */
(function () {
  const LANG_KEY = 'camtravel_lang';

  const EN = {
    'Accueil': 'Home', 'Trajets': 'Trips', 'Réservations': 'Bookings', 'Colis': 'Parcels',
    'À propos': 'About', 'Contact': 'Contact', 'Se connecter': 'Sign in', "S'inscrire": 'Sign up',
    'Voyagez en toute sérénité': 'Travel with peace of mind', 'Rechercher un trajet': 'Search a trip',
    'Politique de confidentialité': 'Privacy policy', "Conditions d'utilisation": 'Terms of use',
    'Gérant': 'Manager', 'Gérant :': 'Manager:',
    'Tableau de bord': 'Dashboard', 'Mes trajets': 'My trips', 'Suivi': 'Tracking',
    'Paiements': 'Payments', 'Remboursements': 'Refunds', 'Notifications': 'Notifications',
    'Profil': 'Profile', 'Paramètres': 'Settings', 'Déconnexion': 'Log out',
    'Mes réservations': 'My bookings', 'Mon profil': 'My profile',
    'Vérifier un ticket': 'Verify a ticket', 'Utilisateurs': 'Users', 'Agences': 'Agencies',
    'Commissions': 'Commissions', 'Véhicules': 'Vehicles', 'Conducteurs': 'Drivers',
    'Rapports': 'Reports', 'Bienvenue, Administrateur': 'Welcome, Administrator',
    'Espace agence': 'Agency space', 'Agences partenaires': 'Partner agencies',
    'Ajouter une agence': 'Add an agency', "Nom de l'agence": 'Agency name',
    'Email (compte de connexion)': 'Email (login account)', 'Commission (%)': 'Commission (%)',
    'Ajouter un trajet': 'Add a trip', "Chiffre d'affaires": 'Revenue', 'Revenus': 'Revenue',
    'Réservations (30 derniers jours)': 'Bookings (last 30 days)',
    'Réservations récentes': 'Recent bookings', 'Demandes de remboursement': 'Refund requests',
    "Pièces d'identité reçues": 'ID documents received',
    'Photos envoyées par les passagers lors de la réservation, pour vérification.': 'Photos submitted by passengers at booking, for verification.',
    'Voyagez en toute sérénité avec': 'Travel with peace of mind with',
    'Réservez vos billets de bus et envoyez vos colis en ligne, auprès d’agences partenaires de confiance partout au Cameroun.': 'Book bus tickets and ship parcels online with trusted partner agencies across Cameroon.',
    'Réservez vos billets de bus en ligne en toute simplicité et sécurité.': 'Book your bus tickets online simply and securely.',
    'Réserver maintenant': 'Book now', 'Envoyer un colis': 'Send a parcel',
    'Trajets multiples': 'Multiple routes', 'Plusieurs destinations': 'Several destinations',
    'Destinations nationales': 'Nationwide destinations', 'Réservation facile': 'Easy booking',
    'En quelques clics': 'In a few clicks', 'Paiement sécurisé': 'Secure payment',
    '100% sécurisé': '100% secure', 'Mobile Money & carte': 'Mobile Money & card',
    'Support 24/7': '24/7 support', 'Nous sommes là': 'We are here',
    'Nous sommes là pour vous': 'We are here for you', 'Comment ça marche': 'How it works',
    'Un parcours simple, du départ à l’arrivée.': 'A simple journey from search to boarding.',
    'Recherchez': 'Search',
    'Choisissez départ, arrivée et date parmi les trajets des agences partenaires.': 'Pick departure, arrival and date among partner agency trips.',
    'Sélectionnez': 'Select',
    'Comparez horaires, prix et confort, puis choisissez vos sièges.': 'Compare times, prices and comfort, then choose your seats.',
    'Payez': 'Pay',
    'Réglez en Mobile Money, carte bancaire ou à bord selon l’offre.': 'Pay with Mobile Money, card, or on board when available.',
    'Voyagez': 'Travel',
    'Recevez votre billet électronique avec QR code et présentez-le à l’embarquement.': 'Get your e-ticket with QR code and show it at boarding.',
    'Destinations populaires': 'Popular destinations',
    'Les axes les plus demandés sur CAM travel.': 'The most requested routes on CAM travel.',
    'Voir les trajets': 'View trips', 'À propos de CAM travel': 'About CAM travel',
    'CAM travel est une plateforme camerounaise qui met en relation voyageurs et agences de transport partenaires. Nous facilitons la réservation de billets de bus et l’envoi de colis, avec un suivi clair et un support réactif.': 'CAM travel is a Cameroonian platform connecting travelers with partner transport agencies. We make bus ticket booking and parcel shipping simple, with clear tracking and responsive support.',
    'Plusieurs agences partenaires vérifiées': 'Verified partner agencies',
    'Billets électroniques avec QR code': 'Electronic tickets with QR code',
    'Remboursements et suivi des trajets': 'Refunds and trip tracking',
    'Données protégées (comptes sécurisés)': 'Protected data (secure accounts)',
    'Prêt à partir ?': 'Ready to go?',
    'Réservez votre prochain trajet en quelques minutes.': 'Book your next trip in a few minutes.',
    'En ligne': 'Online',
    'Connexion': 'Sign in', 'Inscription': 'Sign up', 'Créer un compte': 'Create an account',
    'Déjà un compte ?': 'Already have an account?', 'Pas encore de compte ?': 'No account yet?',
    'Nom complet': 'Full name', 'Téléphone': 'Phone', 'Email': 'Email',
    'Mot de passe': 'Password', 'Confirmer le mot de passe': 'Confirm password', 'Ville': 'City',
    "J'accepte les conditions d'utilisation": 'I accept the terms of use',
    'Se souvenir de moi': 'Remember me', 'Mot de passe oublié ?': 'Forgot password?',
    'Ou continuer avec': 'Or continue with', 'Identifiant': 'Username / email',
    'Entrez votre email': 'Enter your email', 'Entrez votre mot de passe': 'Enter your password',
    'Entrez votre nom complet': 'Enter your full name', 'Champ requis.': 'Required field.',
    'Email invalide.': 'Invalid email.', 'Format attendu : 6XXXXXXXX.': 'Expected format: 6XXXXXXXX.',
    'Rechercher': 'Search', 'Sélectionner': 'Select', 'Sièges': 'Seats', 'Passagers': 'Passengers',
    'Paiement': 'Payment', 'Départ': 'Departure', 'Arrivée': 'Arrival',
    'Date de départ': 'Departure date', 'Nombre de passagers': 'Number of passengers',
    'Aller simple': 'One way', 'Aller-retour': 'Round trip', 'Choisir une ville': 'Choose a city',
    'Veuillez choisir une ville de départ.': 'Please choose a departure city.',
    "Veuillez choisir une ville d'arrivée.": 'Please choose an arrival city.',
    'Veuillez choisir une date.': 'Please choose a date.', 'Ville de départ': 'Departure city',
    "Ville d'arrivée": 'Arrival city', 'trajet trouvé': 'trip found', 'trajets trouvés': 'trips found',
    'Choisir': 'Choose', 'Détail du trajet': 'Trip details', 'Continuer': 'Continue',
    'Choisissez vos sièges': 'Choose your seats', 'Avant du bus': 'Front of the bus',
    'Libre': 'Available', 'Sélectionné': 'Selected', 'Occupé': 'Occupied',
    'siège sélectionné': 'seat selected', 'sièges sélectionnés': 'seats selected',
    'Aucun siège sélectionné': 'No seat selected', 'Informations passager': 'Passenger information',
    'Passager': 'Passenger', "Pièce d'identité": 'ID document', "N° pièce d'identité": 'ID number',
    "Photo de la pièce d'identité (recto)": 'ID photo (front)',
    'Prendre une photo ou choisir un fichier': 'Take a photo or choose a file',
    "JPG, PNG — utilisé uniquement pour vérifier l'identité du passager": 'JPG, PNG — used only to verify passenger identity',
    "Carte Nationale d'Identité": 'National ID card', 'Passeport': 'Passport',
    'Permis de conduire': 'Driving licence', 'Ajouter un passager': 'Add a passenger',
    'Récapitulatif': 'Summary', 'Trajet': 'Trip', 'Date': 'Date',
    'Prix par passager': 'Price per passenger', 'Total à payer': 'Total to pay',
    'Méthode de paiement': 'Payment method', 'Mobile Money': 'Mobile Money',
    'MTN, Orange, Moov': 'MTN, Orange, Moov', 'Carte bancaire': 'Bank card',
    'Visa, Mastercard': 'Visa, Mastercard', 'Paiement à bord': 'Pay on board',
    'Payez au conducteur': 'Pay the driver', 'Payer': 'Pay',
    'Réservation confirmée !': 'Booking confirmed!',
    'Votre réservation a été effectuée avec succès.': 'Your booking was completed successfully.',
    'Référence': 'Reference', 'Montant payé': 'Amount paid',
    'Télécharger le ticket': 'Download ticket', "Retour à l'accueil": 'Back to home',
    'Mon ticket': 'My ticket', 'Présentez ce ticket au conducteur': 'Show this ticket to the driver',
    'Siège': 'Seat', 'Merci pour votre confiance. Bon voyage !': 'Thank you for your trust. Have a good trip!',
    'Télécharger': 'Download', 'Bienvenue': 'Welcome', 'Total dépensé': 'Total spent',
    'Transactions': 'Transactions', 'Historique des paiements': 'Payment history',
    'Toutes': 'All', 'À venir': 'Upcoming', 'Passées': 'Past', 'Passé': 'Past',
    'Nouvelle réservation': 'New booking', 'Nouveau trajet': 'New trip',
    'Trajets à venir': 'Upcoming trips', 'Trajets passés': 'Past trips',
    'Suivi de mes trajets': 'Track my trips',
    'Position estimée à partir des horaires du trajet (pas encore un GPS embarqué en direct).': 'Estimated position from trip schedules (not live onboard GPS yet).',
    "Aucune notification pour l'instant.": 'No notifications yet.',
    'Aucune réservation pour le moment.': 'No bookings yet.',
    'Aucune réservation à venir pour le moment.': 'No upcoming bookings yet.',
    'Aucune réservation passée pour le moment.': 'No past bookings yet.',
    "Aucun paiement pour l'instant.": 'No payments yet.',
    'Aucun trajet à venir. Réservez-en un dès maintenant !': 'No upcoming trips. Book one now!',
    "Aucun trajet passé pour l'instant.": 'No past trips yet.',
    'Aucun trajet à suivre pour le moment. Vos prochains départs apparaîtront ici.': 'No trip to track right now. Your next departures will appear here.',
    'Réservations éligibles': 'Eligible bookings', 'Mes demandes': 'My requests',
    'Demander un remboursement': 'Request a refund', 'Demande envoyée': 'Request sent',
    'Remboursé': 'Refunded', 'Refusée': 'Rejected',
    "Aucune réservation éligible pour l'instant.": 'No eligible bookings yet.',
    "Aucune demande pour l'instant.": 'No requests yet.',
    'Préférences': 'Preferences', 'Langue': 'Language',
    "Langue d'affichage du site": 'Site display language', 'Thème': 'Theme',
    'Apparence claire ou sombre': 'Light or dark appearance', 'Clair': 'Light', 'Sombre': 'Dark',
    'Notifications par email': 'Email notifications',
    'Confirmations de réservation, rappels de départ': 'Booking confirmations, departure reminders',
    'Notifications SMS': 'SMS notifications', 'Rappels par SMS avant le départ': 'SMS reminders before departure',
    'Offres promotionnelles': 'Promotional offers',
    'Recevoir les réductions et offres spéciales': 'Receive discounts and special offers',
    'Zone sensible': 'Danger zone', 'Supprimer mon compte': 'Delete my account',
    'Cette action est irréversible': 'This action cannot be undone', 'Supprimer': 'Delete',
    'Enregistrer les modifications': 'Save changes', 'Préférences enregistrées.': 'Preferences saved.',
    'Ces préférences s’appliquent à votre session administrateur sur cet appareil.': 'These preferences apply to your admin session on this device.',
    "Ces préférences s'appliquent à votre session administrateur sur cet appareil.": 'These preferences apply to your admin session on this device.',
    'Expéditeur': 'Sender', 'Destinataire': 'Recipient', 'Poids (kg)': 'Weight (kg)',
    'Type de colis': 'Parcel type', 'Montant': 'Amount', 'Estimer / Envoyer': 'Estimate / Send',
    'Tarifs indicatifs': 'Indicative rates',
    'Entrez la référence indiquée sur le ticket du passager (ex: YA482913)': 'Enter the reference shown on the passenger ticket (e.g. YA482913)',
    'Vérifier': 'Verify', 'Ticket introuvable': 'Ticket not found',
    'Ticket déjà utilisé': 'Ticket already used', 'Ticket valide ✓': 'Valid ticket ✓',
    'Marquer comme utilisé (embarquement)': 'Mark as used (boarding)', 'Voir tout': 'View all',
    'Aucun trajet pour ce parcours à cette date. Essayez une autre ville ou une autre date.': 'No trips for this route on this date. Try another city or date.',
    'Recherche des trajets…': 'Searching trips…', 'Passager 1': 'Passenger 1',
    '1 Passager': '1 Passenger', '2 Passagers': '2 Passengers', '3 Passagers': '3 Passengers',
    '4 Passagers': '4 Passengers', '5+ Passagers': '5+ Passengers',
    'Active': 'Active', 'Suspendue': 'Suspended', 'Suspendre': 'Suspend', 'Réactiver': 'Reactivate',
    "Aucune agence pour l'instant.": 'No agencies yet.', "Aucune donnée pour l'instant.": 'No data yet.',

    'Agence ajoutée.': 'Agency added.',
    "Aucune pièce d'identité reçue pour l'instant.": 'No ID documents received yet.',
    'Aucune demande en attente.': 'No pending requests.',
    "Aucun trajet pour l'instant. Ajoutez-en un ci-dessus.": 'No trips yet. Add one above.',
    "Impossible de mettre à jour l'agence pour le moment.": 'Unable to update the agency right now.',
    "Impossible d'ajouter l'agence pour le moment.": 'Unable to add the agency right now.',
    "Impossible d'ajouter le trajet pour le moment.": 'Unable to add the trip right now.',
    'Trajet ajouté.': 'Trip added.',
    "Choisissez une ville de départ et d'arrivée.": 'Choose a departure and arrival city.',
    'Bonjour': 'Hello',
    'Client': 'Customer',
    'Réservation confirmée': 'Booking confirmed',
    'Merci de renseigner vos identifiants.': 'Please enter your credentials.',
    'Connexion en cours...': 'Signing in...',
    'Connexion réussie ! Redirection vers votre tableau de bord...': 'Signed in! Redirecting to your dashboard...',
    'Email ou mot de passe incorrect.': 'Incorrect email or password.',
    'Confirmez votre email avant de vous connecter (vérifiez votre boîte de réception).': 'Confirm your email before signing in (check your inbox).',
    'Trop de tentatives. Réessayez dans quelques minutes.': 'Too many attempts. Try again in a few minutes.',
    'Connexion réussie (mode démo — configurez Supabase pour une vraie vérification du mot de passe). Redirection...': 'Signed in (demo mode — configure Supabase for real password checks). Redirecting...',
    'Création du compte en cours...': 'Creating account...',
    'Compte créé avec succès pour': 'Account created successfully for',
    'Cet email est déjà utilisé par un compte existant.': 'This email is already used by an existing account.',
    "Cette adresse email n'est pas acceptée, essayez-en une autre.": 'This email address is not accepted, try another.',
    'Le mot de passe est trop faible (6 caractères minimum).': 'Password is too weak (minimum 6 characters).',
    'Modifications enregistrées.': 'Changes saved.',
    "Impossible d'enregistrer les modifications pour le moment. Vérifiez votre connexion et réessayez.": 'Unable to save changes right now. Check your connection and try again.',
    'Paiement en cours de traitement...': 'Payment processing...',
    'Votre demande de remboursement a été envoyée.': 'Your refund request has been sent.',
    "Impossible d'envoyer la demande pour le moment. Réessayez.": 'Unable to send the request right now. Please try again.',
    "Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.": 'Do you really want to delete your account? This cannot be undone.',
    'Compte supprimé. À bientôt !': 'Account deleted. See you soon!',
    'Gare Routière': 'Bus station',
    'Envoi…': 'Sending…',
    'Pourquoi souhaitez-vous être remboursé ? (facultatif)': 'Why would you like a refund? (optional)',
    'Supprimer ce paiement de votre historique ? Cette action est irréversible.': 'Remove this payment from your history? This cannot be undone.',
    "Impossible de supprimer ce paiement pour le moment. Réessayez.": 'Unable to delete this payment right now. Please try again.',
    'Vérification en cours...': 'Verifying...',
    "Aucune réservation ne correspond à la référence": 'No booking matches the reference',
    "Ce ticket n'est pas valide.": 'This ticket is not valid.',
    'Ce ticket a déjà été validé le': 'This ticket was already validated on',
    'Départ prévu à': 'Departure scheduled at',
    'Arrivé à': 'Arrived at',
    'En route — arrivée estimée à': 'En route — estimated arrival at',
    '+ Nouvelle réservation': '+ New booking',
    '+ Nouveau trajet': '+ New trip',

  };

  const KEYS = {
    'nav.home': 'Accueil', 'nav.trips': 'Trajets', 'nav.bookings': 'Réservations',
    'nav.parcels': 'Colis', 'nav.about': 'À propos', 'nav.contact': 'Contact',
    'nav.login': 'Se connecter', 'nav.signup': "S'inscrire",
    'brand.tagline': 'Voyagez en toute sérénité',
    'side.dashboard': 'Tableau de bord', 'side.settings': 'Paramètres', 'side.logout': 'Déconnexion',
    'settings.title': 'Paramètres', 'settings.notifications': 'Notifications',
    'settings.email': 'Notifications par email',
    'settings.email.sub': 'Confirmations de réservation, rappels de départ',
    'settings.sms': 'Notifications SMS', 'settings.sms.sub': 'Rappels par SMS avant le départ',
    'settings.promo': 'Offres promotionnelles',
    'settings.promo.sub': 'Recevoir les réductions et offres spéciales',
    'settings.prefs': 'Préférences', 'settings.lang': 'Langue',
    'settings.lang.sub': "Langue d'affichage du site",
    'settings.theme': 'Thème', 'settings.theme.sub': 'Apparence claire ou sombre',
    'settings.theme.light': 'Clair', 'settings.theme.dark': 'Sombre',
    'settings.danger': 'Zone sensible', 'settings.delete': 'Supprimer mon compte',
    'settings.delete.sub': 'Cette action est irréversible', 'settings.delete.btn': 'Supprimer',
    'settings.saved': 'Préférences enregistrées.',
    'settings.admin.note': 'Ces préférences s’appliquent à votre session administrateur sur cet appareil.',
    'home.hero.title': 'Voyagez en toute sérénité avec',
    'home.hero.subtitle': 'Réservez vos billets de bus et envoyez vos colis en ligne, auprès d’agences partenaires de confiance partout au Cameroun.',
    'home.hero.cta': 'Réserver maintenant', 'home.hero.cta2': 'Envoyer un colis',
    'home.stat.routes': 'Trajets multiples', 'home.stat.routes.sub': 'Destinations nationales',
    'home.stat.easy': 'Réservation facile', 'home.stat.easy.sub': 'En quelques clics',
    'home.stat.pay': 'Paiement sécurisé', 'home.stat.pay.sub': 'Mobile Money & carte',
    'home.stat.support': 'Support 24/7', 'home.stat.support.sub': 'Nous sommes là pour vous',
    'home.how.title': 'Comment ça marche', 'home.how.sub': 'Un parcours simple, du départ à l’arrivée.',
    'home.how.1.title': 'Recherchez',
    'home.how.1.text': 'Choisissez départ, arrivée et date parmi les trajets des agences partenaires.',
    'home.how.2.title': 'Sélectionnez',
    'home.how.2.text': 'Comparez horaires, prix et confort, puis choisissez vos sièges.',
    'home.how.3.title': 'Payez',
    'home.how.3.text': 'Réglez en Mobile Money, carte bancaire ou à bord selon l’offre.',
    'home.how.4.title': 'Voyagez',
    'home.how.4.text': 'Recevez votre billet électronique avec QR code et présentez-le à l’embarquement.',
    'home.routes.title': 'Destinations populaires',
    'home.routes.sub': 'Les axes les plus demandés sur CAM travel.',
    'home.routes.book': 'Voir les trajets',
    'home.about.title': 'À propos de CAM travel',
    'home.about.text': 'CAM travel est une plateforme camerounaise qui met en relation voyageurs et agences de transport partenaires. Nous facilitons la réservation de billets de bus et l’envoi de colis, avec un suivi clair et un support réactif.',
    'home.about.point1': 'Plusieurs agences partenaires vérifiées',
    'home.about.point2': 'Billets électroniques avec QR code',
    'home.about.point3': 'Remboursements et suivi des trajets',
    'home.about.point4': 'Données protégées (comptes sécurisés)',
    'home.cta.title': 'Prêt à partir ?',
    'home.cta.text': 'Réservez votre prochain trajet en quelques minutes.',
    'home.cta.btn': 'Rechercher un trajet',
    'footer.manager': 'Gérant',
    'footer.privacy': 'Politique de confidentialité',
    'footer.terms': "Conditions d'utilisation"
  };

  const FR_FROM_EN = {};
  Object.keys(EN).forEach(fr => { FR_FROM_EN[EN[fr]] = fr; });

  function getLang() {
    const s = localStorage.getItem(LANG_KEY);
    return (s === 'en' || s === 'fr') ? s : 'fr';
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'fr') lang = 'fr';
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
    document.dispatchEvent(new CustomEvent('camtravel:lang', { detail: { lang } }));
    return lang;
  }

  function t(keyOrFr, lang) {
    const L = lang || getLang();
    const fr = KEYS[keyOrFr] || keyOrFr;
    if (L === 'en') return EN[fr] || fr;
    return fr;
  }

  function translateText(text, toLang) {
    if (!text) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    if (toLang === 'en') {
      if (EN[trimmed]) return text.replace(trimmed, EN[trimmed]);
      return text;
    }
    if (FR_FROM_EN[trimmed]) return text.replace(trimmed, FR_FROM_EN[trimmed]);
    return text;
  }

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'PATH', 'TEXTAREA']);

  function walk(node, toLang) {
    if (!node) return;
    if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (parent && SKIP_TAGS.has(parent.tagName)) return;
      const raw = node.nodeValue;
      if (!raw || !raw.trim()) return;
      if (/^[\d\s.,:%+\-→FCFA/]+$/i.test(raw.trim())) return;
      const next = translateText(raw, toLang);
      if (next !== raw) node.nodeValue = next;
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node;
    if (SKIP_TAGS.has(el.tagName)) return;
    if (el.hasAttribute('data-i18n')) {
      el.textContent = t(el.getAttribute('data-i18n'), toLang);
      return;
    }
    if (el.hasAttribute('data-i18n-placeholder')) {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'), toLang);
    }
    if (el.placeholder) {
      const p = translateText(el.placeholder, toLang);
      if (p !== el.placeholder) el.placeholder = p;
    }
    if (el.title) {
      const ti = translateText(el.title, toLang);
      if (ti !== el.title) el.title = ti;
    }
    if (el.getAttribute && el.getAttribute('aria-label')) {
      const a = translateText(el.getAttribute('aria-label'), toLang);
      if (a !== el.getAttribute('aria-label')) el.setAttribute('aria-label', a);
    }
    Array.from(el.childNodes).forEach(c => walk(c, toLang));
  }

  let originalSnapshot = null;

  function snapshotFr() {
    if (originalSnapshot) return;
    originalSnapshot = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) {
      const parent = n.parentElement;
      if (parent && SKIP_TAGS.has(parent.tagName)) continue;
      originalSnapshot.push({ node: n, value: n.nodeValue });
    }
    document.querySelectorAll('[placeholder]').forEach(el => {
      el.setAttribute('data-i18n-orig-ph', el.placeholder);
    });
    document.querySelectorAll('[title]').forEach(el => {
      if (!el.closest('svg')) el.setAttribute('data-i18n-orig-title', el.title);
    });
  }

  function restoreFr() {
    if (!originalSnapshot) return;
    originalSnapshot.forEach(({ node, value }) => {
      try { if (node.parentNode) node.nodeValue = value; } catch (e) {}
    });
    document.querySelectorAll('[data-i18n-orig-ph]').forEach(el => {
      el.placeholder = el.getAttribute('data-i18n-orig-ph');
    });
    document.querySelectorAll('[data-i18n-orig-title]').forEach(el => {
      el.title = el.getAttribute('data-i18n-orig-title');
    });
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'), 'fr');
    });
  }

  function applyLang(lang) {
    const L = lang || getLang();
    document.documentElement.lang = L;
    if (!document.body) return;
    if (L === 'fr') {
      if (originalSnapshot) restoreFr();
      else {
        document.querySelectorAll('[data-i18n]').forEach(el => {
          el.textContent = t(el.getAttribute('data-i18n'), 'fr');
        });
      }
    } else {
      snapshotFr();
      walk(document.body, 'en');
      document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'), 'en');
      });
    }
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      const light = themeSelect.querySelector('option[value="light"]');
      const dark = themeSelect.querySelector('option[value="dark"]');
      if (light) light.textContent = t('settings.theme.light', L);
      if (dark) dark.textContent = t('settings.theme.dark', L);
    }
    document.querySelectorAll('#langSelect, #langQuick').forEach(sel => {
      if (sel && sel.value !== L) sel.value = L;
    });
  }

  let observer = null;
  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      if (getLang() !== 'en') return;
      mutations.forEach(m => {
        m.addedNodes.forEach(n => {
          if (n.nodeType === 1 || n.nodeType === 3) walk(n, 'en');
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.camtravelGetLang = getLang;
  window.camtravelSetLang = setLang;
  window.camtravelT = t;
  window.camtravelApplyLang = applyLang;

  function boot() {
    applyLang(getLang());
    startObserver();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
