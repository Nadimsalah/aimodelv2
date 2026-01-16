-- Clean up orphaned scan jobs and reset the system
-- This will fix the stuck dashboard pages

-- 1. Delete any scan jobs that are stuck in processing
DELETE FROM scan_jobs WHERE status = 'processing';

-- 2. Delete any orphaned PDF brands (brands without a valid job)
DELETE FROM pdf_brands WHERE job_id NOT IN (SELECT id FROM scan_jobs);

-- 3. Force schema reload
NOTIFY pgrst, 'reload config';
