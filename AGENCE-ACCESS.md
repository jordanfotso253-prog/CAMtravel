# Accès agence — une base, des droits par agency_id

## Principe

Toutes les agences utilisent **la même base Supabase** CAM travel.
La séparation se fait par **droits d'accès** (`agency_id`), pas par base séparée.

## Compte agence

Exemple **Amour Voyage** :

| Champ | Valeur |
|--------|--------|
| Nom | Amour Voyage |
| Email | admin@amourvoyage.com |
| Rôle | `agence_admin` |
| agency_id | `ag-amour` (ou UUID Supabase) |

À la connexion, CamTravel résout l'agence via :
1. Session locale `camtravel_agency_session`, ou
2. Table `agencies` où `email` = email du compte Auth

## Dashboard

N'affiche que :
- trajets avec `agency_id` = mon id
- réservations sur ces trajets
- bus / personnel / lieux / locations du réseau

Filtre **Lieu** : tous les sites du réseau (Yaoundé, Douala…) ou un seul gare — toujours la même base.

## Comptes démo (mode local)

| Email | Mot de passe | Agence |
|--------|--------------|--------|
| admin@amourvoyage.com | agence123 | Amour Voyage |
| admin@expressvoyages.cm | agence123 | Express Voyages |
| admin@generalexpress.cm | agence123 | General Express |
| admin@royalbus.cm | agence123 | Royal Bus |
| admin@dreamtransport.cm | agence123 | Dream Transport |

## Supabase (production)

1. Créer l'utilisateur dans Authentication
2. Insérer une ligne dans `agencies` avec le **même email**
3. RLS : `camtravel_owns_agency(agency_id)` limite lectures/écritures
