-- ============================================================
-- CAM travel — schéma Supabase (PostgreSQL)
-- À exécuter UNE SEULE FOIS : Supabase → "SQL Editor" → "New query"
-- → coller tout ce fichier → "Run".
-- (Étape 7 des instructions dans js/supabase-config.js)
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

-- ============================================================
-- Sécurité (Row Level Security)
-- Réglage simple pour démarrer : lecture/écriture ouvertes sur les
-- données de l'app, équivalent de la règle Firestore de départ
-- ("allow read, write: if true"). La table "admins" reste en
-- lecture seule via l'API : vous ajoutez les administrateurs à la
-- main dans l'éditeur de table Supabase, jamais depuis le site.
-- À resserrer plus tard si besoin (ex: limiter "reservations" au
-- propriétaire une fois l'authentification pleinement exploitée).
-- ============================================================
alter table public.profiles enable row level security;
create policy "profiles_all" on public.profiles for all using (true) with check (true);

alter table public.reservations enable row level security;
create policy "reservations_all" on public.reservations for all using (true) with check (true);

alter table public.colis enable row level security;
create policy "colis_all" on public.colis for all using (true) with check (true);

alter table public.passengers enable row level security;
create policy "passengers_all" on public.passengers for all using (true) with check (true);

alter table public.admins enable row level security;
create policy "admins_read" on public.admins for select using (true);
