/**
 * ============================================================
 * CONFIGURATION API BUS — CAM travel
 * ============================================================
 * CAM travel agrège les trajets de plusieurs sources :
 *   1. Catalogue local / Supabase (agences partenaires)
 *   2. API externe optionnelle (quand un opérateur vous donne un accès)
 *
 * Il n'existe pas encore d'API nationale publique de billetterie bus
 * au Cameroun. Quand une agence (ou un agrégateur) vous fournit
 * une URL + clé, renseignez-les ci-dessous.
 *
 * Contrat attendu de l'API externe (REST JSON) :
 *   GET {baseUrl}/trips?from=Yaoundé&to=Douala&date=2026-08-15
 *   Headers: Authorization: Bearer {apiKey}  (si apiKey renseigné)
 *   Réponse:
 *   {
 *     "trips": [
 *       {
 *         "id": "ext-123",
 *         "company": "Nom agence",
 *         "from": "Yaoundé",
 *         "to": "Douala",
 *         "dep": "08:00 AM",
 *         "arr": "11:00 AM",
 *         "duration": "3h00m",
 *         "price": 12000,
 *         "seatCount": 40,
 *         "tags": ["Climatisé","WiFi"],
 *         "agencyId": "partner-x"
 *       }
 *     ]
 *   }
 */
window.CAMTRAVEL_BUS_API = {
  // Activer l'appel à une API externe (false = uniquement local + Supabase)
  externalEnabled: false,
  baseUrl: '',           // ex: 'https://api.partenaire.cm/v1'
  apiKey: '',            // clé fournie par le partenaire
  timeoutMs: 8000,
  // Fusionner les résultats externes avec le catalogue interne
  mergeWithLocal: true,
  // Préfixe des ids externes pour éviter les collisions
  externalIdPrefix: 'ext-'
};
