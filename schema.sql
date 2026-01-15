-- Brand Detection Dashboard Schema

-- 1. Brands Table (My Brands)
create table brands (
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

-- 2. Scan Jobs Table
create table scan_jobs (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  storage_path text not null,
  status text not null default 'queued', -- queued, processing, completed, failed
  progress_pages int default 0,
  total_pages int default 0,
  error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PDF Brands Table (Extracted results)
create table pdf_brands (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references scan_jobs(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  frequency int default 1,
  pages int[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Matches Table (Comparison results)
create table matches (
  id uuid default gen_random_uuid() primary key,
  job_id uuid not null references scan_jobs(id) on delete cascade,
  brand_id uuid references brands(id) on delete set null, -- Link to "My Brand" if found
  my_brand text, -- specific brand name matched
  detected_brand text not null,
  similarity int not null, -- 0 to 100
  match_type text not null, -- 'exact' or 'fuzzy'
  frequency int default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_brands_normalized on brands(normalized_name);
create index idx_pdf_brands_job on pdf_brands(job_id);
create index idx_matches_job_similarity on matches(job_id, similarity desc);

-- RLS Policies (Simplified for prototype: allow all for now, or authenticated)
-- alter table brands enable row level security;
-- create policy "Allow public read" on brands for select using (true);
-- create policy "Allow public insert" on brands for insert with check (true);
-- (Repeat for others if RLS is enabled)
