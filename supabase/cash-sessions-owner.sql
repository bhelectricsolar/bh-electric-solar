-- Para saber de quién es cada caja, y quién hizo cada venta (idempotente)
alter table cash_sessions add column if not exists opened_by text references team_members(id);
alter table orders add column if not exists sold_by text references team_members(id);
