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
  on conflict on constraint meal_plans_user_id_day_date_key do update
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

grant execute on function upsert_my_meal_plan(text, date, text, boolean, integer, text) to anon, authenticated;
