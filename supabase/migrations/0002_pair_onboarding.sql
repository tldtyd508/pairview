drop policy if exists "users can read their profile" on public.users;

create or replace function public.shares_pair_with_user(target_auth_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pair_memberships me
    join public.pair_memberships other
      on other.pair_id = me.pair_id
    where me.user_id = auth.uid()
      and other.user_id = target_auth_user_id
  );
$$;

create policy "users can read pairmate profiles"
on public.users
for select
to authenticated
using (auth_user_id = auth.uid() or public.shares_pair_with_user(auth_user_id));

grant execute on function public.shares_pair_with_user(uuid) to authenticated;

create or replace function public.generate_invitation_code()
returns text
language sql
volatile
as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create or replace function public.create_pair_with_invitation(pair_label text default null)
returns table(pair_id uuid, invitation_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_pair_id uuid;
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if exists (
    select 1
    from public.pair_memberships
    where user_id = auth.uid()
  ) then
    raise exception 'user_already_in_pair';
  end if;

  insert into public.pairs (label, created_by_user_id)
  values (pair_label, auth.uid())
  returning id into new_pair_id;

  insert into public.pair_memberships (pair_id, user_id, role)
  values (new_pair_id, auth.uid(), 'owner');

  loop
    new_code := public.generate_invitation_code();

    begin
      insert into public.invitations (
        pair_id,
        code,
        created_by_user_id,
        uses_remaining
      )
      values (new_pair_id, new_code, auth.uid(), 1);
      exit;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  pair_id := new_pair_id;
  invitation_code := new_code;
  return next;
end;
$$;

create or replace function public.join_pair_via_invitation(invitation_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invitation public.invitations%rowtype;
  member_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if exists (
    select 1
    from public.pair_memberships
    where user_id = auth.uid()
  ) then
    raise exception 'user_already_in_pair';
  end if;

  select *
  into target_invitation
  from public.invitations
  where code = invitation_code
  for update;

  if not found then
    raise exception 'invalid_invitation';
  end if;

  if target_invitation.revoked_at is not null then
    raise exception 'invalid_invitation';
  end if;

  if target_invitation.accepted_at is not null or target_invitation.uses_remaining <= 0 then
    raise exception 'invitation_already_used';
  end if;

  if target_invitation.expires_at is not null and target_invitation.expires_at < now() then
    raise exception 'invitation_expired';
  end if;

  if target_invitation.created_by_user_id = auth.uid() then
    raise exception 'self_invitation_not_allowed';
  end if;

  select count(*)::integer
  into member_count
  from public.pair_memberships
  where pair_id = target_invitation.pair_id;

  if member_count >= 2 then
    raise exception 'pair_is_full';
  end if;

  insert into public.pair_memberships (pair_id, user_id, role)
  values (target_invitation.pair_id, auth.uid(), 'member');

  update public.invitations
  set accepted_at = now(),
      uses_remaining = 0
  where id = target_invitation.id;

  return target_invitation.pair_id;
end;
$$;

grant execute on function public.generate_invitation_code() to authenticated;
grant execute on function public.create_pair_with_invitation(text) to authenticated;
grant execute on function public.join_pair_via_invitation(text) to authenticated;
