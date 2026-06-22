create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  label text,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pair_memberships (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id),
  unique (pair_id, user_id)
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  code text not null unique,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  uses_remaining integer not null default 1 check (uses_remaining >= 0),
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  kind text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  happened_on date not null,
  notes text,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  experience_id uuid not null references public.experiences (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  score numeric(2,1) not null check (score >= 0 and score <= 5),
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (experience_id, user_id)
);

create table if not exists public.markers (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  name text not null,
  color text not null check (color ~ '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$'),
  icon text not null,
  description text,
  is_default boolean not null default false,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experience_markers (
  experience_id uuid not null references public.experiences (id) on delete cascade,
  marker_id uuid not null references public.markers (id) on delete cascade,
  pair_id uuid not null references public.pairs (id) on delete cascade,
  applied_by_user_id uuid not null references auth.users (id) on delete restrict,
  applied_at timestamptz not null default now(),
  primary key (experience_id, marker_id)
);

create table if not exists public.photo_attachments (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs (id) on delete cascade,
  experience_id uuid not null references public.experiences (id) on delete cascade,
  storage_bucket text not null default 'pairview',
  storage_path text not null,
  caption text,
  sort_order integer not null default 0,
  created_by_user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pair_memberships_pair_id_idx on public.pair_memberships (pair_id);
create index if not exists subjects_pair_id_kind_idx on public.subjects (pair_id, kind);
create index if not exists experiences_pair_id_happened_on_idx on public.experiences (pair_id, happened_on desc);
create index if not exists reviews_pair_id_experience_id_idx on public.reviews (pair_id, experience_id);
create index if not exists markers_pair_id_idx on public.markers (pair_id);
create index if not exists experience_markers_pair_id_idx on public.experience_markers (pair_id);
create index if not exists photo_attachments_pair_id_experience_id_idx on public.photo_attachments (pair_id, experience_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_users_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

create trigger touch_pairs_updated_at
before update on public.pairs
for each row execute function public.touch_updated_at();

create trigger touch_subjects_updated_at
before update on public.subjects
for each row execute function public.touch_updated_at();

create trigger touch_experiences_updated_at
before update on public.experiences
for each row execute function public.touch_updated_at();

create trigger touch_reviews_updated_at
before update on public.reviews
for each row execute function public.touch_updated_at();

create trigger touch_markers_updated_at
before update on public.markers
for each row execute function public.touch_updated_at();

create trigger touch_photo_attachments_updated_at
before update on public.photo_attachments
for each row execute function public.touch_updated_at();

create or replace function public.is_pair_member(target_pair_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pair_memberships membership
    where membership.pair_id = target_pair_id
      and membership.user_id = auth.uid()
  );
$$;

grant usage on schema public to authenticated;
grant execute on function public.is_pair_member(uuid) to authenticated;
grant select, insert, update on public.users to authenticated;
grant select, insert, update on public.pairs to authenticated;
grant select, insert, update, delete on public.pair_memberships to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.experiences to authenticated;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.markers to authenticated;
grant select, insert, update, delete on public.experience_markers to authenticated;
grant select, insert, update, delete on public.photo_attachments to authenticated;

alter table public.users enable row level security;
alter table public.pairs enable row level security;
alter table public.pair_memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.subjects enable row level security;
alter table public.experiences enable row level security;
alter table public.reviews enable row level security;
alter table public.markers enable row level security;
alter table public.experience_markers enable row level security;
alter table public.photo_attachments enable row level security;

create policy "users can read their profile"
on public.users
for select
to authenticated
using (auth_user_id = auth.uid());

create policy "users can create their profile"
on public.users
for insert
to authenticated
with check (auth_user_id = auth.uid());

create policy "users can update their profile"
on public.users
for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

create policy "pair members can read pair rows"
on public.pairs
for select
to authenticated
using (public.is_pair_member(id));

create policy "pair creators can create pair rows"
on public.pairs
for insert
to authenticated
with check (created_by_user_id = auth.uid());

create policy "pair members can update pair rows"
on public.pairs
for update
to authenticated
using (public.is_pair_member(id))
with check (public.is_pair_member(id));

create policy "pair members can manage memberships"
on public.pair_memberships
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "users can create their own membership rows"
on public.pair_memberships
for insert
to authenticated
with check (user_id = auth.uid());

create policy "pair members can update memberships"
on public.pair_memberships
for update
to authenticated
using (public.is_pair_member(pair_id))
with check (public.is_pair_member(pair_id));

create policy "pair members can delete memberships"
on public.pair_memberships
for delete
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can manage invitations"
on public.invitations
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can create invitations"
on public.invitations
for insert
to authenticated
with check (created_by_user_id = auth.uid() and public.is_pair_member(pair_id));

create policy "pair members can update invitations"
on public.invitations
for update
to authenticated
using (public.is_pair_member(pair_id))
with check (public.is_pair_member(pair_id));

create policy "pair members can delete invitations"
on public.invitations
for delete
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can manage subjects"
on public.subjects
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can create subjects"
on public.subjects
for insert
to authenticated
with check (created_by_user_id = auth.uid() and public.is_pair_member(pair_id));

create policy "pair members can update subjects"
on public.subjects
for update
to authenticated
using (public.is_pair_member(pair_id))
with check (public.is_pair_member(pair_id));

create policy "pair members can delete subjects"
on public.subjects
for delete
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can manage experiences"
on public.experiences
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can create experiences"
on public.experiences
for insert
to authenticated
with check (created_by_user_id = auth.uid() and public.is_pair_member(pair_id));

create policy "pair members can update experiences"
on public.experiences
for update
to authenticated
using (public.is_pair_member(pair_id))
with check (public.is_pair_member(pair_id));

create policy "pair members can delete experiences"
on public.experiences
for delete
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can manage reviews"
on public.reviews
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can create reviews"
on public.reviews
for insert
to authenticated
with check (user_id = auth.uid() and public.is_pair_member(pair_id));

create policy "pair members can update their own reviews"
on public.reviews
for update
to authenticated
using (public.is_pair_member(pair_id) and user_id = auth.uid())
with check (public.is_pair_member(pair_id) and user_id = auth.uid());

create policy "pair members can delete their own reviews"
on public.reviews
for delete
to authenticated
using (public.is_pair_member(pair_id) and user_id = auth.uid());

create policy "pair members can manage markers"
on public.markers
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can create markers"
on public.markers
for insert
to authenticated
with check (created_by_user_id = auth.uid() and public.is_pair_member(pair_id));

create policy "pair members can update markers"
on public.markers
for update
to authenticated
using (public.is_pair_member(pair_id))
with check (public.is_pair_member(pair_id));

create policy "pair members can delete markers"
on public.markers
for delete
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can manage experience markers"
on public.experience_markers
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can create experience markers"
on public.experience_markers
for insert
to authenticated
with check (applied_by_user_id = auth.uid() and public.is_pair_member(pair_id));

create policy "pair members can update experience markers"
on public.experience_markers
for update
to authenticated
using (public.is_pair_member(pair_id))
with check (public.is_pair_member(pair_id));

create policy "pair members can delete experience markers"
on public.experience_markers
for delete
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can manage photo attachments"
on public.photo_attachments
for select
to authenticated
using (public.is_pair_member(pair_id));

create policy "pair members can create photo attachments"
on public.photo_attachments
for insert
to authenticated
with check (created_by_user_id = auth.uid() and public.is_pair_member(pair_id));

create policy "pair members can update photo attachments"
on public.photo_attachments
for update
to authenticated
using (public.is_pair_member(pair_id))
with check (public.is_pair_member(pair_id));

create policy "pair members can delete photo attachments"
on public.photo_attachments
for delete
to authenticated
using (public.is_pair_member(pair_id));
