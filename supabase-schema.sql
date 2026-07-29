-- ============================================================
-- CAM travel — schéma Supabase (PostgreSQL)
-- Supabase → "SQL Editor" → "New query" → coller TOUT ce fichier
-- → "Run". (Étape 7 des instructions dans js/supabase-config.js)
--
-- Ce fichier peut être exécuté PLUSIEURS FOIS sans risque (ex: après
-- une mise à jour du projet) : il ne fait que créer ce qui manque
-- encore, sans jamais supprimer vos données existantes.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- PROFILS CLIENTS (infos complémentaires au compte) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text,
  tel text,
  email text,
  ville text,
  created_at timestamptz not null default now()
);

-- Photo de profil (ajoutée pour la page "Mon profil"), stockée comme
-- les photos de pièce d'identité : image compressée en base64.
alter table public.profiles add column if not exists avatar_data text;

-- ---------- RÉSERVATIONS (billets de bus) ----------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  ref text,
  company text,
  from_city text,
  to_city text,
  travel_date text,
  dep text,
  price numeric,
  passagers integer,
  total numeric,
  passager_nom text,
  passager_tel text,
  method text,
  method_label text,
  used boolean not null default false,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Lien vers le compte client qui a réservé (ajouté pour "Mes réservations"
-- / "Mes trajets" / "Paiements" : permet de n'afficher que SES propres
-- réservations au lieu de celles de tout le monde). Reste vide (NULL)
-- pour une réservation faite sans être connecté (invité) ; en cas de
-- suppression du compte, la réservation est conservée mais détachée
-- (utile pour la comptabilité du gérant).
alter table public.reservations add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_reservations_user_id on public.reservations(user_id);

-- Sièges réels + remboursements (ajoutés pour la sélection de sièges et
-- la page "Remboursements"). refund_status : NULL (aucune demande),
-- 'requested', 'approved' ou 'rejected'.
alter table public.reservations add column if not exists trip_id uuid;
alter table public.reservations add column if not exists seat_numbers text;
alter table public.reservations add column if not exists refund_status text;
alter table public.reservations add column if not exists refund_reason text;
alter table public.reservations add column if not exists refund_requested_at timestamptz;
create index if not exists idx_reservations_trip on public.reservations(trip_id, travel_date);

-- ---------- COLIS (envois) ----------
create table if not exists public.colis (
  id uuid primary key default gen_random_uuid(),
  ref text,
  depart text,
  arrivee text,
  poids numeric,
  type_colis text,
  nom_exp text,
  tel_exp text,
  nom_dest text,
  tel_dest text,
  montant numeric,
  created_at timestamptz not null default now()
);

-- ---------- PASSAGERS (pièce d'identité fournie par trajet) ----------
create table if not exists public.passengers (
  id uuid primary key default gen_random_uuid(),
  nom text,
  tel text,
  email text,
  piece text,
  piece_num text,
  photo_data text,
  trajet text,
  travel_date text,
  created_at timestamptz not null default now()
);

-- ---------- ADMINS (rôle) ----------
create table if not exists public.admins (
  email text primary key,
  is_admin boolean not null default true
);

-- ---------- AGENCES PARTENAIRES ----------
-- Une agence est ajoutée par le super-admin depuis la page "agencies.html",
-- de la même façon qu'un admin est ajouté aujourd'hui (compte créé dans
-- Authentication > Users, puis son email lié ici). L'agence se connecte
-- ensuite avec ce compte pour accéder à "agency-dashboard.html".
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  tel text,
  ville text,
  commission_percent numeric not null default 10,
  status text not null default 'active', -- 'active' | 'suspended'
  created_at timestamptz not null default now()
);

-- ---------- TRAJETS RÉELS PROPOSÉS PAR LES AGENCES ----------
-- Remplace le tableau de trajets qui était codé en dur dans
-- js/script-resultats.js : la recherche interroge maintenant cette table.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete cascade,
  from_city text not null,
  to_city text not null,
  dep_time text not null,
  arr_time text not null,
  duration text,
  price numeric not null,
  tags text not null default 'Climatisé',
  seat_count integer not null default 40,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_trips_route on public.trips(from_city, to_city);

