
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createPixOrder } from '@/lib/pagarme';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase.from('users').select('*').eq('email', user.email).single();

        const body = await req.json();
        const { items, customer: bodyCustomer, total } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
        }

        // Construct Real Customer from Profile (preferred) or Body
        const customer = {
            name: profile?.full_name || bodyCustomer?.name || "Cliente EzDrink",
            email: user.email,
            cpf: profile?.cpf || bodyCustomer?.cpf || bodyCustomer?.document,
            document: profile?.cpf || bodyCustomer?.cpf || bodyCustomer?.document,
            phones: bodyCustomer?.phones
        };

        // 1. Create Order in Pagar.me
        let pagarmeOrder;
        try {
            pagarmeOrder = await createPixOrder(customer, items, total);
        } catch (err: any) {
            console.error("Pagarmes creation failed:", err);
            return NextResponse.json({ error: 'Erro ao criar pedido no Pagar.me: ' + err.message }, { status: 500 });
        }

        const qrCode = pagarmeOrder.charges[0].last_transaction?.qr_code;
        const qrCodeUrl = pagarmeOrder.charges[0].last_transaction?.qr_code_url;
        const transactionId = pagarmeOrder.charges[0].last_transaction?.id;

        // 2. Persist in Supabase
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([
                {
                    user_email: user.email,
                    total_amount: total,
                    status: 'pending_payment',
                    items: items,
                    payment_method: 'pix',
                    transaction_id: transactionId,
                    qr_code: qrCode,
                    pagarme_id: pagarmeOrder.id
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
            ticket: orderData.id,
            total
        });

    } catch (error: any) {
        console.error("Create Pix Error:", error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
