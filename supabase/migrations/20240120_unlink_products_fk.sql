-- Remove Foreign Key constraint from products table
-- This allows products to reference the new 'menu_categories' table (or just store IDs freely)
-- without being blocked by the old 'categories' table rules.

DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'products_category_id_fkey') THEN 
    ALTER TABLE public.products DROP CONSTRAINT products_category_id_fkey; 
  END IF; 
END $$;

-- Optional: If we want to verify the column type fits (it should be bigint or int)
-- ALTER TABLE public.products ALTER COLUMN category_id TYPE bigint; 
