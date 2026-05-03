create table if not exists public.solicitation_design_preferences (
  submission_id uuid primary key references public.solicitation_submissions(id) on delete cascade,
  mood text not null default '',
  mood_other text not null default '',
  photography_style text not null default '',
  photography_style_other text not null default '',
  accent_color text not null default '',
  accent_color_other text not null default '',
  tonal_warmth text not null default '',
  tonal_warmth_other text not null default '',
  typography_feel text not null default '',
  typography_feel_other text not null default '',
  section_priority text[] not null default '{}',
  section_priority_other text not null default '',
  hidden_sections text[] not null default '{}',
  hidden_sections_other text not null default '',
  hero_image text not null default '',
  hero_image_other text not null default '',
  created_at timestamptz not null default now()
);

alter table public.solicitation_design_preferences enable row level security;
