-- App configuration defaults
-- Seeded at deployment. Use the App Config UI to change values.
INSERT INTO app_config (key, value, description, updated_by) VALUES
  ('regularization_window_days', '7',        'Max calendar days in the past for regularization requests', null),
  ('comp_off_expiry_days',        '60',       'Days after worked date before comp-off expires',            null),
  ('leave_sla_business_days',     '2',        'Business days before pending leave is auto-escalated',      null),
  ('optional_holiday_limit_per_year', '2',   'Max optional holidays an employee can opt into per year',   null),
  ('auto_checkout_time',          '23:59:00', 'IST time at which auto-checkout cron runs (HH:MM:SS)',      null),
  ('rehire_carry_leave_balance',  'false',    'Carry leave balance when an employee is rehired',           null)
ON CONFLICT (key) DO NOTHING;
