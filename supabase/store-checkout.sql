-- Pedido directo desde la tienda online (sin pago todavía). Idempotente.
--
-- El visitante NO tiene sesión, así que no puede escribir en orders. En vez
-- de abrir la tabla, se crea una función que valida todo del lado del
-- servidor (precios reales, productos publicados, envío) y guarda el pedido.

alter table orders add column if not exists customer_email text;
alter table orders add column if not exists customer_doc text;
alter table orders add column if not exists customer_province text;
alter table orders add column if not exists customer_address text;
alter table orders add column if not exists customer_postal text;
alter table orders add column if not exists shipping_method text;
alter table orders add column if not exists shipping_cost_usd numeric;
alter table orders add column if not exists subtotal_usd numeric;
alter table orders add column if not exists total_usd numeric;
alter table orders add column if not exists notes text;

-- Las zonas de envío y sus precios son públicos (el checkout los muestra).
drop policy if exists "public read shipping_zones" on shipping_zones;
create policy "public read shipping_zones" on shipping_zones for select using (true);

create or replace function submit_store_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_name text := btrim(coalesce(p->>'name', ''));
  v_phone text := btrim(coalesce(p->>'phone', ''));
  v_email text := btrim(coalesce(p->>'email', ''));
  v_method text := coalesce(nullif(p->>'shipping_method', ''), 'retiro');
  v_zone_id text := nullif(p->>'shipping_zone_id', '');
  v_zone shipping_zones%rowtype;
  v_item jsonb;
  v_prod products%rowtype;
  v_qty int;
  v_sub numeric := 0;
  v_ship numeric := 0;
  v_lines jsonb := '[]'::jsonb;
  v_city text := btrim(coalesce(p->>'city', ''));
  v_addr text := btrim(coalesce(p->>'address', ''));
begin
  if length(v_name) < 2 then raise exception 'Falta el nombre'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 8 then raise exception 'Falta un teléfono válido'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    raise exception 'El pedido no tiene productos';
  end if;
  if jsonb_array_length(p->'items') > 60 then raise exception 'Demasiados productos'; end if;
  if v_method not in ('retiro', 'envio') then raise exception 'Método de entrega inválido'; end if;

  for v_item in select * from jsonb_array_elements(p->'items') loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 or v_qty > 999 then raise exception 'Cantidad inválida'; end if;
    select * into v_prod from products
      where id = v_item->>'id'
        and published_online = true
        and coalesce(hidden_store, false) = false
        and not exists (
          select 1 from categories c where c.value = products.category and coalesce(c.hidden_store, false) = true
        );
    if not found then raise exception 'Un producto ya no está disponible'; end if;
    v_sub := v_sub + v_prod.price_usd * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('id', v_prod.id, 'qty', v_qty));
  end loop;

  if v_method = 'envio' then
    select * into v_zone from shipping_zones where id = v_zone_id;
    if not found then raise exception 'Elegí una zona de envío'; end if;
    if length(v_addr) < 4 or length(v_city) < 2 then raise exception 'Falta la dirección de entrega'; end if;
    v_ship := v_zone.price_usd;
  else
    select * into v_zone from shipping_zones where id = 'retiro-local';
    if found then v_zone_id := v_zone.id; else v_zone_id := null; end if;
  end if;

  v_id := 'WEB-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  insert into orders (
    id, customer_name, customer_phone, customer_city, shipping_zone_id, status,
    payment_method, origin, customer_email, customer_doc, customer_province,
    customer_address, customer_postal, shipping_method, shipping_cost_usd,
    subtotal_usd, total_usd, notes, payment_notes
  ) values (
    v_id, v_name, v_phone, v_city, v_zone_id, 'nuevo',
    'transferencia', 'tienda', nullif(v_email, ''), nullif(btrim(coalesce(p->>'doc', '')), ''),
    nullif(btrim(coalesce(p->>'province', '')), ''), nullif(v_addr, ''),
    nullif(btrim(coalesce(p->>'postal', '')), ''), v_method, v_ship,
    v_sub, v_sub + v_ship, nullif(left(btrim(coalesce(p->>'notes', '')), 800), ''),
    'Pago a coordinar con el cliente (pedido hecho desde la tienda online)'
  );

  insert into order_items (order_id, product_id, qty)
    select v_id, l->>'id', (l->>'qty')::int from jsonb_array_elements(v_lines) l;

  -- Deja al cliente como lead para el seguimiento (sin duplicar si ya existe).
  if not exists (
    select 1 from customers
    where (v_email <> '' and lower(email) = lower(v_email))
       or regexp_replace(phone, '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g')
  ) then
    insert into customers (name, email, phone, city, status, source)
    values (v_name, v_email, v_phone, v_city, 'lead', 'Tienda');
  end if;

  return jsonb_build_object('id', v_id, 'subtotal_usd', v_sub, 'shipping_usd', v_ship, 'total_usd', v_sub + v_ship);
end;
$$;

revoke all on function submit_store_order(jsonb) from public;
grant execute on function submit_store_order(jsonb) to anon, authenticated;
