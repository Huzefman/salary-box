-- Add early checkout columns to attendance_records
alter table attendance_records
  add column if not exists early_checkout_reason text,
  add column if not exists early_checkout_status text check (early_checkout_status in ('pending', 'approved', 'rejected'));
