-- 1. CREATE TABLES

-- Meal plans table (tracking user presence)
create table meal_plans (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  user_id uuid references users(id) on delete cascade not null,
  house_id uuid references houses(id) on delete cascade not null,
  
  day_date date not null,
  -- 'eating', 'not_eating', 'unknown'
  status text not null default 'unknown',
  
  -- Prevent duplicate entries for the same user/day
  unique(user_id, day_date)
);

-- 2. ENABLE RLS
alter table meal_plans enable row level security;

-- 3. POLICIES

-- Allow public access to meal plans (simplified for MVP, isolation at app level)
create policy "Allow viewing meal plans"
  on meal_plans for select
  to anon
  using (true);

-- Allow creating meal plans
create policy "Allow inserting meal plans"
  on meal_plans for insert
  to anon
  with check (true);

-- Allow updating meal plans
create policy "Allow updating meal plans"
  on meal_plans for update
  to anon
  using (true);

-- Trigger for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_meal_plans_updated_at
    before update on meal_plans
    for each row
    execute procedure update_updated_at_column();
