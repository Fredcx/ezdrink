
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "placeholder-key";

// Note: This allows build to pass without keys, but runtime will fail if keys are missing.
// Ensure you set SUPABASE_URL and SUPABASE_KEY in Vercel Environment Variables.
export const supabase = createClient(supabaseUrl, supabaseKey);
