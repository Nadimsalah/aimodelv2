-- 1. Reset (Optional: Use carefully!)
-- drop table if exists matches;
-- drop table if exists pdf_brands;
-- drop table if exists scan_jobs;
-- drop table if exists brands;

-- 2. Create 'brands' table
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

-- 3. Create 'scan_jobs' table
create table if not exists scan_jobs (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  storage_path text not null,
  status text not null default 'queued',
  progress_pages int default 0,
  total_pages int default 0,
  error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create 'pdf_brands' table
create table if not exists pdf_brands (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references scan_jobs(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  frequency int default 1,
  pages int[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create 'matches' table
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references scan_jobs(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null,
  my_brand text,
  detected_brand text not null,
  similarity int not null,
  match_type text not null,
  frequency int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create Indexes
create index if not exists idx_brands_normalized on brands(normalized_name);
create index if not exists idx_pdf_brands_job on pdf_brands(job_id);
create index if not exists idx_matches_job_similarity on matches(job_id, similarity desc);

-- 7. Force Refresh
NOTIFY pgrst, 'reload config';
