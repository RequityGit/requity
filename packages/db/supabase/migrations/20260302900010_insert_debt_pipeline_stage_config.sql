-- Insert debt pipeline stage configs for the unified pipeline page
INSERT INTO pipeline_stage_config (pipeline_type, stage_key, label, color, sort_order, is_terminal, sla_days)
VALUES
  -- Debt Originations Stages (Opportunities phase)
  ('debt', 'awaiting_info', 'Awaiting Info', 'bg-slate-100 text-slate-800', 0, false, 3),
  ('debt', 'quoting', 'Quoting', 'bg-blue-100 text-blue-800', 1, false, 5),
  ('debt', 'uw', 'Underwriting', 'bg-purple-100 text-purple-800', 2, false, 7),
  ('debt', 'offer_placed', 'Offer Placed', 'bg-indigo-100 text-indigo-800', 3, false, 5),
  -- Debt Loan Stages (post-conversion)
  ('debt', 'application', 'Application', 'bg-cyan-100 text-cyan-800', 4, false, 5),
  ('debt', 'processing', 'Processing', 'bg-teal-100 text-teal-800', 5, false, 10),
  ('debt', 'underwriting', 'UW Review', 'bg-violet-100 text-violet-800', 6, false, 7),
  ('debt', 'approved', 'Approved', 'bg-emerald-100 text-emerald-800', 7, false, 5),
  ('debt', 'clear_to_close', 'Clear to Close', 'bg-amber-100 text-amber-800', 8, false, 10),
  ('debt', 'funded', 'Funded', 'bg-green-100 text-green-800', 9, true, null),
  ('debt', 'closed_lost', 'Closed Lost', 'bg-red-100 text-red-800', 10, true, null),
  ('debt', 'withdrawn', 'Withdrawn', 'bg-red-100 text-red-800', 11, true, null),
  ('debt', 'denied', 'Denied', 'bg-red-100 text-red-800', 12, true, null)
ON CONFLICT DO NOTHING;
