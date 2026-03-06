#!/bin/bash
# Upload Requity SVG logos to Supabase Storage
# Run this from the project root: bash scripts/upload-logos.sh
# Bucket: brand-assets | Path: logos/

SUPABASE_URL="https://edhlkknvlczhbowasjna.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkaGxra252bGN6aGJvd2Fzam5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjY5NTYsImV4cCI6MjA4NzgwMjk1Nn0.Ob8m3pUUhgQpWvqmz5lTiQziD4IRRU_GxXrZi67B7x8"

upload_svg() {
  local FILE_PATH="$1"
  local STORAGE_PATH="$2"
  local LABEL="$3"

  if [ ! -f "$FILE_PATH" ]; then
    echo "Error: $FILE_PATH not found"
    return 1
  fi

  echo "Uploading $LABEL..."
  curl -s -X POST \
    "${SUPABASE_URL}/storage/v1/object/brand-assets/${STORAGE_PATH}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: image/svg+xml" \
    -H "x-upsert: true" \
    --data-binary @"$FILE_PATH"
  echo ""
  echo "✓ ${SUPABASE_URL}/storage/v1/object/public/brand-assets/${STORAGE_PATH}"
  echo ""
}

# Upload color logo (horizontal, 2936x568)
upload_svg "./requity-logo-color.svg" "logos/requity-logo-color.svg" "Color logo (horizontal)"

# Upload white logo (square, 2000x2000)
upload_svg "./requity-logo-white.svg" "logos/requity-logo-white.svg" "White logo (square)"

echo "Done! Both logos uploaded to brand-assets/logos/"
echo ""
echo "Public URLs:"
echo "  Color: ${SUPABASE_URL}/storage/v1/object/public/brand-assets/logos/requity-logo-color.svg"
echo "  White: ${SUPABASE_URL}/storage/v1/object/public/brand-assets/logos/requity-logo-white.svg"
