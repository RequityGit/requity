-- Add object bindings to UW field definitions in unified_card_types.
-- Tags each field with where its data lives: deal, property, or borrower.

UPDATE unified_card_types
SET uw_fields = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'key' IN (
        'property_address', 'property_city', 'property_state', 'property_zip',
        'property_county', 'parcel_id', 'property_type', 'number_of_units',
        'units_lots_sites', 'year_built', 'total_sf', 'flood_zone_type',
        'is_in_flood_zone', 'is_short_term_rental'
      ) THEN elem || '{"object": "property"}'::jsonb
      WHEN elem->>'key' IN (
        'borrower_fico', 'borrower_experience', 'flips_completed',
        'combined_liquidity', 'combined_net_worth',
        'guarantor_liquidity', 'guarantor_net_worth'
      ) THEN elem || '{"object": "borrower"}'::jsonb
      ELSE elem || '{"object": "deal"}'::jsonb
    END
  )
  FROM jsonb_array_elements(uw_fields) elem
)
WHERE status IN ('active', 'draft', 'planned');
