create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('solicitation-images', 'solicitation-images', true)
on conflict (id) do nothing;

create table if not exists public.solicitation_submissions (
  id uuid primary key default gen_random_uuid(),
  couple_name text not null,
  partner_one text not null,
  partner_two text not null,
  email text not null,
  wedding_date date not null,
  ceremony_venue text not null,
  reception_venue text not null,
  guest_count integer not null,
  physical_invitations boolean not null default false,
  invitation_style text,
  overall_vibe text not null,
  color_palette text not null,
  locale text not null check (locale in ('en', 'es')),
  created_at timestamptz not null default now()
);

create table if not exists public.solicitation_features (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  feature text not null,
  created_at timestamptz not null default now()
);

create index if not exists solicitation_features_submission_id_idx
  on public.solicitation_features (submission_id);

create table if not exists public.solicitation_typography (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  selection text not null,
  sort_order integer not null check (sort_order between 1 and 3),
  created_at timestamptz not null default now()
);

create index if not exists solicitation_typography_submission_id_idx
  on public.solicitation_typography (submission_id);

create table if not exists public.solicitation_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  storage_bucket text not null default 'solicitation-images',
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  file_size integer not null,
  public_url text not null,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index if not exists solicitation_images_submission_id_idx
  on public.solicitation_images (submission_id);

alter table public.solicitation_submissions enable row level security;
alter table public.solicitation_features enable row level security;
alter table public.solicitation_typography enable row level security;
alter table public.solicitation_images enable row level security;
