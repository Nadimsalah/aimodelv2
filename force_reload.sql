
-- 1. Force Schema Cache Reload
NOTIFY pgrst, 'reload config';

-- 2. Verify table exists (re-run creation just in case)
create table if not exists brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  normalized_name text not null,
  logo_text text,
  registration_number text,
  nice_class text,
  filing_date text,
  expiration_date text,
  status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint brands_normalized_name_key unique (normalized_name)
);
