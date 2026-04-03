alter table house_sessions
  add column if not exists expires_at timestamp with time zone not null
  default timezone('utc', now()) + interval '30 days';

alter table user_sessions
  add column if not exists expires_at timestamp with time zone not null
  default timezone('utc', now()) + interval '30 days';

create index if not exists house_sessions_expires_at_idx on house_sessions(expires_at);
create index if not exists user_sessions_expires_at_idx on user_sessions(expires_at);

create or replace function session_ttl()
returns interval
language sql
as $$
  select interval '30 days';
$$;

create or replace function purge_expired_sessions()
returns void
language plpgsql
as $$
begin
  delete from user_sessions
  where expires_at <= timezone('utc', now());

  delete from house_sessions
  where expires_at <= timezone('utc', now());
end;
$$;

create or replace function issue_house_session(p_house_id uuid)
returns text
language plpgsql
as $$
declare
  v_token text;
begin
  perform purge_expired_sessions();

  v_token := generate_session_token();

  insert into house_sessions (house_id, session_token, expires_at)
  values (p_house_id, v_token, timezone('utc', now()) + session_ttl());

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
  perform purge_expired_sessions();

  v_token := generate_session_token();

  insert into user_sessions (user_id, house_id, session_token, expires_at)
  values (p_user_id, p_house_id, v_token, timezone('utc', now()) + session_ttl());

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
  perform purge_expired_sessions();

  select house_id
  into v_house_id
  from house_sessions
  where session_token = p_house_token
    and expires_at > timezone('utc', now());

  if v_house_id is null then
    raise exception 'Invalid house session'
      using errcode = 'P0001';
  end if;

  update house_sessions
  set
    last_used_at = timezone('utc', now()),
    expires_at = timezone('utc', now()) + session_ttl()
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
  perform purge_expired_sessions();

  select *
  into v_session
  from user_sessions
  where session_token = p_user_token
    and expires_at > timezone('utc', now());

  if v_session.id is null then
    raise exception 'Invalid user session'
      using errcode = 'P0001';
  end if;

  update user_sessions
  set
    last_used_at = timezone('utc', now()),
    expires_at = timezone('utc', now()) + session_ttl()
  where id = v_session.id
  returning *
  into v_session;

  return v_session;
end;
$$;

revoke execute on function session_ttl() from public, anon, authenticated;
revoke execute on function purge_expired_sessions() from public, anon, authenticated;
