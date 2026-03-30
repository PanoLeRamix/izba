-- Add rotation_order to users
alter table users add column rotation_order int default 0;

-- Create tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  house_id uuid references houses(id) on delete cascade not null,
  name text not null,
  "order" int default 0
);

-- Enable RLS
alter table tasks enable row level security;

-- Policies for tasks
create policy "Allow viewing house tasks"
  on tasks for select
  to anon
  using (true);

create policy "Allow house task creation"
  on tasks for insert
  to anon
  with check (true);

create policy "Allow house task update"
  on tasks for update
  to anon
  using (true);

create policy "Allow house task deletion"
  on tasks for delete
  to anon
  using (true);
