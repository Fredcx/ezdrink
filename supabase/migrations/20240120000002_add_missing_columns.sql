-- Add missing columns to categories table
-- Run this in Supabase SQL Editor

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;

-- Ensure RLS is enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Re-apply policies just in case
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON public.categories;
CREATE POLICY "Allow authenticated insert" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete" ON public.categories;
CREATE POLICY "Allow authenticated delete" ON public.categories FOR DELETE USING (auth.role() = 'authenticated');
