-- Esquema inicial para la app de aleman.
-- Ejecutar en el SQL editor de Supabase (o via `supabase db push`).

create extension if not exists "pgcrypto";

-- === Perfiles (uno por usuario, racha diaria) ===
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  streak_count int not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: select own" on profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

-- Crear perfil automaticamente al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- === Contenido curricular (compartido, solo lectura desde el cliente) ===
create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  level text not null,
  category text not null check (category in ('grammar', 'vocab', 'colloquial', 'situation')),
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks (id) on delete cascade,
  word text not null,
  article text check (article in ('der', 'die', 'das')),
  gender text,
  translation text not null,
  example_sentence text,
  example_translation text,
  tags text[] default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists grammar_lessons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  level text not null,
  title text not null,
  topic text not null,
  content jsonb not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists colloquial_phrases (
  id uuid primary key default gen_random_uuid(),
  phrase text not null,
  meaning text not null,
  register text not null check (register in ('du', 'sie', 'slang')),
  context text not null,
  level text not null default 'A1',
  source text not null default 'seed' check (source in ('seed', 'ai')),
  created_at timestamptz not null default now()
);

create table if not exists situations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  level text not null,
  description text,
  dialogue jsonb not null,
  source text not null default 'seed' check (source in ('seed', 'ai')),
  created_at timestamptz not null default now()
);

alter table decks enable row level security;
alter table cards enable row level security;
alter table grammar_lessons enable row level security;
alter table colloquial_phrases enable row level security;
alter table situations enable row level security;

create policy "decks: read auth" on decks for select using (auth.role() = 'authenticated');
create policy "cards: read auth" on cards for select using (auth.role() = 'authenticated');
create policy "grammar_lessons: read auth" on grammar_lessons for select using (auth.role() = 'authenticated');
create policy "colloquial_phrases: read auth" on colloquial_phrases for select using (auth.role() = 'authenticated');
create policy "situations: read auth" on situations for select using (auth.role() = 'authenticated');
-- No hay policies de insert/update/delete: el contenido semilla se carga con
-- la service role key (scripts/seed) y el contenido de IA se inserta desde
-- /api/generate usando tambien la service role key, que ignora RLS.

-- === Progreso del usuario ===
create table if not exists srs_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references cards (id) on delete cascade,
  ease_factor numeric not null default 2.5,
  interval_days numeric not null default 0,
  repetitions int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  unique (user_id, card_id)
);

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references grammar_lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists pronunciation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phrase text not null,
  transcript text,
  is_match boolean,
  created_at timestamptz not null default now()
);

alter table srs_state enable row level security;
alter table lesson_progress enable row level security;
alter table pronunciation_attempts enable row level security;

create policy "srs_state: owner all" on srs_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "lesson_progress: owner all" on lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pronunciation_attempts: owner all" on pronunciation_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_cards_deck on cards (deck_id);
create index if not exists idx_srs_state_user_due on srs_state (user_id, due_at);
create index if not exists idx_pronunciation_user on pronunciation_attempts (user_id, created_at desc);
