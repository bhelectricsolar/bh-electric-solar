-- BH Electric Solar — esquema inicial de la base de datos
-- Ejecutar una sola vez en el SQL Editor de Supabase.

create table categories (
  value text primary key,
  label text not null
);

create table products (
  id text primary key,
  slug text unique not null,
  name text not null,
  category text not null references categories(value),
  price_usd numeric not null default 0,
  cost_usd numeric,
  stock integer not null default 0,
  short_description text default '',
  description text default '',
  specs jsonb not null default '[]',
  gradient text default '',
  published_online boolean not null default true,
  created_at timestamptz not null default now()
);

create table shipping_zones (
  id text primary key,
  region text not null,
  provinces text not null,
  price_usd numeric not null default 0,
  eta_days text default ''
);

create table customers (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text default '',
  phone text default '',
  city text default '',
  status text not null default 'lead',
  source text default 'Formulario',
  created_at timestamptz not null default now()
);

create table team_members (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text default '',
  phone text default '',
  role text not null default 'vendedor',
  active boolean not null default true,
  commission_pct numeric,
  zone text
);

create table orders (
  id text primary key,
  customer_name text not null,
  customer_phone text default '',
  customer_city text default '',
  shipping_zone_id text references shipping_zones(id),
  status text not null default 'nuevo',
  payment_method text not null default 'efectivo',
  origin text not null default 'tienda',
  created_at timestamptz not null default now()
);

create table order_items (
  id bigint generated always as identity primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  qty integer not null default 1
);

create table projects (
  id text primary key default gen_random_uuid()::text,
  customer_name text not null,
  customer_phone text default '',
  city text default '',
  zone text default '',
  type text not null default 'residencial',
  system_kwp numeric not null default 0,
  panels_count integer not null default 0,
  status text not null default 'cotizacion',
  salesperson_id text references team_members(id),
  technician_id text references team_members(id),
  scheduled_date date,
  created_at timestamptz not null default now()
);

create table store_settings (
  id integer primary key default 1,
  store_name text not null default 'BH Electric Solar',
  whatsapp text default '',
  email text default '',
  instagram text default '',
  facebook text default '',
  linkedin text default '',
  currency text not null default 'USD',
  exchange_rate numeric not null default 1450,
  exchange_rate_mode text not null default 'auto',
  low_stock_threshold integer not null default 8,
  constraint single_row check (id = 1)
);

create table cash_sessions (
  id text primary key default gen_random_uuid()::text,
  opened_at timestamptz not null default now(),
  opening_amount numeric not null default 0,
  closed_at timestamptz,
  counted_amount numeric,
  expected_amount numeric
);

create table cash_movements (
  id bigint generated always as identity primary key,
  session_id text not null references cash_sessions(id) on delete cascade,
  type text not null,
  amount numeric not null,
  reason text default '',
  at timestamptz not null default now()
);

-- Habilita acceso de lectura/escritura por ahora (sin login todavía).
-- Cuando agreguemos autenticación para proteger /admin, esto se ajusta
-- para que solo usuarios logueados puedan escribir.
alter table categories enable row level security;
alter table products enable row level security;
alter table shipping_zones enable row level security;
alter table customers enable row level security;
alter table team_members enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table projects enable row level security;
alter table store_settings enable row level security;
alter table cash_sessions enable row level security;
alter table cash_movements enable row level security;

create policy "public read/write categories" on categories for all using (true) with check (true);
create policy "public read/write products" on products for all using (true) with check (true);
create policy "public read/write shipping_zones" on shipping_zones for all using (true) with check (true);
create policy "public read/write customers" on customers for all using (true) with check (true);
create policy "public read/write team_members" on team_members for all using (true) with check (true);
create policy "public read/write orders" on orders for all using (true) with check (true);
create policy "public read/write order_items" on order_items for all using (true) with check (true);
create policy "public read/write projects" on projects for all using (true) with check (true);
create policy "public read/write store_settings" on store_settings for all using (true) with check (true);
create policy "public read/write cash_sessions" on cash_sessions for all using (true) with check (true);
create policy "public read/write cash_movements" on cash_movements for all using (true) with check (true);

insert into store_settings (id) values (1);
