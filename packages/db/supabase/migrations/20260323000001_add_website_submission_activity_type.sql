-- Add website_submission, message_sent, email_merge to unified_deal_activity allowed types
ALTER TABLE unified_deal_activity DROP CONSTRAINT unified_deal_activity_activity_type_check;
ALTER TABLE unified_deal_activity ADD CONSTRAINT unified_deal_activity_activity_type_check
  CHECK (activity_type = ANY (ARRAY[
    'stage_change','note','email','call','meeting',
    'document_uploaded','task_completed','checklist_completed',
    'field_updated','relationship_added','status_change',
    'ai_review','team_updated','call_logged','email_sent',
    'closing_scheduled','approval_requested',
    'website_submission','message_sent','email_merge'
  ]));
