
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";

// Note: This allows build to pass without keys, but runtime will fail if keys are missing.
// Ensure you set SUPABASE_URL and SUPABASE_KEY in Vercel Environment Variables.
export const supabase = createClient(supabaseUrl, supabaseKey);
