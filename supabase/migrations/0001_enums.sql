-- 0001_enums.sql
-- Enum types used across the schema. Must exist before any dependent table.
-- Source: docs/DATABASE_SCHEMA.md "Enum Types"

create type employment_status as enum (
  'active',
  'on_probation',
  'resigned',
  'terminated',
  'on_leave',
  'future_joiner'
);

create type employment_type as enum (
  'full_time',
  'part_time',
  'contractor',
  'intern'
);

create type user_role as enum (
  'owner',
  'hr',
  'employee',
  'system_admin'
);

create type gender as enum (
  'male',
  'female',
  'other',
  'prefer_not_to_say'
);

create type attendance_status as enum (
  'present',
  'absent',
  'half_day',
  'work_from_home',
  'on_leave',
  'holiday',
  'weekly_off',
  'incomplete'
);

create type regularization_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type leave_status as enum (
  'pending',
  'approved',
  'rejected',
  'cancelled'
);

create type leave_accrual_type as enum (
  'monthly',
  'yearly',
  'manual'
);

create type holiday_type as enum (
  'national',
  'state',
  'company',
  'optional'
);

create type lifecycle_event_type as enum (
  'onboarding',
  'promotion',
  'transfer',
  'salary_revision',
  'resignation',
  'termination',
  'rehire'
);
