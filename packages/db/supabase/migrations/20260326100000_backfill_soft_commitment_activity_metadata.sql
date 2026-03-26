-- Backfill existing "Soft commitment placed" activities with deal_id, deal_name,
-- and commitment_amount in the metadata JSONB column so the UI can render
-- enriched activity items (amount + clickable deal link).

UPDATE crm_activities ca
SET metadata = COALESCE(ca.metadata, '{}'::jsonb)
  || jsonb_build_object(
       'deal_id', sc.deal_id,
       'deal_name', ud.name,
       'commitment_amount', sc.commitment_amount
     )
FROM soft_commitments sc
JOIN unified_deals ud ON ud.id = sc.deal_id
WHERE ca.activity_type = 'system'
  AND ca.subject = 'Soft commitment placed'
  AND ca.metadata->>'soft_commitment_id' = sc.id::text
  AND ca.metadata->>'deal_id' IS NULL;
