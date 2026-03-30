-- Add rotation_offset to tasks
alter table tasks add column rotation_offset int default 0;
