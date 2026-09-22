-- Los pedidos que llegan desde la tienda online (con pago a coordinar)
-- todavía no están pagados y no deben sumar en los resúmenes de ventas
-- hasta que alguien del equipo los marque como pagados. Las ventas
-- cargadas desde Caja o Pedidos ya tienen el pago cobrado en el momento,
-- así que arrancan pagadas. Idempotente.

alter table orders add column if not exists paid boolean not null default true;

-- Los pedidos de la tienda que ya existan (hechos antes de este cambio)
-- todavía no están confirmados como cobrados: se marcan pendientes para
-- que el equipo los revise.
update orders set paid = false where origin = 'tienda' and payment_notes like 'Pago a coordinar%';
