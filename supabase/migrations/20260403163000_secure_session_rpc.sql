create extension if not exists pgcrypto;

create table if not exists house_sessions (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  session_token text not null unique,
  created_at timestamp with time zone not null default timezone('utc', now()),
  last_used_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  house_id uuid not null references houses(id) on delete cascade,
  session_token text not null unique,
  created_at timestamp with time zone not null default timezone('utc', now()),
  last_used_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists house_sessions_house_id_idx on house_sessions(house_id);
create index if not exists user_sessions_house_id_idx on user_sessions(house_id);
create index if not exists user_sessions_user_id_idx on user_sessions(user_id);

alter table meal_plans drop constraint if exists meal_plans_status_check;
alter table meal_plans
  add constraint meal_plans_status_check
  check (status in ('none', 'available', 'unavailable'));

alter table meal_plans drop constraint if exists meal_plans_guest_count_check;
alter table meal_plans
  add constraint meal_plans_guest_count_check
  check (guest_count >= 0);

drop policy if exists "Allow house lookup by code" on houses;
drop policy if exists "Allow house creation" on houses;
drop policy if exists "Allow viewing housemates" on users;
drop policy if exists "Allow housemate creation" on users;
drop policy if exists "Secure viewing housemates" on users;
drop policy if exists "Secure housemate creation" on users;
drop policy if exists "Allow viewing meal plans" on meal_plans;
drop policy if exists "Allow inserting meal plans" on meal_plans;
drop policy if exists "Allow updating meal plans" on meal_plans;
drop policy if exists "Secure viewing meal plans" on meal_plans;
drop policy if exists "Secure inserting meal plans" on meal_plans;
drop policy if exists "Secure updating meal plans" on meal_plans;
drop policy if exists "Allow house updates" on houses;
drop policy if exists "Allow housemate updates" on users;
drop policy if exists "Allow housemate deletion" on users;

revoke all on table houses from anon, authenticated;
revoke all on table users from anon, authenticated;
revoke all on table meal_plans from anon, authenticated;
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
  on conflict (user_id, day_date) do update
  set
    house_id = excluded.house_id,
    status = excluded.status,
    is_cooking = excluded.is_cooking,
    guest_count = excluded.guest_count,
    note = excluded.note
  returning
    meal_plans.id,
    meal_plans.user_id,
    meal_plans.house_id,
    meal_plans.day_date,
    meal_plans.status,
    meal_plans.is_cooking,
    meal_plans.guest_count,
    meal_plans.note,
    meal_plans.created_at,
    meal_plans.updated_at;
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

revoke execute on function generate_house_code() from public, anon, authenticated;
revoke execute on function generate_session_token() from public, anon, authenticated;
revoke execute on function issue_house_session(uuid) from public, anon, authenticated;
revoke execute on function issue_user_session(uuid, uuid) from public, anon, authenticated;
revoke execute on function get_house_id_from_token(text) from public, anon, authenticated;
revoke execute on function get_user_session_from_token(text) from public, anon, authenticated;
