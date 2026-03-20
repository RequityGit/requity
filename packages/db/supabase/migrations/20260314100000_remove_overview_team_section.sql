-- Remove the redundant "Team" section from the deal detail overview tab.
-- Team assignments are managed exclusively via the Deal Team popover in the header,
-- which uses the deal_team_members table (linked to real profiles).
-- The overview Team section stored free-form text in uw_data and is no longer needed.
-- page_layout_fields rows cascade-delete automatically (ON DELETE CASCADE).

DELETE FROM page_layout_sections
WHERE page_type = 'deal_detail'
  AND section_key = 'overview_team';
