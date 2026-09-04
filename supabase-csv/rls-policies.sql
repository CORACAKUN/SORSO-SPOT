-- Run this in the Supabase SQL editor after creating/importing the starter tables.
-- These policies let travelers manage their own reviews/submissions and let admins moderate all rows.

alter table public.submissions enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Travelers and admins can read submissions" on public.submissions;
drop policy if exists "Travelers can create their own submissions" on public.submissions;
drop policy if exists "Admins can update submissions" on public.submissions;
drop policy if exists "Admins can delete submissions" on public.submissions;

create policy "Travelers and admins can read submissions"
on public.submissions
for select
to authenticated
using (
  submitter_email = (auth.jwt() ->> 'email')
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Travelers can create their own submissions"
on public.submissions
for insert
to authenticated
with check (
  submitter_email = (auth.jwt() ->> 'email')
  and coalesce(status, 'pending') = 'pending'
);

create policy "Admins can update submissions"
on public.submissions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete submissions"
on public.submissions
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Travelers and admins can read reviews" on public.reviews;
drop policy if exists "Travelers can create their own reviews" on public.reviews;
drop policy if exists "Admins can update reviews" on public.reviews;
drop policy if exists "Admins can delete reviews" on public.reviews;

create policy "Travelers and admins can read reviews"
on public.reviews
for select
to authenticated
using (
  status = 'approved'
  or user_email = (auth.jwt() ->> 'email')
  or exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Travelers can create their own reviews"
on public.reviews
for insert
to authenticated
with check (
  user_email = (auth.jwt() ->> 'email')
  and coalesce(status, 'pending') = 'pending'
);

create policy "Admins can update reviews"
on public.reviews
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete reviews"
on public.reviews
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
