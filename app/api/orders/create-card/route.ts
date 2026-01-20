
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createCardOrder } from '@/lib/pagarme';

// Helper to get user from token relative to Supabase
// Since this is a simple backend proxy, we trust the Authorization header for Supabase
// BUT we should verify it.
// For now, we will query the `users` table using the email claimed in the token?
// Better: Use `supabase.auth.getUser(token)`

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user || !user.email) {
            // Fallback: If using a custom JWT strategy (like previous server.js), we might need to verify differently.
            // Given the context of `backend/server.js` doing its own JWT, we might need that.
            // BUT `lib/supabase.ts` is client.
            // Let's assume standard Supabase Auth for Vercel app.
            // If fails, we might return 401.
            return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        // Fetch User Profile (CPF)
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Perfil de usuário não encontrado.' }, { status: 404 });
        }

        const body = await req.json();
        const { cart, card_id } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
        }
        if (!card_id) {
            return NextResponse.json({ error: 'Cartão não selecionado' }, { status: 400 });
        }

        // Calculate Total
        const subtotal = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const total = subtotal * 1.05; // Taxa de 5%

        // Create Customer Object for Pagar.me
        const customer = {
            name: profile.full_name || user.email,
            email: user.email,
            cpf: profile.cpf, // REQUIRED FIELD
            document: profile.cpf
        };

        // Resolve Card ID
        // Pagar.me needs the "Card ID" (saved in Pagar.me) which we stored in our `cards` table
        const { data: cardData, error: cardError } = await supabase
            .from('cards')
            .select('pagarme_card_id')
            .eq('id', card_id)
            .single();

        if (cardError || !cardData || !cardData.pagarme_card_id) {
            return NextResponse.json({ error: 'Cartão não encontrado ou inválido.' }, { status: 400 });
        }

        // Process Payment
        // createCardOrder throws if CPF is missing
        const pagarmeOrder = await createCardOrder(customer, cart, total, cardData.pagarme_card_id);

        // Check Status
        if (pagarmeOrder.status === 'paid') {
            // Save Order
            const { data: order, error: saveError } = await supabase.from('orders').insert({
                user_email: user.email,
                total_amount: total,
                payment_method: 'credit_card',
                status: 'ready',
                items: cart,
                pagarme_id: pagarmeOrder.id,
                transaction_id: pagarmeOrder.charges?.[0]?.id
            }).select().single();

            if (saveError) throw saveError;

            return NextResponse.json({
                success: true,
                orderId: order.id, // Or ticket_code if generated
                total
            });

        } else {
            return NextResponse.json({
                success: false,
                error: `Pagamento não aprovado. Status: ${pagarmeOrder.status}`
            });
        }

    } catch (error: any) {
        console.error("Card Payment Error:", error);
        return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
    }
}
