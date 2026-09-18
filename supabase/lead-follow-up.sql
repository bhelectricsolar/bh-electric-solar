-- Permite marcar un lead como "atendido" sin tener que convertirlo en
-- cliente todavía — antes quedaba marcado "sin atender" para siempre aunque
-- lo hubieran llamado. Idempotente.

alter table customers add column if not exists last_contacted_at timestamptz;
