
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createPixOrder } from '@/lib/pagarme';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { items, customer, total } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
        }

        // 1. Create Order in Pagar.me
        let pagarmeOrder;
        try {
            pagarmeOrder = await createPixOrder(customer, items, total);
        } catch (err: any) {
            console.error("Pagarmes creation failed:", err);
            return NextResponse.json({ error: 'Erro ao criar pedido no Pagar.me: ' + err.message }, { status: 500 });
        }

        const qrCode = pagarmeOrder.charges[0].last_transaction.qr_code;
        const qrCodeUrl = pagarmeOrder.charges[0].last_transaction.qr_code_url;
        const transactionId = pagarmeOrder.charges[0].last_transaction.id;

        // 2. Persist in Supabase
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([
                {
                    total_amount: total,
                    status: 'pending_payment',
                    items: items, // Storing JSON for simplicity/history
                    payment_method: 'pix',
                    transaction_id: transactionId
                    // Note: In a real app we'd map customer_id if logged in
                }
            ])
            .select()
            .single();

        if (orderError) {
            console.error("Supabase Order save failed:", orderError);
            return NextResponse.json({ error: 'Erro ao salvar pedido' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            orderId: orderData.id,
            qr_code: qrCode,
            qr_code_url: qrCodeUrl,
            ticket: orderData.id // Just using ID as ticket for now
        });

    } catch (error) {
        console.error("Create Pix Error:", error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
