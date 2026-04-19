create table house_shopping_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  house_id uuid not null references houses(id) on delete cascade,
  name text not null,
  checked_at timestamp with time zone,
  constraint house_shopping_items_name_check check (char_length(trim(name)) > 0)
);

create index house_shopping_items_house_id_idx on house_shopping_items(house_id);
create index house_shopping_items_house_checked_at_idx on house_shopping_items(house_id, checked_at);

create trigger update_house_shopping_items_updated_at
before update on house_shopping_items
for each row
execute procedure update_updated_at_column();

alter table house_shopping_items enable row level security;

revoke all on table house_shopping_items from anon, authenticated;

create or replace function purge_expired_house_shopping_items(p_house_id uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from house_shopping_items
  where house_shopping_items.house_id = p_house_id
    and house_shopping_items.checked_at is not null
    and house_shopping_items.checked_at <= timezone('utc', now()) - interval '7 days';
end;
$$;

create or replace function list_house_shopping_items(p_user_token text)
returns table (
  id uuid,
  house_id uuid,
  name text,
  checked_at timestamp with time zone,
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
  perform purge_expired_house_shopping_items(v_session.house_id);

  return query
  select
    house_shopping_items.id,
    house_shopping_items.house_id,
    house_shopping_items.name,
    house_shopping_items.checked_at,
    house_shopping_items.created_at,
    house_shopping_items.updated_at
  from house_shopping_items
  where house_shopping_items.house_id = v_session.house_id
  order by
    case when house_shopping_items.checked_at is null then 0 else 1 end,
    case when house_shopping_items.checked_at is null then house_shopping_items.created_at end,
    case when house_shopping_items.checked_at is not null then house_shopping_items.checked_at end desc,
    lower(house_shopping_items.name),
    house_shopping_items.id;
end;
$$;

create or replace function create_house_shopping_item(p_user_token text, p_name text)
returns table (
  id uuid,
  house_id uuid,
  name text,
  checked_at timestamp with time zone,
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
  perform purge_expired_house_shopping_items(v_session.house_id);

  v_name := trim(p_name);

  if v_name is null or char_length(v_name) = 0 then
    raise exception 'Shopping item name is required'
      using errcode = 'P0001';
  end if;

  return query
  insert into house_shopping_items (house_id, name)
  values (v_session.house_id, v_name)
  returning
    house_shopping_items.id,
    house_shopping_items.house_id,
    house_shopping_items.name,
    house_shopping_items.checked_at,
    house_shopping_items.created_at,
    house_shopping_items.updated_at;
end;
$$;

create or replace function set_house_shopping_item_checked(p_user_token text, p_item_id uuid, p_checked boolean)
returns table (
  id uuid,
  house_id uuid,
  name text,
  checked_at timestamp with time zone,
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
  perform purge_expired_house_shopping_items(v_session.house_id);

  return query
  update house_shopping_items
  set checked_at = case when coalesce(p_checked, false) then timezone('utc', now()) else null end
  where house_shopping_items.id = p_item_id
    and house_shopping_items.house_id = v_session.house_id
  returning
    house_shopping_items.id,
    house_shopping_items.house_id,
    house_shopping_items.name,
    house_shopping_items.checked_at,
    house_shopping_items.created_at,
    house_shopping_items.updated_at;

  if not found then
    raise exception 'Shopping item not found'
      using errcode = 'P0001';
  end if;
end;
$$;

grant execute on function list_house_shopping_items(text) to anon, authenticated;
grant execute on function create_house_shopping_item(text, text) to anon, authenticated;
grant execute on function set_house_shopping_item_checked(text, uuid, boolean) to anon, authenticated;

revoke execute on function purge_expired_house_shopping_items(uuid) from public, anon, authenticated;
