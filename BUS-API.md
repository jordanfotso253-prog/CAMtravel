# Intégration API Bus — CAM travel

## Architecture

CAM travel agrège les trajets via 3 sources (dans l’ordre) :

1. **Catalogue interne** — trajets saisis par les agences partenaires (localStorage / Supabase)
2. **Supabase** — base de données cloud (si configurée dans `js/supabase-config.js`)
3. **API externe** — optionnelle, quand un opérateur ou agrégateur vous donne un accès

Fichiers :
- `js/bus-api-config.js` — configuration
- `js/bus-api.js` — couche d’intégration (`camtravelBusApi.searchTrips`)

## Activer une API partenaire

Éditez `js/bus-api-config.js` :

```js
window.CAMTRAVEL_BUS_API = {
  externalEnabled: true,
  baseUrl: 'https://api.partenaire.cm/v1',
  apiKey: 'votre_cle',
  mergeWithLocal: true,
  timeoutMs: 8000
};
```

### Contrat REST attendu

`GET /trips?from=Yaoundé&to=Douala&date=2026-08-15`

```json
{
  "trips": [
    {
      "id": "123",
      "company": "Express Voyages",
      "from": "Yaoundé",
      "to": "Douala",
      "dep": "08:00 AM",
      "arr": "11:00 AM",
      "duration": "3h00m",
      "price": 12000,
      "seatCount": 40,
      "tags": ["Climatisé", "WiFi"]
    }
  ]
}
```

## Contexte Cameroun

Il n’existe pas d’API nationale publique de billetterie bus.
Les plateformes (70seater, Bookaam, Mboabus, Boreze…) sont des concurrents, pas des fournisseurs d’API ouvertes.

**Stratégie recommandée :**
1. Faire signer les agences partenaires sur CAM travel (espace agence)
2. Elles publient destinations, prix et horaires elles-mêmes
3. Plus tard : connecter une API privée si un gros opérateur vous l’ouvre

## Test

1. Recherche Yaoundé → Douala → résultats du catalogue
2. Admin → statut « API Bus » sous le graphique mensuel
