-- This script is a workaround to populate elasticsearchId for properties that don't have it
-- Run via: psql -U postgres -d realstate -f sync_es_ids.sql

-- For now, we'll just document what needs to be done
-- The elasticsearchId should be populated when properties are created/updated
-- Alternatively, we can fetch from Elasticsearch and map back to PostgreSQL

-- If you have properties without elasticsearchId, you need to:
-- 1. Get the Elasticsearch ID from the search results
-- 2. Update the property record in PostgreSQL with that ID

-- Example (replace with actual IDs):
-- UPDATE "Property" SET "elasticsearchId" = 'LYYlAJ0BooR_VcmHRcb2' WHERE id = 'actual-pg-id';
