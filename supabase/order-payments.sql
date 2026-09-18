-- Permite que una venta se cobre con más de una forma de pago (ej: dos
-- cheques, o mitad efectivo mitad transferencia) — idempotente.

create table if not exists order_payments (
  id bigint generated always as identity primary key,
  order_id text not null references orders(id) on delete cascade,
  method text not null,
  currency text not null default 'ARS',
  amount numeric not null default 0,
  notes text
);

alter table order_payments enable row level security;
drop policy if exists "authenticated read/write order_payments" on order_payments;
create policy "authenticated read/write order_payments" on order_payments for all using (auth.uid() is not null) with check (auth.uid() is not null);
