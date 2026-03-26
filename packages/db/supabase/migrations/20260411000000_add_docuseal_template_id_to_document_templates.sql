-- Add docuseal_template_id to document_templates
-- Links document templates to their DocuSeal builder-configured signing field templates
ALTER TABLE document_templates
  ADD COLUMN IF NOT EXISTS docuseal_template_id BIGINT;

COMMENT ON COLUMN document_templates.docuseal_template_id IS
  'DocuSeal template ID with pre-configured signing field positions. Set via embedded builder.';
