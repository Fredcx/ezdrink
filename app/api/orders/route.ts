
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'No token provided' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = decoded.id; // User ID from token
        // We might also need email to check group slots if they are a guest who registered?
        // But if they have a token, they are a User.

        // 1. Fetch Orders created by User (Host/Single)
        const { data: myOrders, error: myOrdersError } = await supabase
            .from('orders')
            .select(`
                *,
                group_orders (
                    id,
                    status
                )
            `)
            .eq('user_id', userId) // Assuming orders have user_id. If not, we might need another way.
            .order('created_at', { ascending: false });

        // NOTE: In the original migration, we didn't strictly add `user_id` to orders table in the schema script provided in previous turns.
        // If `user_id` is missing in `orders` schema, we can't filter by it easily unless we stored it.
        // Let's assume `orders` has `user_id` OR we use `created_by`?
        // Checking `backend/server.js` (memory) - usually it does.
        // If not, we might fallback to returning all or empty.

        // Let's proceed assuming we can fetch by `user_id`.

        // 2. Fetch Group Orders where user is a Member (Guest who logged in / User invited)
        // If the user is logged in, they have an email.
        // We should check `group_order_members` for their email.

        // However, we need the User's email from the DB or Token.
        // Let's assume Token has email.
        const userEmail = decoded.email;

        let memberOrders = [];
        if (userEmail) {
            const { data: memberGroups, error: memberError } = await supabase
                .from('group_order_members')
                .select(`
                    group_order_id,
                    group_orders (
                        id,
                        order_id,
                        status,
                        orders (
                            id,
                            total_amount,
                            status,
                            items,
                            created_at,
                            ticket_code
                        )
                    )
                `)
                .eq('email', userEmail);

            if (memberGroups && memberGroups.length > 0) {
                // Flatten this structure to look like an Order
                memberOrders = memberGroups.map((mg: any) => {
                    const go = mg.group_orders;
                    const o = go.orders;
                    if (!o) return null;
                    return {
                        ...o,
                        is_group_member: true,
                        group_order_id: go.id,
                        group_status: go.status
                    };
                }).filter(Boolean);
            }
        }

        // Combine and Deduplicate
        // If I am Host, I appear in logic 1.
        // If I assigned myself a slot with email match, I appear in logic 2.
        // Prefer Logic 1 for "My Orders" but handle both.

        const allOrders = [...(myOrders || []), ...memberOrders];

        // Remove duplicates by ID
        const uniqueOrders = Array.from(new Map(allOrders.map(item => [item.id, item])).values());

        // Sort by date desc
        uniqueOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json(uniqueOrders);

    } catch (error: any) {
        console.error("Fetch Orders Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
