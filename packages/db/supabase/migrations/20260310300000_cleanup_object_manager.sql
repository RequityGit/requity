-- Remove non-functional objects from object_definitions:
-- opportunity (duplicates Pipeline Deal, originations doesn't use Field Manager)
-- equity_deal (module deleted, 0 fields)
-- servicing_loan (module deleted, 0 fields)
-- fund (0 fields, 0 rels, not consumed)

-- 1. Delete relationship_roles for opportunity relationships
DELETE FROM relationship_roles
WHERE relationship_id IN (
  SELECT id FROM object_relationships
  WHERE parent_object_key = 'opportunity' OR child_object_key = 'opportunity'
);

-- 2. Delete relationships involving opportunity
DELETE FROM object_relationships
WHERE parent_object_key = 'opportunity' OR child_object_key = 'opportunity';

-- 3. Delete the 4 object definitions
DELETE FROM object_definitions
WHERE object_key IN ('opportunity', 'equity_deal', 'servicing_loan', 'fund');

-- 4. Re-number sort_order to remove gaps
UPDATE object_definitions SET sort_order = sub.new_order
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order) - 1 AS new_order
  FROM object_definitions
) sub
WHERE object_definitions.id = sub.id;
