
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createApplePayOrder } from '@/lib/pagarme';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user || !user.email) {
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        const body = await req.json();
        const { cart, token: appleToken } = body;

        if (!cart || cart.length === 0) return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
        if (!appleToken) return NextResponse.json({ error: 'Token Apple Pay não fornecido' }, { status: 400 });

        const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const total = subtotal + 3.75;

        const customer = {
            name: profile?.full_name || user.email,
            email: user.email,
            cpf: profile?.cpf,
            document: profile?.cpf
        };

        // Call Pagar.me
        const pagarmeOrder = await createApplePayOrder(customer, cart, total, appleToken);

        if (pagarmeOrder.status === 'paid') {
            const { data: order, error: saveError } = await supabase.from('orders').insert({
                user_email: user.email,
                total_amount: total,
                payment_method: 'apple_pay',
                status: 'ready',
                items: cart,
                pagarme_id: pagarmeOrder.id
            }).select().single();

            if (saveError) throw saveError;

            return NextResponse.json({
                success: true,
                orderId: order.id,
                total
            });
        } else {
            return NextResponse.json({
                success: false,
                error: `Pagamento Apple Pay não aprovado: ${pagarmeOrder.status}`
            });
        }

    } catch (error: any) {
        console.error("Apple Pay Error:", error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
