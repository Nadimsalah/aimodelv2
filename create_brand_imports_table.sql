-- Create brand_imports table to track Excel upload history
CREATE TABLE IF NOT EXISTS brand_imports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    brands_count INTEGER DEFAULT 0,
    data_summary JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);/*  */

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_imports_created_at ON brand_imports(created_at DESC);

-- Force Schema Cache Reload for PostgREST
NOTIFY pgrst, 'reload config';
