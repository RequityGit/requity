-- Update the existing bucket with enterprise constraints
UPDATE storage.buckets
SET 
    file_size_limit = 5242880, -- Limit to 5MB (Prevents massive slow-loading files)
    allowed_mime_types = '{image/jpeg,image/png,image/webp,image/svg+xml}'
WHERE id = 'trg-living-media';