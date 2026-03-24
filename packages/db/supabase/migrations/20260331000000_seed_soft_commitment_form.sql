-- Seed the "Soft Commitment" form definition into form_definitions
-- This wires the public /invest/[slug] page into the form builder system.

INSERT INTO public.form_definitions (name, slug, description, status, mode, contexts, steps, settings)
VALUES (
  'Soft Commitment',
  'soft-commitment',
  'Public soft commitment form for investor interest in fundraising deals',
  'published',
  'create_only',
  '{external}',
  '[
    {
      "id": "s1",
      "title": "Express Your Interest",
      "subtitle": "Let us know about your interest in this investment opportunity. This is a non-binding expression of interest.",
      "type": "form",
      "target_entity": "crm_contact",
      "match_on": "email",
      "show_when": null,
      "fields": [
        {
          "id": "email",
          "type": "email",
          "label": "Email",
          "required": true,
          "mapped_column": "email",
          "width": "full",
          "placeholder": "you@example.com",
          "visibility_mode": "both",
          "visibility_form_mode": "both"
        },
        {
          "id": "full_name",
          "type": "text",
          "label": "Full Name",
          "required": true,
          "mapped_column": "first_name",
          "width": "full",
          "placeholder": "Jane Smith",
          "visibility_mode": "both",
          "visibility_form_mode": "both"
        },
        {
          "id": "phone",
          "type": "phone",
          "label": "Phone",
          "required": false,
          "mapped_column": "phone",
          "width": "full",
          "placeholder": "(555) 123-4567",
          "visibility_mode": "both",
          "visibility_form_mode": "both"
        },
        {
          "id": "is_accredited",
          "type": "select",
          "label": "Are you an accredited investor?",
          "required": false,
          "mapped_column": null,
          "width": "full",
          "placeholder": "Select...",
          "visibility_mode": "both",
          "visibility_form_mode": "both",
          "options": [
            { "value": "yes", "label": "Yes" },
            { "value": "no", "label": "No" }
          ]
        },
        {
          "id": "commitment_amount",
          "type": "custom",
          "label": "Interested Investment Amount",
          "required": true,
          "mapped_column": null,
          "width": "full",
          "visibility_mode": "both",
          "visibility_form_mode": "both",
          "component_type": "investment-amount-selector",
          "component_config": {
            "default_options": [25000, 50000, 100000, 250000]
          }
        },
        {
          "id": "questions",
          "type": "textarea",
          "label": "Do you have any questions we can answer?",
          "required": false,
          "mapped_column": null,
          "width": "full",
          "placeholder": "Any questions for our team?",
          "visibility_mode": "both",
          "visibility_form_mode": "both"
        }
      ]
    }
  ]'::jsonb,
  '{
    "notify_emails": ["dylan@requitygroup.com", "luis@requitygroup.com"],
    "success_message": "Thank you! We''ve received your soft commitment. Our team will be in touch with next steps."
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  steps = EXCLUDED.steps,
  settings = EXCLUDED.settings,
  status = EXCLUDED.status,
  mode = EXCLUDED.mode,
  contexts = EXCLUDED.contexts,
  description = EXCLUDED.description,
  updated_at = now();
