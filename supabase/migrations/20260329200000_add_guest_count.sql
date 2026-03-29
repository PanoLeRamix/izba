-- Add guest_count column to meal_plans
alter table meal_plans add column guest_count integer not null default 0;
