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

-- Association directe agence + vente guichet + sync hors ligne (Cameroun :
-- connexion instable). source = 'web' | 'agency' | 'phone'.
-- sold_by_agency_id : agence qui a encaissé au guichet (même si trip_id
-- est encore NULL le temps d'une sync).
-- client_local_id : identifiant généré sur le poste d'agence hors ligne
-- pour éviter les doublons au moment de la synchronisation.
-- synced_at : horodatage de l'arrivée effective dans Supabase (la date
-- de vente reste created_at / éventuellement une heure locale côté client).
alter table public.reservations add column if not exists source text not null default 'web';
-- sold_by_agency_id : uuid sans FK ici (la table agencies est créée plus
-- bas). La contrainte de clé étrangère est ajoutée juste après agencies.
alter table public.reservations add column if not exists sold_by_agency_id uuid;
alter table public.reservations add column if not exists client_local_id text;
alter table public.reservations add column if not exists synced_at timestamptz;
create index if not exists idx_reservations_agency_sold on public.reservations(sold_by_agency_id);
-- Unicité partielle : une même vente hors ligne ne peut être synchronisée
-- qu'une seule fois (ré-exécution de la file d'attente sans doublon).
create unique index if not exists idx_reservations_client_local_id
  on public.reservations(client_local_id)
  where client_local_id is not null;

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

-- FK réservations → agences (posée ici car agencies vient d'être créée).
-- Ré-exécutable : n'ajoute la contrainte que si elle n'existe pas encore.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reservations_sold_by_agency_id_fkey'
  ) then
    alter table public.reservations
      add constraint reservations_sold_by_agency_id_fkey
      foreign key (sold_by_agency_id)
      references public.agencies(id)
      on delete set null;
  end if;
end $$;

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

-- Quota de sièges réservés au guichet (non vendables en ligne).
-- Ex. seat_count=40, agency_quota=10 → web voit les sièges 1–30,
-- l'agence peut vendre 1–40 (dont 31–40 réservés au guichet).
alter table public.trips add column if not exists agency_quota integer not null default 10;

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
    -- Vente guichet : l'agence voit aussi ce qu'elle a encaissé
    -- même si trip_id n'est pas encore renseigné.
    or public.camtravel_owns_agency(sold_by_agency_id)
  );

