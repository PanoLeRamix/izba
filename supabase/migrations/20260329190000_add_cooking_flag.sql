-- Add is_cooking column to meal_plans
alter table meal_plans add column is_cooking boolean not null default false;
