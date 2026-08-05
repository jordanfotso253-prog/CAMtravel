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
-- Chacun ne voit/modifie que SES propres données : un client (via
-- son user_id), une agence (via les trajets qui lui appartiennent),
-- ou un admin (via la table "admins", vérifiée par la fonction
-- camtravel_is_admin() ci-dessous). Ce réglage remplace l'ancien
-- "lecture/écriture ouvertes à tout le monde" qui équivalait à
-- "allow read, write: if true" — testé de bout en bout (client,
-- invité, agence, admin) avant d'être mis ici.
--
-- Les "drop policy if exists" ci-dessous servent uniquement à rendre
-- ce fichier ré-exécutable sans erreur ; ils ne suppriment aucune
-- donnée, seulement la règle d'accès qui est aussitôt recréée juste
-- en dessous.
-- ============================================================

-- ---------- Fonctions utilitaires (utilisées dans les policies) ----------
create or replace function public.camtravel_is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and is_admin = true
  );
$$;

create or replace function public.camtravel_owns_agency(p_agency_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.agencies
    where id = p_agency_id
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.camtravel_trip_is_mine(p_trip_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.trips t
    join public.agencies a on a.id = t.agency_id
    where t.id = p_trip_id
    and a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- IMPORTANT : Supabase accorde EXECUTE automatiquement à anon ET
-- authenticated (en plus du comportement standard de Postgres qui
-- accorde EXECUTE à PUBLIC) sur toute fonction nouvellement créée
-- dans "public". On révoque donc explicitement les TROIS avant de
-- regrant précisément aux rôles voulus : sinon une fonction censée
-- être réservée à "authenticated" resterait en réalité appelable par
-- n'importe quel visiteur non connecté (anon) aussi.
revoke execute on function public.camtravel_is_admin() from public, anon, authenticated;
revoke execute on function public.camtravel_owns_agency(uuid) from public, anon, authenticated;
revoke execute on function public.camtravel_trip_is_mine(uuid) from public, anon, authenticated;

grant execute on function public.camtravel_is_admin() to anon, authenticated;
grant execute on function public.camtravel_owns_agency(uuid) to anon, authenticated;
grant execute on function public.camtravel_trip_is_mine(uuid) to anon, authenticated;

-- ---------- PROFILES : chacun voit/modifie sa propre ligne, l'admin voit tout ----------
alter table public.profiles enable row level security;

drop policy if exists "profiles_all" on public.profiles;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.camtravel_is_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- RESERVATIONS : propriétaire + admin + agence concernée ----------
alter table public.reservations enable row level security;

drop policy if exists "reservations_all" on public.reservations;

drop policy if exists "reservations_select" on public.reservations;
create policy "reservations_select" on public.reservations for select
  using (
    auth.uid() = user_id
    or public.camtravel_is_admin()
    or public.camtravel_trip_is_mine(trip_id)
  );

drop policy if exists "reservations_insert" on public.reservations;
create policy "reservations_insert" on public.reservations for insert
  with check (user_id is null or auth.uid() = user_id);

drop policy if exists "reservations_update" on public.reservations;
create policy "reservations_update" on public.reservations for update
  using (public.camtravel_is_admin())
  with check (public.camtravel_is_admin());

drop policy if exists "reservations_delete" on public.reservations;
create policy "reservations_delete" on public.reservations for delete
  using (auth.uid() = user_id);

-- ---------- COLIS : n'importe qui peut envoyer, seul l'admin peut consulter ----------
-- (pas de compte associé aux colis dans ce projet)
alter table public.colis enable row level security;

drop policy if exists "colis_all" on public.colis;

drop policy if exists "colis_insert" on public.colis;
create policy "colis_insert" on public.colis for insert
  with check (true);

drop policy if exists "colis_select" on public.colis;
create policy "colis_select" on public.colis for select
  using (public.camtravel_is_admin());

-- ---------- PASSENGERS : idem colis (infos pièce d'identité, admin seul en lecture) ----------
alter table public.passengers enable row level security;

drop policy if exists "passengers_all" on public.passengers;

drop policy if exists "passengers_insert" on public.passengers;
create policy "passengers_insert" on public.passengers for insert
  with check (true);

drop policy if exists "passengers_select" on public.passengers;
create policy "passengers_select" on public.passengers for select
  using (public.camtravel_is_admin());

-- ---------- ADMINS : lecture réservée aux comptes connectés (pas au grand public) ----------
alter table public.admins enable row level security;

drop policy if exists "admins_read" on public.admins;
create policy "admins_read" on public.admins for select
  using (auth.role() = 'authenticated');

-- ---------- AGENCIES : lecture publique (recherche sans compte), écriture réservée ----------
-- à l'admin (ou à l'agence elle-même pour sa propre ligne). La lecture reste
-- ouverte à tous car le nom de l'agence doit s'afficher dans les résultats
-- de recherche même pour un visiteur non connecté.
alter table public.agencies enable row level security;

drop policy if exists "agencies_all" on public.agencies;

drop policy if exists "agencies_select" on public.agencies;
create policy "agencies_select" on public.agencies for select
  using (true);

drop policy if exists "agencies_insert" on public.agencies;
create policy "agencies_insert" on public.agencies for insert
  with check (public.camtravel_is_admin());

drop policy if exists "agencies_update" on public.agencies;
create policy "agencies_update" on public.agencies for update
  using (public.camtravel_is_admin() or email = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (public.camtravel_is_admin() or email = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ---------- TRIPS : lecture publique (recherche sans compte) ----------
-- écriture réservée à l'agence propriétaire du trajet (ou à l'admin)
alter table public.trips enable row level security;

drop policy if exists "trips_all" on public.trips;

drop policy if exists "trips_select" on public.trips;
create policy "trips_select" on public.trips for select
  using (true);

drop policy if exists "trips_insert" on public.trips;
create policy "trips_insert" on public.trips for insert
  with check (public.camtravel_is_admin() or public.camtravel_owns_agency(agency_id));

drop policy if exists "trips_update" on public.trips;
create policy "trips_update" on public.trips for update
  using (public.camtravel_is_admin() or public.camtravel_owns_agency(agency_id))
  with check (public.camtravel_is_admin() or public.camtravel_owns_agency(agency_id));

drop policy if exists "trips_delete" on public.trips;
create policy "trips_delete" on public.trips for delete
  using (public.camtravel_is_admin() or public.camtravel_owns_agency(agency_id));

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

revoke execute on function public.camtravel_delete_own_account() from public, anon, authenticated;
grant execute on function public.camtravel_delete_own_account() to authenticated;

-- ============================================================
-- Fonctions RPC pour les cas qui restent accessibles sans compte
-- (sélection de siège, vérification de ticket à l'embarquement) ou
-- qui doivent vérifier une appartenance avant d'écrire (demande de
-- remboursement). Avant, ces cas nécessitaient une table entièrement
-- ouverte ; chaque fonction ci-dessous ne fait QUE ce que son nom dit,
-- rien d'autre n'est exposé.
-- ============================================================

-- Places déjà prises pour un trajet + une date : ne renvoie QUE les
-- numéros de sièges, jamais les infos passager (nom, tél, prix...).
-- Accessible sans compte (page de sélection de siège, avant paiement).
create or replace function public.camtravel_get_occupied_seats(p_trip_id uuid, p_travel_date text)
returns table(seat_numbers text)
language sql
security definer
set search_path = ''
stable
as $$
  select r.seat_numbers from public.reservations r
  where r.trip_id = p_trip_id
  and r.travel_date = p_travel_date
  and r.seat_numbers is not null;
$$;

revoke execute on function public.camtravel_get_occupied_seats(uuid, text) from public, anon, authenticated;
grant execute on function public.camtravel_get_occupied_seats(uuid, text) to anon, authenticated;

-- Recherche d'un ticket par sa référence (page de vérification à
-- l'embarquement). Reste accessible sans compte comme aujourd'hui,
-- mais uniquement pour UNE référence exacte à la fois (impossible de
-- lister/exporter toutes les réservations via cette fonction).
create or replace function public.camtravel_find_reservation_by_ref(p_ref text)
returns setof public.reservations
language sql
security definer
set search_path = ''
stable
as $$
  select * from public.reservations
  where ref = upper(trim(p_ref))
  limit 1;
$$;

revoke execute on function public.camtravel_find_reservation_by_ref(text) from public, anon, authenticated;
grant execute on function public.camtravel_find_reservation_by_ref(text) to anon, authenticated;

-- Marque un ticket comme utilisé (embarquement). Reste accessible sans
-- compte comme aujourd'hui (page contrôleur), mais ne peut QUE changer
-- used/used_at, jamais le prix, le passager ou toute autre colonne.
create or replace function public.camtravel_mark_ticket_used(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reservations
  set used = true, used_at = now()
  where id = p_reservation_id;
  return found;
end;
$$;

revoke execute on function public.camtravel_mark_ticket_used(uuid) from public, anon, authenticated;
grant execute on function public.camtravel_mark_ticket_used(uuid) to anon, authenticated;

-- Demande de remboursement par le client connecté. Vérifie que la
-- réservation lui appartient AVANT de modifier uniquement les colonnes
-- de remboursement (jamais le prix, le statut "used", etc.).
create or replace function public.camtravel_request_refund(p_reservation_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reservations
  set refund_status = 'requested',
      refund_reason = p_reason,
      refund_requested_at = now()
  where id = p_reservation_id
  and user_id = auth.uid();
  return found;
end;
$$;

revoke execute on function public.camtravel_request_refund(uuid, text) from public, anon, authenticated;
grant execute on function public.camtravel_request_refund(uuid, text) to authenticated;

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


-- ---------- LIEUX / GARES D'UNE AGENCE (multi-villes, même agency_id) ----------
create table if not exists public.agency_locations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  city text not null,
  address text,
  tel text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_agency_locations_agency on public.agency_locations(agency_id);

alter table public.agency_locations enable row level security;
drop policy if exists "agency_locations_select" on public.agency_locations;
create policy "agency_locations_select" on public.agency_locations for select
  using (true);
drop policy if exists "agency_locations_write" on public.agency_locations;
create policy "agency_locations_write" on public.agency_locations for all
  using (public.camtravel_is_admin() or public.camtravel_owns_agency(agency_id))
  with check (public.camtravel_is_admin() or public.camtravel_owns_agency(agency_id));

-- Colonne optionnelle location_id sur les trajets
alter table public.trips add column if not exists location_id uuid references public.agency_locations(id) on delete set null;
