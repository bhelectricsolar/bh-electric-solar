-- Inicio en vivo: (1) activa Realtime en las tablas que muestra el panel, así
-- cualquier venta/cobro/cambio aparece al instante sin recargar, y (2) guarda
-- el detalle de las cuotas (tarjeta, modelo, cantidad y recargo) en cada pago.
-- Idempotente.

do $$
declare t text;
begin
  foreach t in array array[
    'orders', 'order_items', 'order_payments', 'products', 'customers',
    'cash_sessions', 'cash_movements', 'projects', 'team_members', 'shipping_zones'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

alter table order_payments add column if not exists card_type text;
alter table order_payments add column if not exists card_kind text;
alter table order_payments add column if not exists installments int;
alter table order_payments add column if not exists surcharge_pct numeric;
