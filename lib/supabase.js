
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && typeof window !== 'undefined') {
    console.warn('Supabase URL is missing. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
