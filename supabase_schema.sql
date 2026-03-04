-- ============================================================
-- SYNTHERA — Supabase Schema
-- Ejecuta esto en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- USERS
create table if not exists users (
  id text primary key,
  username text unique not null,
  display_name text,
  password text,
  email text,
  role text default 'USER',
  is_active boolean default true,
  ad_group text,
  sso_provider text
);

-- AD GROUPS
create table if not exists ad_groups (
  id text primary key,
  name text,
  description text,
  role text
);

-- ENVIRONMENTS
create table if not exists environments (
  id text primary key,
  name text,
  category text,
  is_archived boolean default false,
  is_locked boolean default false,
  max_reservation_duration integer,
  color text,
  url text
);

-- REPOSITORIES
create table if not exists repositories (
  id text primary key,
  name text,
  is_archived boolean default false
);

-- RESERVATIONS
create table if not exists reservations (
  id text primary key,
  environment_id text,
  reserved_by_user_id text,
  jira_issue_keys jsonb default '[]',
  description text,
  planned_start timestamptz,
  planned_end timestamptz,
  status text,
  selected_repository_ids jsonb default '[]',
  usage_session jsonb,
  policy_flags jsonb
);

-- POLICY (fila única, id siempre = 1)
create table if not exists policy (
  id integer primary key default 1,
  booking_window_days integer default 30,
  min_duration_hours numeric default 0.5,
  allow_past_start boolean default true,
  business_hours_only boolean default false,
  business_hours_start integer default 8,
  business_hours_end integer default 20
);

-- ============================================================
-- DESHABILITAR RLS (app interna, acceso con anon key)
-- ============================================================
alter table users               disable row level security;
alter table ad_groups           disable row level security;
alter table environments        disable row level security;
alter table repositories        disable row level security;
alter table reservations        disable row level security;
alter table policy              disable row level security;

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================

insert into ad_groups (id, name, description, role) values
  ('g1','admins','System administrators','ADMIN'),
  ('g2','devs','Development team','USER'),
  ('g3','ops','Operations team','USER')
on conflict (id) do nothing;

insert into users (id, username, display_name, password, email, role, is_active, ad_group, sso_provider) values
  ('u0','admin','Admin User','admin','admin@company.com','ADMIN',true,'admins',null),
  ('u1','user1','Alice García','user1','alice@company.com','USER',true,'devs',null),
  ('u2','user2','Bob Martín','user2','bob@company.com','USER',true,'devs',null),
  ('u3','user3','Carol López','user3','carol@company.com','USER',false,'devs',null),
  ('u4','sso1','SSO Demo User','sso1','sso@company.com','USER',true,'devs','google')
on conflict (id) do nothing;

insert into environments (id, name, category, is_archived, is_locked, max_reservation_duration, color, url) values
  ('e1','DEV-01','DEV',false,false,8,null,null),
  ('e2','DEV-02','DEV',false,false,4,null,null),
  ('e3','PRE-01','PRE',false,false,24,null,null),
  ('e4','STAGING-01','STAGING',false,false,48,null,null),
  ('e5','STAGING-02','STAGING',true,false,12,null,null)
on conflict (id) do nothing;

insert into repositories (id, name, is_archived) values
  ('r1','frontend-app',false),
  ('r2','backend-api',false),
  ('r3','infra-scripts',false),
  ('r4','legacy-monolith',true),
  ('r5','data-pipeline',false),
  ('r6','auth-service',false),
  ('r7','analytics-core',false)
on conflict (id) do nothing;

insert into policy (id, booking_window_days, min_duration_hours, allow_past_start, business_hours_only, business_hours_start, business_hours_end)
values (1, 30, 0.5, true, false, 8, 20)
on conflict (id) do nothing;

-- Reservations con fechas relativas (ajusta manualmente si las necesitas actuales)
insert into reservations (id, environment_id, reserved_by_user_id, jira_issue_keys, description, planned_start, planned_end, status, selected_repository_ids, usage_session, policy_flags) values
  ('r01','e1','u1','["PROJ-101","PROJ-102"]','Frontend deploy + integration test', now() + interval '2 hours', now() + interval '6 hours','Reserved','["r1","r2"]',null,'{"exceedsMaxDuration":false}'),
  ('r02','e3','u2','["PROJ-202"]','Auth rollout to PRE', now() - interval '2 hours', now() + interval '5 hours','InUse','["r2","r3"]','{"actualStart":"'||to_char(now() - interval '2 hours','YYYY-MM-DD"T"HH24:MI:SS"Z"')||'","actualEnd":null,"branches":["main","feature/login"]}','{"exceedsMaxDuration":false}'),
  ('r03','e4','u1','["PROJ-303","PROJ-304"]','Staging full deploy — policy violation', now() + interval '10 hours', now() + interval '62 hours','PolicyViolation','["r1"]',null,'{"exceedsMaxDuration":true}'),
  ('r04','e2','u2','["PROJ-404"]','Data pipeline validation', now() + interval '26 hours', now() + interval '30 hours','Reserved','["r5"]',null,'{"exceedsMaxDuration":false}'),
  ('r05','e1','u0','["PROJ-505"]','Admin hotfix', now() - interval '10 hours', now() - interval '6 hours','Completed','["r1","r2"]','{"actualStart":"'||to_char(now() - interval '10 hours','YYYY-MM-DD"T"HH24:MI:SS"Z"')||'","actualEnd":"'||to_char(now() - interval '7 hours','YYYY-MM-DD"T"HH24:MI:SS"Z"')||'","branches":["main"]}','{"exceedsMaxDuration":false}'),
  ('r06','e3','u1','["PROJ-606"]','PRE regression suite', now() + interval '2 days', now() + interval '2 days 8 hours','Reserved','["r3","r5"]',null,'{"exceedsMaxDuration":false}')
on conflict (id) do nothing;
