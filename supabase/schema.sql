create table if not exists public.matches (
  id text primary key,
  phase text not null check (phase in ('group', 'knockout')),
  group_name text,
  bracket_round text,
  bracket_column text,
  stage text not null,
  status text not null check (status in ('live', 'upcoming', 'finished')),
  table_name text not null,
  team_a text not null,
  team_b text not null,
  score_a integer not null default 0,
  score_b integer not null default 0,
  detail text not null default '',
  scheduled_label text not null default '',
  note text not null default '',
  together_now integer not null default 0,
  fortune integer not null default 0,
  source_name text,
  source_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.blessings (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  user_id text not null,
  ritual_type text not null check (ritual_type in ('incense', 'mokugyo', 'beads')),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  user_id text not null,
  user_name text not null default '我',
  ritual_label text not null,
  body text not null,
  likes_count integer not null default 0,
  is_repay boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.message_likes (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create table if not exists public.match_updates (
  id uuid primary key default gen_random_uuid(),
  match_id text not null references public.matches(id) on delete cascade,
  source_type text not null default 'weibo_manual',
  source_name text,
  source_url text,
  raw_text text,
  parsed_result jsonb,
  updated_by text,
  created_at timestamptz not null default now()
);

create index if not exists blessings_match_id_idx on public.blessings(match_id);
create index if not exists messages_match_id_idx on public.messages(match_id);
create index if not exists message_likes_message_id_idx on public.message_likes(message_id);
create index if not exists match_updates_match_id_idx on public.match_updates(match_id);
