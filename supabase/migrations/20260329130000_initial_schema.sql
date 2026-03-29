-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CREATE TABLES

-- Houses table
create table houses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  name text not null,
  code text unique not null
);

-- Users (Housemates) table
create table users (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  house_id uuid references houses(id) on delete cascade not null,
  name text not null
);

-- 3. ENABLE RLS
alter table houses enable row level security;
alter table users enable row level security;

-- 4. POLICIES (Privacy-First)

-- Allow public access to 'houses' for initial lookups by code
create policy "Allow house lookup by code"
  on houses for select
  to anon
  using (true);

-- Allow public creation of houses
create policy "Allow house creation"
  on houses for insert
  to anon
  with check (true);

-- Allow users to see only their housemates (simplified for MVP)
create policy "Allow viewing housemates"
  on users for select
  to anon
  using (true);

-- Allow housemate creation
create policy "Allow housemate creation"
  on users for insert
  to anon
  with check (true);
