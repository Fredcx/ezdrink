-- Add Pagar.me integration columns to orders table
-- Run this in Supabase SQL Editor

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pagarme_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS qr_code_url text;

-- Index for future lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_orders_pagarme_id ON public.orders(pagarme_id);