drop policy if exists "reservations_insert" on public.reservations;
create policy "reservations_insert" on public.reservations for insert
  with check (
    -- Client / invité (web) : user_id null ou le sien
    (user_id is null or auth.uid() = user_id)
    -- OU agent d'agence qui enregistre une vente pour SON agence
    or (
      public.camtravel_owns_agency(sold_by_agency_id)
      and (source = 'agency' or source is null)
    )
  );

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
-- Sync vente agence (hors ligne → cloud)
-- Appelée depuis le poste d'agence quand Internet revient.
-- - Vérifie que le compte connecté appartient bien à l'agence
--   (sold_by_agency_id ou le trajet indiqué).
-- - Idempotente via client_local_id : si la même vente a déjà été
--   synchronisée, renvoie la ligne existante sans en créer une 2e.
-- - Pose source = 'agency' et synced_at = now().
-- ============================================================
create or replace function public.camtravel_sync_agency_reservation(
  p_client_local_id text,
  p_ref text,
  p_company text,
  p_from_city text,
  p_to_city text,
  p_travel_date text,
  p_dep text,
  p_price numeric,
  p_passagers integer,
  p_total numeric,
  p_passager_nom text,
  p_passager_tel text,
  p_method text,
  p_method_label text,
  p_trip_id uuid,
  p_seat_numbers text,
  p_sold_by_agency_id uuid,
  p_created_at timestamptz default null
)
returns public.reservations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agency_id uuid;
  v_existing public.reservations;
  v_row public.reservations;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise pour synchroniser une vente agence';
  end if;

  if p_client_local_id is null or length(trim(p_client_local_id)) = 0 then
    raise exception 'client_local_id obligatoire pour la synchronisation hors ligne';
  end if;

  -- Idempotence : déjà synchronisée ?
  select * into v_existing
  from public.reservations
  where client_local_id = p_client_local_id
  limit 1;

  if found then
    return v_existing;
  end if;

  -- Détermine l'agence : paramètre explicite, sinon via le trajet
  v_agency_id := p_sold_by_agency_id;
  if v_agency_id is null and p_trip_id is not null then
    select agency_id into v_agency_id
    from public.trips
    where id = p_trip_id;
  end if;

  if v_agency_id is null then
    raise exception 'Impossible de déterminer l''agence (sold_by_agency_id ou trip_id requis)';
  end if;

  if not public.camtravel_owns_agency(v_agency_id)
     and not public.camtravel_is_admin() then
    raise exception 'Cette vente ne peut être synchronisée que par l''agence propriétaire ou un admin';
  end if;

  insert into public.reservations (
    ref, company, from_city, to_city, travel_date, dep,
    price, passagers, total, passager_nom, passager_tel,
    method, method_label, trip_id, seat_numbers,
    source, sold_by_agency_id, client_local_id, synced_at, created_at,
    user_id
  ) values (
    upper(trim(p_ref)), p_company, p_from_city, p_to_city, p_travel_date, p_dep,
    p_price, coalesce(p_passagers, 1), p_total, p_passager_nom, p_passager_tel,
    p_method, p_method_label, p_trip_id, p_seat_numbers,
    'agency', v_agency_id, trim(p_client_local_id), now(),
    coalesce(p_created_at, now()),
    auth.uid()
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.camtravel_sync_agency_reservation(
  text, text, text, text, text, text, text, numeric, integer, numeric,
  text, text, text, text, uuid, text, uuid, timestamptz
) from public, anon, authenticated;
grant execute on function public.camtravel_sync_agency_reservation(
  text, text, text, text, text, text, text, numeric, integer, numeric,
  text, text, text, text, uuid, text, uuid, timestamptz
) to authenticated;

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

-- ============================================================
-- ÉQUIPE AGENCE + SUCCURSALES + GUICHETS + LICENCIEMENTS
-- (Compagnie = table agencies existante ; villes / quartiers en plus)
-- ============================================================

-- Succursale = une ville (ex. Douala, Yaoundé)
create table if not exists public.agency_branches (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  name text not null,
  city text not null,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_agency_branches_agency on public.agency_branches(agency_id);

-- Guichet = point de vente dans une ville (ex. Akwa, Bonabéri)
create table if not exists public.agency_counters (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.agency_branches(id) on delete cascade,
  name text not null,
  neighborhood text,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index if not exists idx_agency_counters_branch on public.agency_counters(branch_id);

-- Membres (PDG, responsables, caissiers…) — ne jamais supprimer, seulement désactiver
create table if not exists public.agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  branch_id uuid references public.agency_branches(id) on delete set null,
  counter_id uuid references public.agency_counters(id) on delete set null,
  email text not null,
  user_id uuid references auth.users(id) on delete set null,
  role text not null default 'cashier'
    check (role in ('owner', 'regional_manager', 'counter_manager', 'cashier', 'controller')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'suspended', 'terminated')),
  hired_at timestamptz not null default now(),
  terminated_at timestamptz,
  termination_reason text,
  termination_note text,
  terminated_by uuid references auth.users(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (agency_id, email)
);
create index if not exists idx_agency_members_email on public.agency_members (lower(email));
create index if not exists idx_agency_members_agency on public.agency_members(agency_id);

-- Journal RH (embauche, suspension, licenciement, changement de rôle)
create table if not exists public.agency_member_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.agency_members(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete set null,
  event_type text not null,
  old_status text,
  new_status text,
  old_role text,
  new_role text,
  note text,
  done_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_member_events_member
  on public.agency_member_events(member_id, created_at desc);

-- Ventes : qui / où (historique même après licenciement)
alter table public.reservations add column if not exists sold_by_branch_id uuid;
alter table public.reservations add column if not exists sold_by_counter_id uuid;
alter table public.reservations add column if not exists sold_by_member_id uuid;

-- ---------- RLS équipe / succursales / guichets ----------
alter table public.agency_branches enable row level security;
alter table public.agency_counters enable row level security;
alter table public.agency_members enable row level security;
alter table public.agency_member_events enable row level security;

-- Helper : membre actif de cette agence ?
create or replace function public.camtravel_is_agency_member(p_agency_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.agency_members
    where agency_id = p_agency_id
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and status = 'active'
  );
$$;

create or replace function public.camtravel_is_agency_owner_or_manager(p_agency_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.agency_members
    where agency_id = p_agency_id
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and status = 'active'
      and role in ('owner', 'regional_manager')
  );
$$;

revoke execute on function public.camtravel_is_agency_member(uuid) from public, anon, authenticated;
revoke execute on function public.camtravel_is_agency_owner_or_manager(uuid) from public, anon, authenticated;
grant execute on function public.camtravel_is_agency_member(uuid) to anon, authenticated;
grant execute on function public.camtravel_is_agency_owner_or_manager(uuid) to anon, authenticated;

drop policy if exists "branches_select" on public.agency_branches;
create policy "branches_select" on public.agency_branches for select
  using (public.camtravel_is_admin() or public.camtravel_is_agency_member(agency_id) or public.camtravel_owns_agency(agency_id));

drop policy if exists "branches_write" on public.agency_branches;
create policy "branches_write" on public.agency_branches for all
  using (public.camtravel_is_admin() or public.camtravel_is_agency_owner_or_manager(agency_id) or public.camtravel_owns_agency(agency_id))
  with check (public.camtravel_is_admin() or public.camtravel_is_agency_owner_or_manager(agency_id) or public.camtravel_owns_agency(agency_id));

drop policy if exists "counters_select" on public.agency_counters;
create policy "counters_select" on public.agency_counters for select
  using (
    public.camtravel_is_admin()
    or exists (
      select 1 from public.agency_branches b
      where b.id = agency_counters.branch_id
        and (public.camtravel_is_agency_member(b.agency_id) or public.camtravel_owns_agency(b.agency_id))
    )
  );

drop policy if exists "counters_write" on public.agency_counters;
create policy "counters_write" on public.agency_counters for all
  using (
    public.camtravel_is_admin()
    or exists (
      select 1 from public.agency_branches b
      where b.id = agency_counters.branch_id
        and (public.camtravel_is_agency_owner_or_manager(b.agency_id) or public.camtravel_owns_agency(b.agency_id))
    )
  )
  with check (
    public.camtravel_is_admin()
    or exists (
      select 1 from public.agency_branches b
      where b.id = agency_counters.branch_id
        and (public.camtravel_is_agency_owner_or_manager(b.agency_id) or public.camtravel_owns_agency(b.agency_id))
    )
  );

drop policy if exists "members_select" on public.agency_members;
create policy "members_select" on public.agency_members for select
  using (
    public.camtravel_is_admin()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.camtravel_is_agency_member(agency_id)
    or public.camtravel_owns_agency(agency_id)
  );

drop policy if exists "members_insert" on public.agency_members;
create policy "members_insert" on public.agency_members for insert
  with check (
    public.camtravel_is_admin()
    or public.camtravel_is_agency_owner_or_manager(agency_id)
    or public.camtravel_owns_agency(agency_id)
  );

drop policy if exists "members_update" on public.agency_members;
create policy "members_update" on public.agency_members for update
  using (
    public.camtravel_is_admin()
    or public.camtravel_is_agency_owner_or_manager(agency_id)
    or public.camtravel_owns_agency(agency_id)
  )
  with check (
    public.camtravel_is_admin()
    or public.camtravel_is_agency_owner_or_manager(agency_id)
    or public.camtravel_owns_agency(agency_id)
  );

drop policy if exists "members_delete" on public.agency_members;
create policy "members_delete" on public.agency_members for delete
  using (public.camtravel_is_admin());

drop policy if exists "member_events_select" on public.agency_member_events;
create policy "member_events_select" on public.agency_member_events for select
  using (
    public.camtravel_is_admin()
    or public.camtravel_is_agency_member(agency_id)
    or public.camtravel_owns_agency(agency_id)
  );

drop policy if exists "member_events_insert" on public.agency_member_events;
create policy "member_events_insert" on public.agency_member_events for insert
  with check (
    public.camtravel_is_admin()
    or public.camtravel_is_agency_owner_or_manager(agency_id)
    or public.camtravel_owns_agency(agency_id)
  );

-- Migration : email de agencies → membre owner actif
insert into public.agency_members (agency_id, email, role, status)
select a.id, lower(a.email), 'owner', 'active'
from public.agencies a
where a.email is not null
  and length(trim(a.email)) > 0
  and not exists (
    select 1 from public.agency_members m
    where m.agency_id = a.id and lower(m.email) = lower(a.email)
  );

-- RPC : licencier un membre (accès coupé, historique conservé)
create or replace function public.camtravel_terminate_member(
  p_member_id uuid,
  p_reason text default 'layoff',
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.agency_members;
  v_old_status text;
begin
  select * into v_member from public.agency_members where id = p_member_id;
  if not found then
    raise exception 'Membre introuvable';
  end if;

  if not (
    public.camtravel_is_admin()
    or public.camtravel_is_agency_owner_or_manager(v_member.agency_id)
    or public.camtravel_owns_agency(v_member.agency_id)
  ) then
    raise exception 'Droits insuffisants pour licencier ce membre';
  end if;

  if v_member.status = 'terminated' then
    return true;
  end if;

  v_old_status := v_member.status;

  update public.agency_members
  set status = 'terminated',
      terminated_at = now(),
      termination_reason = coalesce(p_reason, 'layoff'),
      termination_note = p_note,
      terminated_by = auth.uid()
  where id = p_member_id;

  insert into public.agency_member_events (
    member_id, agency_id, event_type, old_status, new_status, note, done_by
  ) values (
    p_member_id, v_member.agency_id, 'terminated', v_old_status, 'terminated', p_note, auth.uid()
  );

  return true;
end;
$$;

revoke execute on function public.camtravel_terminate_member(uuid, text, text) from public, anon, authenticated;
grant execute on function public.camtravel_terminate_member(uuid, text, text) to authenticated;

-- RPC : ajouter un membre (invitation)
create or replace function public.camtravel_add_agency_member(
  p_agency_id uuid,
  p_email text,
  p_role text default 'cashier',
  p_branch_id uuid default null,
  p_counter_id uuid default null
)
returns public.agency_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.agency_members;
  v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) < 3 then
    raise exception 'Email invalide';
  end if;

  if not (
    public.camtravel_is_admin()
    or public.camtravel_is_agency_owner_or_manager(p_agency_id)
    or public.camtravel_owns_agency(p_agency_id)
  ) then
    raise exception 'Droits insuffisants pour ajouter un membre';
  end if;

  insert into public.agency_members (
    agency_id, email, role, status, branch_id, counter_id, invited_by
  ) values (
    p_agency_id, v_email,
    coalesce(nullif(p_role, ''), 'cashier'),
    'active',
    p_branch_id, p_counter_id, auth.uid()
  )
  on conflict (agency_id, email) do update
    set role = excluded.role,
        branch_id = coalesce(excluded.branch_id, public.agency_members.branch_id),
        counter_id = coalesce(excluded.counter_id, public.agency_members.counter_id),
        status = case
          when public.agency_members.status = 'terminated' then 'active'
          else public.agency_members.status
        end,
        terminated_at = null,
        termination_reason = null,
        termination_note = null
  returning * into v_row;

  insert into public.agency_member_events (
    member_id, agency_id, event_type, new_status, new_role, done_by
  ) values (
    v_row.id, p_agency_id, 'hired', v_row.status, v_row.role, auth.uid()
  );

  return v_row;
end;
$$;

revoke execute on function public.camtravel_add_agency_member(uuid, text, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.camtravel_add_agency_member(uuid, text, text, uuid, uuid) to authenticated;
