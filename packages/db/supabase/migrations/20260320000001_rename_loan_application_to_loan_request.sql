-- Rename "Loan Application" form to "Loan Request" to differentiate from full application
-- This is the quick intake form for borrowers/brokers on the website

UPDATE form_definitions
SET 
  name = 'Loan Request',
  slug = 'loan-request',
  description = 'Quick loan request form for borrowers and brokers with real-time pricing and term sheet generation',
  updated_at = now()
WHERE slug = 'loan-application';
