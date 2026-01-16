-- Add import_id column to brands table to track which import they came from
ALTER TABLE brands ADD COLUMN IF NOT EXISTS import_id UUID REFERENCES brand_imports(id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_brands_import_id ON brands(import_id);

-- Force Schema Cache Reload for PostgREST
NOTIFY pgrst, 'reload config';
