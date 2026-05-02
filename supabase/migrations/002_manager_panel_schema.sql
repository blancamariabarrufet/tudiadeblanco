create extension if not exists pgcrypto;

alter table public.solicitation_submissions
  alter column wedding_date drop not null,
  alter column ceremony_venue drop not null,
  alter column reception_venue drop not null,
  alter column guest_count drop not null,
  alter column overall_vibe drop not null,
  alter column color_palette drop not null;

create table if not exists public.panel_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text unique,
  password_hash text,
  language text not null default 'es' check (language in ('en', 'es')),
  features text[] not null default '{}',
  submission_id uuid references public.solicitation_submissions(id) on delete set null,
  is_active boolean not null default false,
  access_status text not null default 'pending' check (access_status in ('pending', 'approved', 'rejected')),
  auth_provider text not null default 'password' check (auth_provider in ('password', 'google')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table if exists public.panel_users
  add column if not exists email text,
  add column if not exists access_status text not null default 'pending',
  add column if not exists auth_provider text not null default 'password',
  add column if not exists approved_at timestamptz;

alter table if exists public.panel_users
  alter column password_hash drop not null;

create unique index if not exists panel_users_email_lower_idx
  on public.panel_users (lower(email))
  where email is not null;

create index if not exists panel_users_submission_id_idx
  on public.panel_users (submission_id);

create index if not exists panel_users_access_status_idx
  on public.panel_users (access_status);

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null default '',
  rsvp_status text not null default 'awaiting' check (rsvp_status in ('confirmed', 'declined', 'pending', 'awaiting')),
  dietary text not null default '',
  plus_one boolean not null default false,
  table_id uuid,
  notes text not null default '',
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists guests_submission_id_idx
  on public.guests (submission_id);

create unique index if not exists guests_submission_email_idx
  on public.guests (submission_id, lower(email))
  where email <> '';

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity integer not null default 8 check (capacity > 0),
  shape text not null default 'round' check (shape in ('round', 'rectangular')),
  x integer not null default 0,
  y integer not null default 0,
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists tables_submission_id_idx
  on public.tables (submission_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guests_table_id_fkey'
      and conrelid = 'public.guests'::regclass
  ) then
    alter table public.guests
      add constraint guests_table_id_fkey
      foreign key (table_id) references public.tables(id) on delete set null;
  end if;
end $$;

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  description text not null default '',
  budgeted numeric not null default 0,
  actual numeric not null default 0,
  deposit_paid numeric not null default 0,
  payment_due_date date,
  paid_status text not null default 'unpaid' check (paid_status in ('unpaid', 'deposit_paid', 'fully_paid')),
  notes text not null default '',
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists budget_items_submission_id_idx
  on public.budget_items (submission_id);

create table if not exists public.knowledge_base (
  submission_id uuid primary key references public.solicitation_submissions(id) on delete cascade,
  context_block text not null default '',
  updated_at timestamptz
);

create table if not exists public.qa_pairs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  "order" integer not null default 0,
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists qa_pairs_submission_id_idx
  on public.qa_pairs (submission_id, "order");

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  date date not null default current_date,
  scheduled_at timestamptz,
  image_url text,
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists news_posts_submission_id_idx
  on public.news_posts (submission_id, created_at desc);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  anonymous boolean not null default false,
  body text not null,
  read boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  submission_id uuid not null references public.solicitation_submissions(id) on delete cascade
);

create index if not exists letters_submission_id_idx
  on public.letters (submission_id, created_at desc);

create table if not exists public.rsvp_settings (
  submission_id uuid primary key references public.solicitation_submissions(id) on delete cascade,
  is_open boolean not null default true,
  deadline date,
  meal_options text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.panel_users enable row level security;
alter table public.guests enable row level security;
alter table public.tables enable row level security;
alter table public.budget_items enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.qa_pairs enable row level security;
alter table public.news_posts enable row level security;
alter table public.letters enable row level security;
alter table public.rsvp_settings enable row level security;
