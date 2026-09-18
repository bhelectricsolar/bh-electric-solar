-- Punto de venta: métodos de pago reales, vuelto, y descuento de stock
-- automático al registrar cualquier venta (idempotente).

alter table orders add column if not exists payment_currency text default 'ARS';
alter table orders add column if not exists amount_received numeric;
alter table orders add column if not exists change_given numeric;
alter table orders add column if not exists payment_notes text;

-- Resta stock de forma atómica (evita que dos ventas al mismo tiempo
-- descuenten mal si venden lo último que queda).
create or replace function decrement_product_stock(p_id text, p_qty int)
returns void as $$
  update products set stock = greatest(0, stock - p_qty) where id = p_id;
$$ language sql;
