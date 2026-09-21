-- Ocultar productos/categorías de la tienda y del stock. Idempotente.

alter table products add column if not exists hidden_stock boolean not null default false;
alter table categories add column if not exists hidden_store boolean not null default false;
alter table categories add column if not exists hidden_stock boolean not null default false;
