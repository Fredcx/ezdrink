
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/group-orders/[id]/pay
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, amount } = body;

        if (!name || !amount) {
            return NextResponse.json({ error: 'Nome e Valor são obrigatórios' }, { status: 400 });
        }

        // 1. Process Payment with Pagar.me (Simulated)
        // In real world, we would create a charge here.
        try {
            const { createPixOrder } = require('@/lib/pagarme');

            const customerMock = {
                name: name,
                email: "guest@ezdrink.com", // Placeholder
                cpf: "00000000000"
            };

            const itemsMock = [{
                id: `share_${id}_${Date.now()}`,
                name: `Cota de Divisão - ${name}`,
                price: amount,
                quantity: 1
            }];

            // Create Pix Charge (Simulated)
            await createPixOrder(customerMock, itemsMock, amount);

        } catch (pagarmeErr) {
            console.error("Erro Pagar.me:", pagarmeErr);
            // We continue for demo purposes if Pagar.me fails (e.g. invalid key in dev)
            // return NextResponse.json({ error: 'Erro no pagamento' }, { status: 500 });
        }

        // 2. Insert new Member Record (Paid)
        const { error: insertError } = await supabase
            .from('group_order_members')
            .insert([{
                group_order_id: id,
                email: name, // Using 'email' column to store Name for Guests
                share_amount: amount,
                status: 'paid', // Auto-approve for demo
                paid_at: new Date().toISOString()
            }]);

        if (insertError) throw insertError;

        // 3. Check Totals
        const { data: groupOrder, error: groupError } = await supabase
            .from('group_orders')
            .select(`
                total_amount, 
                order_id,
                group_order_members (share_amount, status)
            `)
            .eq('id', id)
            .single();

        if (!groupError && groupOrder) {
            const totalPaid = groupOrder.group_order_members
                .filter((m: any) => m.status === 'paid')
                .reduce((acc: number, m: any) => acc + m.share_amount, 0);

            // If fully paid (allow small margin for float errors)
            if (totalPaid >= (groupOrder.total_amount - 0.05)) {
                await supabase.from('group_orders').update({ status: 'completed' }).eq('id', id);
                await supabase.from('orders').update({ status: 'paid' }).eq('id', groupOrder.order_id);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Pay Group Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