-- ============================================================
-- Sécurité (Row Level Security)
-- Réglage simple pour démarrer : lecture/écriture ouvertes sur les
-- données de l'app, équivalent de la règle Firestore de départ
-- ("allow read, write: if true"). La table "admins" reste en
-- lecture seule via l'API : vous ajoutez les administrateurs à la
-- main dans l'éditeur de table Supabase, jamais depuis le site.
-- À resserrer plus tard si besoin (ex: limiter "reservations" au
-- propriétaire une fois l'authentification pleinement exploitée).
--
-- Les "drop policy if exists" ci-dessous servent uniquement à rendre
-- ce fichier ré-exécutable sans erreur ; ils ne suppriment aucune
-- donnée, seulement la règle d'accès qui est aussitôt recréée à
-- l'identique juste en dessous.
-- ============================================================
alter table public.profiles enable row level security;
drop policy if exists "profiles_all" on public.profiles;
create policy "profiles_all" on public.profiles for all using (true) with check (true);

alter table public.reservations enable row level security;
drop policy if exists "reservations_all" on public.reservations;
create policy "reservations_all" on public.reservations for all using (true) with check (true);

alter table public.colis enable row level security;
drop policy if exists "colis_all" on public.colis;
create policy "colis_all" on public.colis for all using (true) with check (true);

alter table public.passengers enable row level security;
drop policy if exists "passengers_all" on public.passengers;
create policy "passengers_all" on public.passengers for all using (true) with check (true);

alter table public.admins enable row level security;
drop policy if exists "admins_read" on public.admins;
create policy "admins_read" on public.admins for select using (true);

alter table public.agencies enable row level security;
drop policy if exists "agencies_all" on public.agencies;
create policy "agencies_all" on public.agencies for all using (true) with check (true);

alter table public.trips enable row level security;
drop policy if exists "trips_all" on public.trips;
create policy "trips_all" on public.trips for all using (true) with check (true);

-- ============================================================
-- Suppression de compte par le client lui-même (page Paramètres)
-- La clé publique ("anon key") ne permet jamais de supprimer un
-- compte d'authentification directement, pour des raisons de
-- sécurité. Cette fonction contourne cette limite de façon sûre :
-- elle s'exécute avec des droits élevés ("security definer") mais
-- ne peut supprimer QUE le compte de la personne qui l'appelle
-- (auth.uid(), déterminé par sa session de connexion, jamais par un
-- paramètre modifiable). Supprimer le compte supprime aussi
-- automatiquement sa ligne "profiles" (grâce à "on delete cascade"
-- ci-dessus) ; ses réservations passées sont conservées mais
-- détachées du compte.
-- ============================================================
create or replace function public.camtravel_delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.camtravel_delete_own_account() to authenticated;

-- ============================================================
-- Données de démarrage (agences + trajets d'exemple)
-- Seulement si ces tables sont encore vides, pour ne jamais dupliquer
-- vos propres données lors d'une réexécution de ce fichier. Ce sont les
-- mêmes trajets qui étaient auparavant codés en dur dans le site — vous
-- pouvez ensuite les modifier ou les supprimer depuis "agencies.html" /
-- "agency-dashboard.html".
-- ============================================================
do $$
begin
  if not exists (select 1 from public.agencies) then
    insert into public.agencies (name, commission_percent, status) values
      ('CAM travel', 10, 'active'),
      ('Express Voyages', 10, 'active'),
      ('General Express', 10, 'active'),
      ('Royal Bus', 10, 'active'),
      ('Dream Transport', 10, 'active');
  end if;

  if not exists (select 1 from public.trips) then
    insert into public.trips (agency_id, from_city, to_city, dep_time, arr_time, duration, price, tags, seat_count)
    select a.id, r.from_city, r.to_city, r.dep_time, r.arr_time, r.duration, r.price, r.tags, 40
    from (values
      ('CAM travel',      'Yaoundé',  'Douala',    '08:00 AM', '10:30 AM', '2h30m',  12500, 'VIP,Climatisé,WiFi'),
      ('Express Voyages', 'Yaoundé',  'Douala',    '08:00 AM', '11:30 AM', '2h30m',  11000, 'VIP,Climatisé,WiFi'),
      ('General Express', 'Yaoundé',  'Douala',    '10:00 AM', '12:30 PM', '2h30m',  13000, 'VIP,Climatisé,WiFi'),
      ('Royal Bus',       'Yaoundé',  'Douala',    '11:00 AM', '01:30 PM', '2h30m',  12000, 'VIP,Climatisé,WiFi'),
      ('Dream Transport', 'Yaoundé',  'Douala',    '01:00 PM', '03:30 PM', '2h30m',  11500, 'VIP,Climatisé,WiFi'),
      ('CAM travel',      'Douala',   'Yaoundé',   '09:00 AM', '11:30 AM', '2h30m',  12500, 'VIP,Climatisé,WiFi'),
      ('Royal Bus',       'Douala',   'Bafoussam', '07:00 AM', '11:00 AM', '4h00m',  10000, 'Climatisé,WiFi'),
      ('Express Voyages', 'Douala',   'Bafoussam', '02:00 PM', '06:00 PM', '4h00m',  10000, 'Climatisé,WiFi'),
      ('Dream Transport', 'Bertoua',  'Yaoundé',   '09:00 AM', '02:00 PM', '5h00m',  15000, 'Climatisé'),
      ('General Express', 'Yaoundé',  'Garoua',    '06:00 AM', '06:00 PM', '12h00m', 25000, 'VIP,Climatisé')
    ) as r(agency_name, from_city, to_city, dep_time, arr_time, duration, price, tags)
    join public.agencies a on a.name = r.agency_name;
  end if;
end $$;
