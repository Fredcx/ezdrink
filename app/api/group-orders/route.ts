
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

import { verify } from 'jsonwebtoken';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 0. Authenticate User
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        let userEmail = '';

        try {
            const decoded: any = verify(token, process.env.JWT_SECRET || 'ezdrink_secure_jwt_secret_dev');
            userEmail = decoded.email;
        } catch (err) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const { cart } = body;

        // 1. Calculate totals
        const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
        const total = subtotal * 1.05; // Taxa de 5%

        // 2. Save Base Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                user_email: userEmail, // Valid email from token
                total_amount: total,
                status: 'pending_group',
                items: cart,
                payment_method: 'split'
            }])
            .select()
            .single();

        if (orderError) {
            console.error("Supabase Order Insert Error:", JSON.stringify(orderError, null, 2));
            throw new Error(`Order Insert Failed: ${orderError.message}`);
        }

        // 3. Create Group Order record
        const { data: groupOrder, error: groupError } = await supabase
            .from('group_orders')
            .insert([{
                order_id: order.id,
                total_amount: total,
                status: 'pending'
            }])
            .select()
            .single();

        if (groupError) {
            console.error("Supabase Group_Order Insert Error:", JSON.stringify(groupError, null, 2));
            // Rollback order? Ideally yes, but Supabase doesn't support convenient transactions via JS client easily without RPC.
            // For now, allow order to stay as orphan or 'failed'.
            throw new Error(`Group Order Insert Failed: ${groupError.message}`);
        }

        // 4. No Member Slots created initially.
        // Members will be added dynamically when they pay via /pay-split/[id].

        // 5. No Emails sent automatically in this flow (QR Code based)

        return NextResponse.json({ success: true, groupOrderId: groupOrder.id });

    } catch (error: any) {
        console.error("Create Group Order Final Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
