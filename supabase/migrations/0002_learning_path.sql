-- Ruta de aprendizaje por niveles (estilo Busuu): cada nivel (A1, A2...) tiene
-- una secuencia de pasos con explicacion, vocabulario asociado y ejercicios.
-- El progreso por paso se guarda por usuario y determina el % del nivel y
-- que paso esta desbloqueado.

create table if not exists path_steps (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  level text not null,
  sort_order int not null default 0,
  title text not null,
  topic text not null,
  deck_id uuid references decks (id) on delete set null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists path_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  step_id uuid not null references path_steps (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, step_id)
);

alter table path_steps enable row level security;
alter table path_progress enable row level security;

create policy "path_steps: read auth" on path_steps
  for select using (auth.role() = 'authenticated');
create policy "path_progress: owner all" on path_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_path_steps_level on path_steps (level, sort_order);
create index if not exists idx_path_progress_user on path_progress (user_id);
