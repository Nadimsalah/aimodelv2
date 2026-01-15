# Supabase Schema Cache Issue - Diagnostic & Fix

## Problem
Error: `Could not find the table 'public.brands' in the schema cache` (PGRST205)

## Root Cause
The Supabase PostgREST API gateway has not detected the `brands` table. This happens when:
1. The table was never created
2. The table exists but PostgREST cache is stale
3. The table was created in a different schema (not `public`)

## Verified Facts
- ✅ Supabase connection credentials are correct
- ✅ Project URL: https://tiszirpwlhomuxmyqnkq.supabase.co
- ❌ PostgREST cannot see the `brands` table

## Solution Steps

### Step 1: Verify Table Existence
Go to your Supabase Dashboard → Table Editor and check if `brands` table exists.

**If table DOES NOT exist:**
Run this SQL in the SQL Editor:

```sql
-- Create brands table
create table if not exists public.brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  normalized_name text not null unique,
  logo_text text,
  registration_number text,
  nice_class text,
  filing_date text,
  expiration_date text,
  status text,
  created_at timestamp with time zone default now()
);

-- Force PostgREST to reload
notify pgrst, 'reload schema';
```

### Step 2: Force Schema Reload
Even if the table exists, run this command in SQL Editor:

```sql
notify pgrst, 'reload schema';
```

Wait 10 seconds after running this.

### Step 3: Verify API Access
After Step 2, test the connection by running this in your terminal:

```bash
cd "/home/micro/Documents/Cursor/AI Model"
export $(cat .env.local | xargs)
node -e "
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('brands').select('count', { count: 'exact', head: true }).then(r => console.log('Status:', r.status, r.error ? r.error.message : 'OK'));
"
```

Expected output: `Status: 204 OK`

### Step 4: Restart Dev Server
```bash
pkill node
npm run dev
```

## Alternative: Check Schema Name
If the above doesn't work, the table might be in a different schema. Run this SQL:

```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'brands';
```

If it shows a schema other than `public`, you need to either:
- Move the table to `public` schema, OR
- Update your queries to use the correct schema name

## Files to Check
- `/home/micro/Documents/Cursor/AI Model/init_db.sql` - Contains full schema
- `/home/micro/Documents/Cursor/AI Model/.env.local` - Contains credentials
