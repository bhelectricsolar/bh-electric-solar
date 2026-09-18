-- Le da al desarrollador su propia "caja" de prueba para poder ver y probar
-- lo que va desarrollando, sin que se mezcle con el equipo ni las
-- estadísticas reales del dueño (idempotente).

alter table team_members add column if not exists is_dev_account boolean not null default false;

insert into team_members (id, name, email, phone, role, active, auth_user_id, is_dev_account)
select gen_random_uuid()::text, 'Zentrix (dev)', '', '', 'admin', true, d.auth_user_id, true
from developers d
where d.username = 'zentrixstudios'
  and d.auth_user_id is not null
  and not exists (
    select 1 from team_members tm where tm.auth_user_id = d.auth_user_id
  );
