-- Run this in the Supabase SQL editor after creating/importing the starter tables.
-- These policies let travelers manage their own reviews/submissions/travel plans and let admins moderate all rows.

create extension if not exists pgcrypto;

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  municipality text not null,
  description text,
  latitude numeric,
  longitude numeric,
  best_time text,
  entrance_fee text,
  opening_hours text,
  address text,
  contact_info text,
  travel_tips text,
  image_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  accommodation_type text,
  municipality text not null,
  address text,
  price_range text,
  amenities text,
  contact_info text,
  image_url text,
  latitude numeric,
  longitude numeric,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  day text not null,
  destination_slug text not null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.accommodation_favorites (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  accommodation_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_email, accommodation_id)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  destination_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_email, destination_slug)
);

create table if not exists public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  origin text not null,
  destination text not null,
  transport_type text,
  estimated_duration text,
  estimated_cost text,
  route_notes text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.destinations
add column if not exists id uuid default gen_random_uuid(),
add column if not exists address text,
add column if not exists contact_info text,
add column if not exists travel_tips text,
add column if not exists is_featured boolean default false,
add column if not exists is_published boolean default true,
add column if not exists updated_at timestamptz default now();

alter table public.accommodations
add column if not exists id uuid default gen_random_uuid(),
add column if not exists slug text,
add column if not exists address text,
add column if not exists price_range text,
add column if not exists amenities text,
add column if not exists contact_info text,
add column if not exists image_url text,
add column if not exists latitude numeric,
add column if not exists longitude numeric,
add column if not exists is_published boolean default true,
add column if not exists created_at timestamptz default now();

alter table public.transport_routes
add column if not exists id uuid default gen_random_uuid();

alter table public.transport_routes
add column if not exists estimated_duration text,
add column if not exists estimated_cost text,
add column if not exists route_notes text,
add column if not exists is_published boolean default true,
add column if not exists created_at timestamptz default now();

alter table public.submissions enable row level security;
alter table public.reviews enable row level security;
alter table public.destinations enable row level security;
alter table public.accommodations enable row level security;
alter table public.favorites enable row level security;
alter table public.travel_plans enable row level security;
alter table public.accommodation_favorites enable row level security;
alter table public.transport_routes enable row level security;

drop policy if exists "Anyone can read published destinations" on public.destinations;
drop policy if exists "Admins can read destinations" on public.destinations;
drop policy if exists "Admins can create destinations" on public.destinations;
drop policy if exists "Admins can update destinations" on public.destinations;
drop policy if exists "Admins can delete destinations" on public.destinations;

create policy "Anyone can read published destinations"
on public.destinations
for select
to anon, authenticated
using (is_published = true);

create policy "Admins can read destinations"
on public.destinations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can create destinations"
on public.destinations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can update destinations"
on public.destinations
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

create policy "Admins can delete destinations"
on public.destinations
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

drop policy if exists "Anyone can read published accommodations" on public.accommodations;
drop policy if exists "Admins can read accommodations" on public.accommodations;
drop policy if exists "Admins can create accommodations" on public.accommodations;
drop policy if exists "Admins can update accommodations" on public.accommodations;
drop policy if exists "Admins can delete accommodations" on public.accommodations;

create policy "Anyone can read published accommodations"
on public.accommodations
for select
to anon, authenticated
using (is_published = true);

create policy "Admins can read accommodations"
on public.accommodations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can create accommodations"
on public.accommodations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodations"
on public.accommodations
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

create policy "Admins can delete accommodations"
on public.accommodations
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

drop policy if exists "Travelers can read their own favorites" on public.favorites;
drop policy if exists "Travelers can create their own favorites" on public.favorites;
drop policy if exists "Travelers can delete their own favorites" on public.favorites;

create policy "Travelers can read their own favorites"
on public.favorites
for select
to authenticated
using (user_email = (auth.jwt() ->> 'email'));

create policy "Travelers can create their own favorites"
on public.favorites
for insert
to authenticated
with check (user_email = (auth.jwt() ->> 'email'));

create policy "Travelers can delete their own favorites"
on public.favorites
for delete
to authenticated
using (user_email = (auth.jwt() ->> 'email'));

drop policy if exists "Travelers can read their own travel plans" on public.travel_plans;
drop policy if exists "Travelers can create their own travel plans" on public.travel_plans;
drop policy if exists "Travelers can update their own travel plans" on public.travel_plans;
drop policy if exists "Travelers can delete their own travel plans" on public.travel_plans;

create policy "Travelers can read their own travel plans"
on public.travel_plans
for select
to authenticated
using (user_email = (auth.jwt() ->> 'email'));

create policy "Travelers can create their own travel plans"
on public.travel_plans
for insert
to authenticated
with check (user_email = (auth.jwt() ->> 'email'));

create policy "Travelers can update their own travel plans"
on public.travel_plans
for update
to authenticated
using (user_email = (auth.jwt() ->> 'email'))
with check (user_email = (auth.jwt() ->> 'email'));

create policy "Travelers can delete their own travel plans"
on public.travel_plans
for delete
to authenticated
using (user_email = (auth.jwt() ->> 'email'));

drop policy if exists "Travelers can read their own accommodation favorites" on public.accommodation_favorites;
drop policy if exists "Travelers can create their own accommodation favorites" on public.accommodation_favorites;
drop policy if exists "Travelers can delete their own accommodation favorites" on public.accommodation_favorites;

create policy "Travelers can read their own accommodation favorites"
on public.accommodation_favorites
for select
to authenticated
using (user_email = (auth.jwt() ->> 'email'));

create policy "Travelers can create their own accommodation favorites"
on public.accommodation_favorites
for insert
to authenticated
with check (user_email = (auth.jwt() ->> 'email'));

create policy "Travelers can delete their own accommodation favorites"
on public.accommodation_favorites
for delete
to authenticated
using (user_email = (auth.jwt() ->> 'email'));

drop policy if exists "Anyone can read published transport routes" on public.transport_routes;
drop policy if exists "Admins can read transport routes" on public.transport_routes;
drop policy if exists "Admins can create transport routes" on public.transport_routes;
drop policy if exists "Admins can update transport routes" on public.transport_routes;
drop policy if exists "Admins can delete transport routes" on public.transport_routes;

create policy "Anyone can read published transport routes"
on public.transport_routes
for select
to anon, authenticated
using (is_published = true);

create policy "Admins can read transport routes"
on public.transport_routes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can create transport routes"
on public.transport_routes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can update transport routes"
on public.transport_routes
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

create policy "Admins can delete transport routes"
on public.transport_routes
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
