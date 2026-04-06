create extension if not exists pgcrypto;

create table houses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  name text not null,
  code text not null unique
);

create table users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  house_id uuid not null references houses(id) on delete cascade,
  name text not null
);

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  user_id uuid not null references users(id) on delete cascade,
  house_id uuid not null references houses(id) on delete cascade,
  day_date date not null,
  status text not null default 'none',
  is_cooking boolean not null default false,
  guest_count integer not null default 0,
  note text,
  constraint meal_plans_user_id_day_date_key unique (user_id, day_date),
  constraint meal_plans_status_check check (status in ('none', 'available', 'unavailable')),
  constraint meal_plans_guest_count_check check (guest_count >= 0)
);

create table house_task_rotation_configs (
  house_id uuid primary key references houses(id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  anchor_week_start date not null default date_trunc('week', timezone('utc', now()))::date
);

create table house_task_chores (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  house_id uuid not null references houses(id) on delete cascade,
  name text not null,
  sort_order integer not null,
  constraint house_task_chores_name_check check (char_length(trim(name)) > 0),
  constraint house_task_chores_house_sort_order_key unique (house_id, sort_order)
);

create table house_task_member_order (
  house_id uuid not null references houses(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  sort_order integer not null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  primary key (house_id, user_id),
  constraint house_task_member_order_house_sort_order_key unique (house_id, sort_order)
);

create table house_sessions (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  session_token text not null unique,
  created_at timestamp with time zone not null default timezone('utc', now()),
  last_used_at timestamp with time zone not null default timezone('utc', now())
);

create table user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  house_id uuid not null references houses(id) on delete cascade,
  session_token text not null unique,
  created_at timestamp with time zone not null default timezone('utc', now()),
  last_used_at timestamp with time zone not null default timezone('utc', now())
);

create index house_sessions_house_id_idx on house_sessions(house_id);
create index user_sessions_house_id_idx on user_sessions(house_id);
create index user_sessions_user_id_idx on user_sessions(user_id);
create index house_task_chores_house_id_idx on house_task_chores(house_id);
create index house_task_member_order_user_id_idx on house_task_member_order(user_id);

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger update_meal_plans_updated_at
before update on meal_plans
for each row
execute procedure update_updated_at_column();

create trigger update_house_task_rotation_configs_updated_at
before update on house_task_rotation_configs
for each row
execute procedure update_updated_at_column();

create trigger update_house_task_chores_updated_at
before update on house_task_chores
for each row
execute procedure update_updated_at_column();

alter table houses enable row level security;
alter table users enable row level security;
alter table meal_plans enable row level security;
alter table house_task_rotation_configs enable row level security;
alter table house_task_chores enable row level security;
alter table house_task_member_order enable row level security;
alter table house_sessions enable row level security;
alter table user_sessions enable row level security;

revoke all on table houses from anon, authenticated;
revoke all on table users from anon, authenticated;
revoke all on table meal_plans from anon, authenticated;
revoke all on table house_task_rotation_configs from anon, authenticated;
revoke all on table house_task_chores from anon, authenticated;
revoke all on table house_task_member_order from anon, authenticated;
revoke all on table house_sessions from anon, authenticated;
revoke all on table user_sessions from anon, authenticated;

create or replace function generate_house_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  idx integer;
begin
  loop
    candidate := '';
    for idx in 1..8 loop
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::integer, 1);
    end loop;

    exit when not exists (
      select 1
      from houses
      where code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function generate_session_token()
returns text
language sql
as $$
  select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

create or replace function issue_house_session(p_house_id uuid)
returns text
language plpgsql
as $$
declare
  v_token text;
begin
  v_token := generate_session_token();

  insert into house_sessions (house_id, session_token)
  values (p_house_id, v_token);

  return v_token;
end;
$$;

create or replace function issue_user_session(p_user_id uuid, p_house_id uuid)
returns text
language plpgsql
as $$
declare
  v_token text;
begin
  v_token := generate_session_token();

  insert into user_sessions (user_id, house_id, session_token)
  values (p_user_id, p_house_id, v_token);

  return v_token;
end;
$$;

create or replace function get_house_id_from_token(p_house_token text)
returns uuid
language plpgsql
as $$
declare
  v_house_id uuid;
begin
  select house_id
  into v_house_id
  from house_sessions
  where session_token = p_house_token;

  if v_house_id is null then
    raise exception 'Invalid house session'
      using errcode = 'P0001';
  end if;

  update house_sessions
  set last_used_at = timezone('utc', now())
  where session_token = p_house_token;

  return v_house_id;
end;
$$;

create or replace function get_user_session_from_token(p_user_token text)
returns user_sessions
language plpgsql
as $$
declare
  v_session user_sessions;
begin
  select *
  into v_session
  from user_sessions
  where session_token = p_user_token;

  if v_session.id is null then
    raise exception 'Invalid user session'
      using errcode = 'P0001';
  end if;

  update user_sessions
  set last_used_at = timezone('utc', now())
  where id = v_session.id
  returning *
  into v_session;

  return v_session;
end;
$$;

create or replace function ensure_house_task_rotation_config(p_house_id uuid)
returns house_task_rotation_configs
language plpgsql
set search_path = public
as $$
declare
  v_config house_task_rotation_configs;
begin
  insert into house_task_rotation_configs (house_id)
  values (p_house_id)
  on conflict (house_id) do nothing;

  select *
  into v_config
  from house_task_rotation_configs
  where house_task_rotation_configs.house_id = p_house_id;

  return v_config;
end;
$$;

create or replace function sync_house_task_member_order(p_house_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  -- 1. Remove entries for users no longer in the house
  delete from house_task_member_order
  where house_id = p_house_id
    and user_id not in (
      select id from users where house_id = p_house_id
    );

  -- 2. Upsert existing and new users with updated sort_order
  with updated_order as (
    select
      u.id as user_id,
      row_number() over (
        order by
          coalesce(mo.sort_order, 2147483647), -- Keep existing order, newcomers at the end
          lower(u.name),
          u.created_at,
          u.id
      ) - 1 as next_sort_order
    from users u
    left join house_task_member_order mo
      on mo.house_id = u.house_id
     and mo.user_id = u.id
    where u.house_id = p_house_id
  )
  insert into house_task_member_order (house_id, user_id, sort_order)
  select p_house_id, user_id, next_sort_order
  from updated_order
  on conflict (house_id, user_id) do update
  set sort_order = excluded.sort_order;
end;
$$;

create or replace function create_house(p_name text)
returns table (
  house_id uuid,
  house_name text,
  code text,
  house_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_house houses;
  v_token text;
begin
  v_name := trim(p_name);

  if v_name is null or char_length(v_name) = 0 then
    raise exception 'House name is required'
      using errcode = 'P0001';
  end if;

  insert into houses (name, code)
  values (v_name, generate_house_code())
  returning *
  into v_house;

  perform ensure_house_task_rotation_config(v_house.id);

  v_token := issue_house_session(v_house.id);

  return query
  select v_house.id, v_house.name, v_house.code, v_token;
end;
$$;

create or replace function join_house(p_code text)
returns table (
  house_id uuid,
  house_name text,
  house_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_house houses;
  v_token text;
begin
  v_code := upper(trim(p_code));

  select *
  into v_house
  from houses
  where code = v_code;

  if v_house.id is null then
    raise exception 'Invalid house code'
      using errcode = 'P0001';
  end if;

  v_token := issue_house_session(v_house.id);

  return query
  select v_house.id, v_house.name, v_token;
end;
$$;

create or replace function get_current_house(p_house_token text)
returns table (
  id uuid,
  name text,
  code text,
  created_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house_id uuid;
begin
  v_house_id := get_house_id_from_token(p_house_token);

  return query
  select houses.id, houses.name, houses.code, houses.created_at
  from houses
  where houses.id = v_house_id;
end;
$$;

create or replace function list_house_users(p_house_token text)
returns table (
  id uuid,
  name text,
  house_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house_id uuid;
begin
  v_house_id := get_house_id_from_token(p_house_token);

  return query
  select users.id, users.name, users.house_id
  from users
  where users.house_id = v_house_id
  order by lower(users.name), users.created_at, users.id;
end;
$$;

create or replace function create_house_user(p_house_token text, p_name text)
returns table (
  id uuid,
  name text,
  house_id uuid,
  user_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house_id uuid;
  v_name text;
  v_user users;
  v_token text;
begin
  v_house_id := get_house_id_from_token(p_house_token);
  v_name := trim(p_name);

  if v_name is null or char_length(v_name) = 0 then
    raise exception 'User name is required'
      using errcode = 'P0001';
  end if;

  insert into users (house_id, name)
  values (v_house_id, v_name)
  returning *
  into v_user;

  perform sync_house_task_member_order(v_house_id);

  v_token := issue_user_session(v_user.id, v_house_id);

  return query
  select v_user.id, v_user.name, v_user.house_id, v_token;
end;
$$;

create or replace function select_house_user(p_house_token text, p_user_id uuid)
returns table (
  id uuid,
  name text,
  house_id uuid,
  user_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house_id uuid;
  v_user users;
  v_token text;
begin
  v_house_id := get_house_id_from_token(p_house_token);

  select *
  into v_user
  from users
  where users.id = p_user_id
    and users.house_id = v_house_id;

  if v_user.id is null then
    raise exception 'User not found in this house'
      using errcode = 'P0001';
  end if;

  v_token := issue_user_session(v_user.id, v_house_id);

  return query
  select v_user.id, v_user.name, v_user.house_id, v_token;
end;
$$;

create or replace function get_current_user(p_user_token text)
returns table (
  id uuid,
  name text,
  house_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
begin
  v_session := get_user_session_from_token(p_user_token);
  perform sync_house_task_member_order(v_session.house_id);

  return query
  select users.id, users.name, users.house_id
  from users
  where users.id = v_session.user_id
    and users.house_id = v_session.house_id;
end;
$$;

create or replace function rename_current_house(p_user_token text, p_name text)
returns table (
  id uuid,
  name text,
  code text,
  created_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_name text;
begin
  v_session := get_user_session_from_token(p_user_token);
  v_name := trim(p_name);

  if v_name is null or char_length(v_name) = 0 then
    raise exception 'House name is required'
      using errcode = 'P0001';
  end if;

  return query
  update houses
  set name = v_name
  where houses.id = v_session.house_id
  returning houses.id, houses.name, houses.code, houses.created_at;
end;
$$;

create or replace function rename_current_user(p_user_token text, p_name text)
returns table (
  id uuid,
  name text,
  house_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_name text;
begin
  v_session := get_user_session_from_token(p_user_token);
  v_name := trim(p_name);

  if v_name is null or char_length(v_name) = 0 then
    raise exception 'User name is required'
      using errcode = 'P0001';
  end if;

  return query
  update users
  set name = v_name
  where users.id = v_session.user_id
    and users.house_id = v_session.house_id
  returning users.id, users.name, users.house_id;
end;
$$;

create or replace function delete_current_user(p_user_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
begin
  v_session := get_user_session_from_token(p_user_token);

  delete from users
  where users.id = v_session.user_id
    and users.house_id = v_session.house_id;

  perform sync_house_task_member_order(v_session.house_id);
end;
$$;

create or replace function get_house_task_rotation_config(p_user_token text)
returns table (
  house_id uuid,
  anchor_week_start date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_config house_task_rotation_configs;
begin
  v_session := get_user_session_from_token(p_user_token);
  v_config := ensure_house_task_rotation_config(v_session.house_id);

  return query
  select v_config.house_id, v_config.anchor_week_start, v_config.created_at, v_config.updated_at;
end;
$$;

create or replace function set_house_task_rotation_anchor_week(p_user_token text, p_anchor_week_start date)
returns table (
  house_id uuid,
  anchor_week_start date,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_anchor_week_start date;
begin
  v_session := get_user_session_from_token(p_user_token);
  perform ensure_house_task_rotation_config(v_session.house_id);

  v_anchor_week_start := date_trunc('week', coalesce(p_anchor_week_start, timezone('utc', now())::date)::timestamp)::date;

  return query
  update house_task_rotation_configs
  set anchor_week_start = v_anchor_week_start
  where house_task_rotation_configs.house_id = v_session.house_id
  returning
    house_task_rotation_configs.house_id,
    house_task_rotation_configs.anchor_week_start,
    house_task_rotation_configs.created_at,
    house_task_rotation_configs.updated_at;
end;
$$;

create or replace function list_house_task_chores(p_user_token text)
returns table (
  id uuid,
  house_id uuid,
  name text,
  sort_order integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
begin
  v_session := get_user_session_from_token(p_user_token);

  return query
  select
    house_task_chores.id,
    house_task_chores.house_id,
    house_task_chores.name,
    house_task_chores.sort_order,
    house_task_chores.created_at,
    house_task_chores.updated_at
  from house_task_chores
  where house_task_chores.house_id = v_session.house_id
  order by house_task_chores.sort_order, lower(house_task_chores.name), house_task_chores.id;
end;
$$;

create or replace function create_house_task_chore(p_user_token text, p_name text)
returns table (
  id uuid,
  house_id uuid,
  name text,
  sort_order integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_name text;
  v_sort_order integer;
begin
  v_session := get_user_session_from_token(p_user_token);
  v_name := trim(p_name);

  if v_name is null or char_length(v_name) = 0 then
    raise exception 'Task name is required'
      using errcode = 'P0001';
  end if;

  select coalesce(max(house_task_chores.sort_order), -1) + 1
  into v_sort_order
  from house_task_chores
  where house_task_chores.house_id = v_session.house_id;

  return query
  insert into house_task_chores (house_id, name, sort_order)
  values (v_session.house_id, v_name, v_sort_order)
  returning
    house_task_chores.id,
    house_task_chores.house_id,
    house_task_chores.name,
    house_task_chores.sort_order,
    house_task_chores.created_at,
    house_task_chores.updated_at;
end;
$$;

create or replace function rename_house_task_chore(p_user_token text, p_chore_id uuid, p_name text)
returns table (
  id uuid,
  house_id uuid,
  name text,
  sort_order integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_name text;
begin
  v_session := get_user_session_from_token(p_user_token);
  v_name := trim(p_name);

  if v_name is null or char_length(v_name) = 0 then
    raise exception 'Task name is required'
      using errcode = 'P0001';
  end if;

  return query
  update house_task_chores
  set name = v_name
  where house_task_chores.id = p_chore_id
    and house_task_chores.house_id = v_session.house_id
  returning
    house_task_chores.id,
    house_task_chores.house_id,
    house_task_chores.name,
    house_task_chores.sort_order,
    house_task_chores.created_at,
    house_task_chores.updated_at;

  if not found then
    raise exception 'Task not found'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function delete_house_task_chore(p_user_token text, p_chore_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
begin
  v_session := get_user_session_from_token(p_user_token);

  delete from house_task_chores
  where house_task_chores.id = p_chore_id
    and house_task_chores.house_id = v_session.house_id;

  if not found then
    raise exception 'Task not found'
      using errcode = 'P0001';
  end if;

  with reordered as (
    select
      house_task_chores.id,
      row_number() over (order by house_task_chores.sort_order, lower(house_task_chores.name), house_task_chores.id) - 1 as next_sort_order
    from house_task_chores
    where house_task_chores.house_id = v_session.house_id
  )
  update house_task_chores
  set sort_order = reordered.next_sort_order
  from reordered
  where house_task_chores.id = reordered.id;
end;
$$;

create or replace function reorder_house_task_chores(p_user_token text, p_chore_ids uuid[])
returns table (
  id uuid,
  house_id uuid,
  name text,
  sort_order integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_expected_count integer;
begin
  v_session := get_user_session_from_token(p_user_token);

  if p_chore_ids is null or array_length(p_chore_ids, 1) is null then
    raise exception 'Task order is required'
      using errcode = 'P0001';
  end if;

  select count(*)
  into v_expected_count
  from house_task_chores
  where house_task_chores.house_id = v_session.house_id;

  if v_expected_count <> array_length(p_chore_ids, 1) then
    raise exception 'Task order is invalid'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from unnest(p_chore_ids) as chore_id
    left join house_task_chores
      on house_task_chores.id = chore_id
     and house_task_chores.house_id = v_session.house_id
    where house_task_chores.id is null
  ) then
    raise exception 'Task order is invalid'
      using errcode = 'P0001';
  end if;

  if (select count(distinct chore_id) from unnest(p_chore_ids) as chore_id) <> v_expected_count then
    raise exception 'Task order is invalid'
      using errcode = 'P0001';
  end if;

  with desired_order as (
    select chore_id, ordinality - 1 as next_sort_order
    from unnest(p_chore_ids) with ordinality as ordered(chore_id, ordinality)
  )
  update house_task_chores
  set sort_order = desired_order.next_sort_order + 1000
  from desired_order
  where house_task_chores.id = desired_order.chore_id
    and house_task_chores.house_id = v_session.house_id;

  with desired_order as (
    select chore_id, ordinality - 1 as next_sort_order
    from unnest(p_chore_ids) with ordinality as ordered(chore_id, ordinality)
  )
  update house_task_chores
  set sort_order = desired_order.next_sort_order
  from desired_order
  where house_task_chores.id = desired_order.chore_id
    and house_task_chores.house_id = v_session.house_id;

  return query
  select
    house_task_chores.id,
    house_task_chores.house_id,
    house_task_chores.name,
    house_task_chores.sort_order,
    house_task_chores.created_at,
    house_task_chores.updated_at
  from house_task_chores
  where house_task_chores.house_id = v_session.house_id
  order by house_task_chores.sort_order, lower(house_task_chores.name), house_task_chores.id;
end;
$$;

create or replace function list_house_task_member_order(p_user_token text)
returns table (
  user_id uuid,
  house_id uuid,
  name text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
begin
  v_session := get_user_session_from_token(p_user_token);
  perform sync_house_task_member_order(v_session.house_id);

  return query
  select
    house_task_member_order.user_id,
    house_task_member_order.house_id,
    users.name,
    house_task_member_order.sort_order
  from house_task_member_order
  join users
    on users.id = house_task_member_order.user_id
   and users.house_id = house_task_member_order.house_id
  where house_task_member_order.house_id = v_session.house_id
  order by house_task_member_order.sort_order, lower(users.name), users.id;
end;
$$;

create or replace function reorder_house_task_member_order(p_user_token text, p_user_ids uuid[])
returns table (
  user_id uuid,
  house_id uuid,
  name text,
  sort_order integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_expected_count integer;
begin
  v_session := get_user_session_from_token(p_user_token);

  if p_user_ids is null or array_length(p_user_ids, 1) is null then
    raise exception 'Member order is required'
      using errcode = 'P0001';
  end if;

  select count(*)
  into v_expected_count
  from house_task_member_order
  where house_task_member_order.house_id = v_session.house_id;

  if v_expected_count <> array_length(p_user_ids, 1) then
    raise exception 'Member order is invalid'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from unnest(p_user_ids) as requested_user_id
    left join house_task_member_order
      on house_task_member_order.user_id = requested_user_id
     and house_task_member_order.house_id = v_session.house_id
    where house_task_member_order.user_id is null
  ) then
    raise exception 'Member order is invalid'
      using errcode = 'P0001';
  end if;

  if (select count(distinct requested_user_id) from unnest(p_user_ids) as requested_user_id) <> v_expected_count then
    raise exception 'Member order is invalid'
      using errcode = 'P0001';
  end if;

  with desired_order as (
    select requested_user_id, ordinality - 1 as next_sort_order
    from unnest(p_user_ids) with ordinality as ordered(requested_user_id, ordinality)
  )
  update house_task_member_order
  set sort_order = desired_order.next_sort_order + 1000
  from desired_order
  where house_task_member_order.user_id = desired_order.requested_user_id
    and house_task_member_order.house_id = v_session.house_id;

  with desired_order as (
    select requested_user_id, ordinality - 1 as next_sort_order
    from unnest(p_user_ids) with ordinality as ordered(requested_user_id, ordinality)
  )
  update house_task_member_order
  set sort_order = desired_order.next_sort_order
  from desired_order
  where house_task_member_order.user_id = desired_order.requested_user_id
    and house_task_member_order.house_id = v_session.house_id;

  return query
  select
    house_task_member_order.user_id,
    house_task_member_order.house_id,
    users.name,
    house_task_member_order.sort_order
  from house_task_member_order
  join users
    on users.id = house_task_member_order.user_id
   and users.house_id = house_task_member_order.house_id
  where house_task_member_order.house_id = v_session.house_id
  order by house_task_member_order.sort_order, lower(users.name), users.id;
end;
$$;

create or replace function list_meal_plans(p_user_token text, p_start_date date, p_end_date date)
returns table (
  id uuid,
  user_id uuid,
  house_id uuid,
  day_date date,
  status text,
  is_cooking boolean,
  guest_count integer,
  note text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
begin
  v_session := get_user_session_from_token(p_user_token);

  return query
  select
    meal_plans.id,
    meal_plans.user_id,
    meal_plans.house_id,
    meal_plans.day_date,
    meal_plans.status,
    meal_plans.is_cooking,
    meal_plans.guest_count,
    meal_plans.note,
    meal_plans.created_at,
    meal_plans.updated_at
  from meal_plans
  where meal_plans.house_id = v_session.house_id
    and meal_plans.day_date >= p_start_date
    and meal_plans.day_date <= p_end_date
  order by meal_plans.day_date, meal_plans.user_id;
end;
$$;

create or replace function upsert_my_meal_plan(
  p_user_token text,
  p_day_date date,
  p_status text,
  p_is_cooking boolean,
  p_guest_count integer,
  p_note text
)
returns setof meal_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session user_sessions;
  v_status text;
  v_is_cooking boolean;
  v_guest_count integer;
  v_note text;
begin
  v_session := get_user_session_from_token(p_user_token);

  v_status := lower(trim(p_status));

  if v_status not in ('none', 'available', 'unavailable') then
    raise exception 'Invalid planner status'
      using errcode = 'P0001';
  end if;

  v_is_cooking := coalesce(p_is_cooking, false);
  if v_is_cooking then
    v_status := 'available';
  end if;

  v_guest_count := greatest(coalesce(p_guest_count, 0), 0);
  if v_status <> 'available' then
    v_guest_count := 0;
  end if;

  v_note := nullif(trim(coalesce(p_note, '')), '');

  return query
  insert into meal_plans (
    user_id,
    house_id,
    day_date,
    status,
    is_cooking,
    guest_count,
    note
  )
  values (
    v_session.user_id,
    v_session.house_id,
    p_day_date,
    v_status,
    v_is_cooking,
    v_guest_count,
    v_note
  )
  on conflict on constraint meal_plans_user_id_day_date_key do update
  set
    house_id = excluded.house_id,
    status = excluded.status,
    is_cooking = excluded.is_cooking,
    guest_count = excluded.guest_count,
    note = excluded.note
  returning meal_plans.*;
end;
$$;

grant execute on function create_house(text) to anon, authenticated;
grant execute on function join_house(text) to anon, authenticated;
grant execute on function get_current_house(text) to anon, authenticated;
grant execute on function list_house_users(text) to anon, authenticated;
grant execute on function create_house_user(text, text) to anon, authenticated;
grant execute on function select_house_user(text, uuid) to anon, authenticated;
grant execute on function get_current_user(text) to anon, authenticated;
grant execute on function rename_current_house(text, text) to anon, authenticated;
grant execute on function rename_current_user(text, text) to anon, authenticated;
grant execute on function delete_current_user(text) to anon, authenticated;
grant execute on function list_meal_plans(text, date, date) to anon, authenticated;
grant execute on function upsert_my_meal_plan(text, date, text, boolean, integer, text) to anon, authenticated;
grant execute on function get_house_task_rotation_config(text) to anon, authenticated;
grant execute on function set_house_task_rotation_anchor_week(text, date) to anon, authenticated;
grant execute on function list_house_task_chores(text) to anon, authenticated;
grant execute on function create_house_task_chore(text, text) to anon, authenticated;
grant execute on function rename_house_task_chore(text, uuid, text) to anon, authenticated;
grant execute on function delete_house_task_chore(text, uuid) to anon, authenticated;
grant execute on function reorder_house_task_chores(text, uuid[]) to anon, authenticated;
grant execute on function list_house_task_member_order(text) to anon, authenticated;
grant execute on function reorder_house_task_member_order(text, uuid[]) to anon, authenticated;

revoke execute on function generate_house_code() from public, anon, authenticated;
revoke execute on function generate_session_token() from public, anon, authenticated;
revoke execute on function issue_house_session(uuid) from public, anon, authenticated;
revoke execute on function issue_user_session(uuid, uuid) from public, anon, authenticated;
revoke execute on function get_house_id_from_token(text) from public, anon, authenticated;
revoke execute on function get_user_session_from_token(text) from public, anon, authenticated;
revoke execute on function ensure_house_task_rotation_config(uuid) from public, anon, authenticated;
revoke execute on function sync_house_task_member_order(uuid) from public, anon, authenticated;
