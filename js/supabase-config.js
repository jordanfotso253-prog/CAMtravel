/**
 * ============================================================
 * CONFIGURATION SUPABASE — À REMPLIR PAR FOTSO-JORDAN
 * ============================================================
 * Ce fichier connecte le site à votre base de données Supabase.
 * Tant que vous n'avez pas rempli vos vraies clés ci-dessous, le site
 * continue de fonctionner normalement en mode "local" (comme avant).
 *
 * COMMENT OBTENIR VOS CLÉS (5 minutes, gratuit) :
 * 1. Allez sur https://supabase.com puis cliquez "Start your project"
 * 2. Connectez-vous (GitHub ou email) puis cliquez "New project"
 * 3. Nommez-le "camtravel", choisissez un mot de passe pour la base
 *    (notez-le de côté) et une région proche de vous
 * 4. Une fois le projet créé (environ 1 minute), ouvrez
 *    Project Settings (icône ⚙️ en bas à gauche) → "API Keys"
 * 5. Copiez la valeur "Project URL" dans SUPABASE_URL ci-dessous
 * 6. Copiez la clé publique — "Publishable key" (commence par
 *    sb_publishable_...) ou "anon public" si votre tableau de bord
 *    affiche encore l'ancien système — dans SUPABASE_ANON_KEY
 *    ci-dessous. Ne prenez JAMAIS la clé "secret" / "service_role" :
 *    elle ne doit jamais apparaître dans un site public.
 * 7. Menu de gauche "SQL Editor" → "New query" → collez tout le
 *    contenu du fichier supabase-schema.sql (fourni avec ce projet)
 *    → cliquez "Run". Cela crée les tables nécessaires.
 * 8. Menu de gauche "Authentication" → "Providers" → "Email" →
 *    désactivez "Confirm email", pour que les nouveaux comptes
 *    clients soient utilisables immédiatement (sinon chaque client
 *    doit cliquer un lien reçu par email avant de pouvoir se
 *    connecter).
 * 9. POUR DEVENIR ADMINISTRATEUR : créez d'abord votre propre compte
 *    client sur inscription.html avec VOTRE email. Puis dans
 *    Supabase : "Table Editor" → table "admins" → "Insert row" →
 *    mettez votre email (tout en minuscules) dans la colonne "email"
 *    et cochez "is_admin" à true. Vous pourrez alors ouvrir
 *    admin-dashboard.html avec ce compte.
 * ============================================================
 */

const SUPABASE_URL = "https://wddprzhujtnofxaeznfx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BBzgb7lecv97Xxd_oKG4lQ_UZYbQh4L";

// Détecte automatiquement si les clés ont été remplies
window.CAMTRAVEL_SUPABASE_ENABLED =
  SUPABASE_URL !== "REMPLACER_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "REMPLACER_SUPABASE_ANON_KEY";

if (window.CAMTRAVEL_SUPABASE_ENABLED && typeof supabase !== 'undefined') {
  window.camtravelSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
