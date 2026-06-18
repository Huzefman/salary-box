-- 0013_add_shift_is_default.sql
-- Adds is_default column to shifts table for fallback shift resolution (BR-ATT-11)

alter table shifts add column is_default boolean not null default false;

-- Seed a "General Shift" as default if no shift exists
insert into shifts (name, start_time, end_time, break_minutes, weekly_off_days, grace_period_minutes, late_mark_threshold, is_night_shift, is_active, is_default)
select 'General Shift', '09:00'::time, '18:00'::time, 60, array[0]::smallint[], 15, 3, false, true, true
where not exists (select 1 from shifts);

create unique index idx_shifts_default on shifts (is_default) where is_default = true;
