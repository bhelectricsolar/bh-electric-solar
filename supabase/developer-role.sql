-- Cuenta de desarrollador — por encima del dueño y su equipo (idempotente).
-- No es parte de team_members: el dueño de BH nunca la ve ni la administra.
create table if not exists developers (
  id text primary key default gen_random_uuid()::text,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  username text unique
);

alter table developers enable row level security;
drop policy if exists "developers read themselves" on developers;
create policy "developers read themselves" on developers for select using (auth.uid() = auth_user_id);
