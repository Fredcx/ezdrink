
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { cart } = body;

        // 1. Calculate totals
        const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
        const total = subtotal + 3.75; // Taxa fixa

        // 2. Save Base Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                total_amount: total,
                status: 'pending_group',
                items: cart,
                payment_method: 'split'
            }])
            .select()
            .single();

        if (orderError) throw orderError;

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

        if (groupError) throw groupError;

        // 4. No Member Slots created initially.
        // Members will be added dynamically when they pay via /pay-split/[id].

        // 5. No Emails sent automatically in this flow (QR Code based)




        return NextResponse.json({ success: true, groupOrderId: groupOrder.id });

    } catch (error: any) {
        console.error("Create Group Order Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
