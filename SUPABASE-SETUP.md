# CAM travel — Configuration Supabase

Firebase a été entièrement retiré du projet et remplacé par Supabase. Le
site fonctionne déjà en mode "local" (stockage dans le navigateur) sans
rien configurer. Suivez les étapes ci-dessous quand vous voudrez une
vraie base de données partagée en ligne.

## 1. Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com) → **Start your project**
2. Connectez-vous (GitHub ou email) → **New project**
3. Nommez-le `camtravel`, choisissez un mot de passe pour la base
   (notez-le de côté) et une région proche de vous
4. Patientez ~1 minute que le projet soit prêt

## 2. Récupérer vos clés

Dans le projet → **Project Settings** (icône ⚙️) → **API Keys** :

- **Project URL** → à coller dans `SUPABASE_URL`
- Clé publique — **Publishable key** (commence par `sb_publishable_...`)
  ou **anon public** si votre tableau de bord affiche encore l'ancien
  système → à coller dans `SUPABASE_ANON_KEY`
- Ne prenez **jamais** la clé `secret` / `service_role` : elle ne doit
  jamais apparaître dans un site public.

Ouvrez `js/supabase-config.js` et remplacez les deux valeurs
`REMPLACER_SUPABASE_URL` / `REMPLACER_SUPABASE_ANON_KEY` par les vôtres.

## 3. Créer les tables

Menu de gauche **SQL Editor** → **New query** → collez tout le contenu
du fichier `supabase-schema.sql` (fourni avec le projet) → **Run**.

Cela crée les 5 tables utilisées par le site : `profiles`,
`reservations`, `colis`, `passengers`, `admins`, avec un accès ouvert
en lecture/écriture (équivalent de la règle Firestore de départ) sauf
`admins` qui reste en lecture seule via le site.

## 4. Activer les comptes clients

Menu de gauche **Authentication** → **Providers** → **Email** →
désactivez **Confirm email**. Sans cette étape, chaque nouveau client
doit cliquer un lien reçu par email avant de pouvoir se connecter.

## 5. Devenir administrateur

1. Créez d'abord votre propre compte client sur `inscription.html`
   avec **votre** email
2. Dans Supabase : **Table Editor** → table `admins` → **Insert row**
3. Mettez votre email (tout en minuscules) dans la colonne `email` et
   cochez `is_admin` à `true`
4. Vous pouvez maintenant ouvrir `admin-dashboard.html` avec ce compte

## Fichiers concernés par le changement

- `js/supabase-config.js` — remplace `js/firebase-config.js` (supprimé)
- `supabase-schema.sql` — schéma des tables à exécuter une seule fois
- `js/data-store.js`, `js/auth-guard.js`, `js/admin-guard.js`,
  `js/script.js`, `js/script-login.js` — adaptés pour Supabase
- Les 12 pages qui chargeaient le SDK Firebase chargent maintenant le
  SDK Supabase à la place

Tant que les clés ne sont pas renseignées, tout continue de fonctionner
exactement comme avant (mode local dans le navigateur).

## Mise à jour : activation du profil, des paiements et des notifications

`supabase-schema.sql` a été complété (photo de profil, lien entre une
réservation et son compte, suppression de compte). Pour que ces
fonctionnalités marchent avec votre projet Supabase existant : **SQL
Editor → New query → recollez tout le contenu de `supabase-schema.sql`
→ Run.** Le fichier est conçu pour être ré-exécuté sans danger : il ne
fait qu'ajouter ce qui manque, aucune donnée existante n'est touchée.
