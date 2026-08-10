create or replace function rename_house_shopping_item(p_user_token text, p_item_id uuid, p_name text)
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
  update house_shopping_items
  set name = v_name
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

grant execute on function rename_house_shopping_item(text, uuid, text) to anon, authenticated;
