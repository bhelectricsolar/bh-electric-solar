-- Cotizador solar: guarda cada cotización (asociada a un cliente/lead y/o
-- proyecto) y deja configurable la tabla de HSP por provincia y el costo
-- instalado por Wp. Idempotente.

create table if not exists solar_quotes (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz not null default now(),
  created_by text references team_members(id) on delete set null,
  customer_id text references customers(id) on delete set null,
  project_id text references projects(id) on delete set null,
  client_name text,
  address text,
  province text,
  system_kwp numeric,
  panels int,
  monthly_production numeric,
  coverage_pct numeric,
  monthly_savings numeric,
  cost_usd numeric,
  payback_years numeric,
  inputs jsonb not null,
  results jsonb not null,
  summary text,
  from_invoice_photo boolean not null default false
);

create index if not exists solar_quotes_customer_idx on solar_quotes (customer_id);
create index if not exists solar_quotes_created_idx on solar_quotes (created_at desc);

alter table solar_quotes enable row level security;
drop policy if exists "authenticated read/write solar_quotes" on solar_quotes;
create policy "authenticated read/write solar_quotes" on solar_quotes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

alter table store_settings add column if not exists hsp_table jsonb not null default '{}'::jsonb;
alter table store_settings add column if not exists install_cost_per_wp numeric not null default 1.2;
