# CAM travel — Corrections à intégrer

Archive prête à décompresser **dans votre dossier projet** (écraser les fichiers du même nom).

## Contenu des corrections

### 1. Base de données (`supabase-schema.sql`)
- Réservations : `source`, `sold_by_agency_id`, `client_local_id`, `synced_at`
- Trajets : `agency_quota` (sièges réservés au guichet)
- RPC sync hors ligne : `camtravel_sync_agency_reservation`
- **Équipe** : tables `agency_members`, `agency_member_events`
- **Territoire** : `agency_branches` (villes), `agency_counters` (Akwa, Bonabéri…)
- Licenciement : RPC `camtravel_terminate_member` (accès coupé, historique gardé)
- Ajout membre : RPC `camtravel_add_agency_member`
- Migration auto : email de `agencies` → membre `owner`

### 2. Hors ligne / vente guichet
- `js/data-store.js` : file d’attente + sync automatique
- `agency-dashboard.html` + `js/script-agency-dashboard.js` : vente guichet, sync, équipe, succursales

### 3. Quota sièges web vs guichet
- `js/script-resultats.js`, `script-detail.js`, `script-seat-selection.js`

### 4. Rôles (admin / agence / client)
- Admin = email dans table `admins`
- Agence = email sur `agencies` **ou** membre actif dans `agency_members`
- Client = le reste

## Installation

1. Décompressez cette archive **par-dessus** votre projet (remplace les fichiers modifiés).
2. Vérifiez `js/supabase-config.js` (vos clés Supabase).
3. Supabase → **SQL Editor** → coller **tout** `supabase-schema.sql` → **Run** (une fois).
4. Testez :
   - Client → dashboard client
   - Admin (email dans `admins`) → admin-dashboard
   - Agence / membre → agency-dashboard (vente, équipe, licenciement)

## Ne plus ouvrir Supabase au quotidien

Après le Run SQL + configuration admin/agence **une fois**, l’app gère seule :
- inscriptions clients
- ventes web + guichet
- sync hors ligne
- ajout / licenciement de collaborateurs (PDG dans l’app)
