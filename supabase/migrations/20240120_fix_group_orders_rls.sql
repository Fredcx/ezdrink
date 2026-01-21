-- Enable RLS for group_orders if not enabled
ALTER TABLE IF EXISTS public.group_orders ENABLE ROW LEVEL SECURITY;

-- Allow Authenticated users to view all group orders (simplification for now, or filter by creator could be added later)
CREATE POLICY "Authenticated Read Group Orders"
ON public.group_orders FOR SELECT
USING ( auth.role() = 'authenticated' );

-- Allow Authenticated users to INSERT group orders (Critical for creation)
CREATE POLICY "Authenticated Insert Group Orders"
ON public.group_orders FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- Allow Authenticated users to UPDATE group orders
CREATE POLICY "Authenticated Update Group Orders"
ON public.group_orders FOR UPDATE
USING ( auth.role() = 'authenticated' );


-- Enable RLS for group_order_members just in case
ALTER TABLE IF EXISTS public.group_order_members ENABLE ROW LEVEL SECURITY;

-- Policies for members
CREATE POLICY "Authenticated Read Members"
ON public.group_order_members FOR SELECT
USING ( auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Insert Members"
ON public.group_order_members FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Update Members"
ON public.group_order_members FOR UPDATE
USING ( auth.role() = 'authenticated' );
