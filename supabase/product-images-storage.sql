-- Storage para las fotos de productos (idempotente).
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product-images" on storage.objects;
drop policy if exists "authenticated write product-images" on storage.objects;
drop policy if exists "authenticated update product-images" on storage.objects;
drop policy if exists "authenticated delete product-images" on storage.objects;

create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "authenticated write product-images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.uid() is not null);
create policy "authenticated update product-images" on storage.objects
  for update using (bucket_id = 'product-images' and auth.uid() is not null);
create policy "authenticated delete product-images" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.uid() is not null);

-- Fotos del producto: array de URLs públicas, la primera es la principal.
alter table products add column if not exists images text[] not null default '{}';

-- Precio de lista en pesos, opcional — si no se carga, se usa el
-- USD * cotización como hoy. Sirve para productos con precio fijo en ARS.
alter table products add column if not exists price_ars numeric;

-- Zonas de envío: ahora son provincias reales (elegibles de una lista),
-- no texto libre, y el dueño puede crear o borrar zonas él mismo.
alter table shipping_zones add column if not exists provinces_list text[] not null default '{}';
