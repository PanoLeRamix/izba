-- Ensure personal note column exists
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='meal_plans' and column_name='note') then
    alter table meal_plans add column note text;
  end if;
end $$;

-- Safely remove old table if it exists
drop table if exists day_comments;
