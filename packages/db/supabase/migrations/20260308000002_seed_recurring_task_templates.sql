-- Seed initial recurring task templates
-- Uses actual profile IDs from the database

INSERT INTO recurring_task_templates (
  title, category, priority, assigned_to, recurrence_type, monthly_mode,
  anchor_day, every_x_months, lead_days, next_due_date, next_generation_date,
  is_active, created_by
) VALUES
  ('Bank account reconciliation', 'Finance', 'High',
   '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f', 'monthly', 'date', 1, 1, 10,
   '2026-04-01', '2026-03-22', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Investor reporting package', 'Finance', 'High',
   '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f', 'monthly', 'date', 15, 3, 10,
   '2026-04-15', '2026-04-05', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Loan portfolio health check', 'Lending Ops', 'High',
   'f01d02c2-fd86-4a7b-9979-040ff6b0308d', 'monthly', 'date', 1, 1, 10,
   '2026-04-01', '2026-03-22', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Insurance cert renewal audit', 'Lending Ops', 'Medium',
   'f01d02c2-fd86-4a7b-9979-040ff6b0308d', 'monthly', 'date', 1, 3, 14,
   '2026-04-01', '2026-03-18', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Property tax payment review', 'Asset Mgmt', 'Medium',
   'cb69746f-4038-43a6-86af-ed209b83c4e7', 'monthly', 'date', 1, 3, 14,
   '2026-04-01', '2026-03-18', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Utility billing reconciliation', 'Asset Mgmt', 'Medium',
   'cb69746f-4038-43a6-86af-ed209b83c4e7', 'monthly', 'date', 5, 1, 10,
   '2026-04-05', '2026-03-26', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Blog content pipeline review', 'Marketing/Website', 'Medium',
   '897775f9-0083-4db6-91f9-519a6aac886f', 'weekly', NULL, 1, 1, 0,
   '2026-03-10', '2026-03-10', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Social media content calendar', 'Marketing/Website', 'Medium',
   '897775f9-0083-4db6-91f9-519a6aac886f', 'monthly', 'date', 25, 1, 10,
   '2026-03-25', '2026-03-15', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('Pricing matrix sync check', 'Lending Ops', 'Medium',
   '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f', 'weekly', NULL, 1, 1, 0,
   '2026-03-10', '2026-03-10', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f'),

  ('PhilCare HMO renewal review', 'HR', 'High',
   '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f', 'annually', NULL, 1, 1, 14,
   '2027-01-01', '2026-12-18', true, '4e12d0b2-295c-4e7e-a379-8d3ce7dea37f')
ON CONFLICT DO NOTHING;

UPDATE recurring_task_templates SET anchor_month = 1
WHERE title = 'PhilCare HMO renewal review' AND anchor_month IS NULL;
