-- Add missing columns to pdf_brands
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS logo_path text;
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS nice_class text;
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS application_number text;
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS colors text;
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS filing_date text;
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS expiration_date text;
ALTER TABLE pdf_brands ADD COLUMN IF NOT EXISTS owner text;

-- Add pdf_brand_id to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pdf_brand_id uuid REFERENCES pdf_brands(id) ON DELETE CASCADE;

-- Force Schema Cache Reload for PostgREST
NOTIFY pgrst, 'reload config';
