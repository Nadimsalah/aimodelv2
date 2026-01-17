-- Enable RLS on storage.objects - SKIPPED (Already enabled by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Create Policy to Allow Public Uploads to 'scans' bucket
-- (Or restrict to authenticated if you use Auth, but for now we assume public/anon for simplicity based on your setup)
CREATE POLICY "Allow Public Uploads" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'scans');

-- 2. Create Policy to Allow Public Reads (Download/View)
CREATE POLICY "Allow Public Reads" ON storage.objects
FOR SELECT
USING (bucket_id = 'scans');

-- 3. Ensure the bucket exists (Optional, but good measure)
INSERT INTO storage.buckets (id, name, public)
VALUES ('scans', 'scans', true)
ON CONFLICT (id) DO NOTHING;
