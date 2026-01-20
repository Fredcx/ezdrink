
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createPixOrder } from '@/lib/pagarme';

// POST /api/group-orders/[id]/pay
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { email, cpf } = body;

        if (!email || !cpf || !body.amount) {
            return NextResponse.json({ error: 'Email, CPF e Valor são obrigatórios' }, { status: 400 });
        }

        const amount = Number(body.amount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
        }

        // 1. Create a "Member" record (Transaction) for this payment attempt
        // We do this BEFORE Pagar.me to have a reference, OR we do it after?
        // Let's do it after finding the group order to ensure it exists.

        const { data: groupOrder, error: groupError } = await supabase
            .from('group_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (groupError || !groupOrder) {
            return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
        }

        // 2. Process Payment with Pagar.me
        let pagarmeOrder;
        try {
            const customer = {
                name: email,
                email: email.includes('@') ? email : "guest@ezdrink.com",
                cpf: cpf,
                document: cpf,
                phones: {
                    mobile_phone: {
                        country_code: "55",
                        area_code: "11",
                        number: "999999999"
                    }
                }
            };

            const items = [{
                id: `split_${id}_${Date.now()}`,
                title: `Pagamento Parcial - ${email}`,
                unit_price: Math.round(amount * 100), // Cents
                quantity: 1,
                tangible: false
            }];

            // Amount logic: createPixOrder in lib might need adjusting if it ignores items unit_price?
            // Assuming createPixOrder(customer, items, total) works.
            pagarmeOrder = await createPixOrder(customer, items, amount);

        } catch (pagarmeErr: any) {
            console.error("Erro Pagar.me:", pagarmeErr);
            return NextResponse.json({ error: 'Erro no pagamento: ' + pagarmeErr.message }, { status: 500 });
        }

        // 3. Save "Member" Record
        const { data: member, error: insertError } = await supabase
            .from('group_order_members')
            .insert({
                group_order_id: id,
                email: email,
                share_amount: amount,
                status: 'pending_payment',
                transaction_id: pagarmeOrder.id,
                qr_code: pagarmeOrder.charges[0].last_transaction?.qr_code,
                qr_code_url: pagarmeOrder.charges[0].last_transaction?.qr_code_url
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Return QR Code
        return NextResponse.json({
            success: true,
            qr_code: pagarmeOrder.charges[0].last_transaction?.qr_code,
            qr_code_url: pagarmeOrder.charges[0].last_transaction?.qr_code_url
        });

    } catch (error: any) {
        console.error("Pay Group Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
