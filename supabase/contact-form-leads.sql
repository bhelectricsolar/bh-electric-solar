-- Conectar el formulario de "Presupuesto Personalizado" a la tabla
-- customers que ya existía para leads (idempotente).

alter table customers add column if not exists property_type text;
alter table customers add column if not exists bill_amount numeric;
alter table customers add column if not exists kwh_monthly numeric;
alter table customers add column if not exists roof_type text;
alter table customers add column if not exists message text;
alter table customers add column if not exists invoice_path text;

-- El formulario público lo llena gente sin sesión — necesita poder
-- insertar (no leer ni editar, eso sigue siendo solo del admin logueado).
drop policy if exists "public insert customers" on customers;
create policy "public insert customers" on customers for insert with check (true);

-- Storage privado para las facturas adjuntas — cualquiera puede subir la
-- suya (es el formulario público), pero solo el admin logueado puede
-- verlas después.
insert into storage.buckets (id, name, public)
values ('customer-invoices', 'customer-invoices', false)
on conflict (id) do nothing;

drop policy if exists "public upload customer-invoices" on storage.objects;
drop policy if exists "authenticated read customer-invoices" on storage.objects;

create policy "public upload customer-invoices" on storage.objects
  for insert with check (bucket_id = 'customer-invoices');
create policy "authenticated read customer-invoices" on storage.objects
  for select using (bucket_id = 'customer-invoices' and auth.uid() is not null);
