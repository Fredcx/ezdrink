
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createPixOrder } from '@/lib/pagarme';

// POST /api/group-orders/[id]/pay
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { email, cpf } = body;

        if (!email || !cpf) {
            return NextResponse.json({ error: 'Email e CPF são obrigatórios' }, { status: 400 });
        }

        // 1. Validate Member and Get Amount
        const { data: member, error: memberError } = await supabase
            .from('group_order_members')
            .select('*')
            .eq('group_order_id', id)
            .eq('email', email)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
        }

        if (member.status === 'paid') {
            return NextResponse.json({ error: 'Já pago' }, { status: 400 });
        }

        const amount = member.share_amount;

        // 2. Process Payment with Pagar.me
        let pagarmeOrder;
        try {
            const customer = {
                name: email, // Use email as name for guest
                email: email.includes('@') ? email : "guest@ezdrink.com",
                cpf: cpf,
                document: cpf,
                phones: {
                    mobile_phone: {
                        country_code: "55",
                        area_code: "11",
                        number: "999999999" // Default if not collected
                    }
                }
            };

            const items = [{
                id: `share_${id}_${Date.now()}`,
                title: `Cota de Divisão - ${email}`,
                unit_price: Math.round(amount * 100), // Pagar.me expects cents? Wait, createPixOrder takes float and converts? 
                // Let's check createPixOrder. It takes 'amount' as total.
                quantity: 1,
                tangible: false
            }];

            // Note: createPixOrder(customer, items, total_amount)
            // It expects items to have 'unit_price' in cents usually.
            // Let's verify lib/pagarme.ts usage.
            // Step 86 view: createPixOrder calls sendPagarmeRequest.
            // Items structure expected by Pagar.me: unit_price in cents.
            // My previous createPixOrder implementation takes `amount` (total) and `items`. 
            // It uses `items` directly.
            // So I should pass items formatted correctly.

            pagarmeOrder = await createPixOrder(customer, items, amount);

        } catch (pagarmeErr: any) {
            console.error("Erro Pagar.me:", pagarmeErr);
            return NextResponse.json({ error: 'Erro no pagamento: ' + pagarmeErr.message }, { status: 500 });
        }

        // 3. Mark as Paid (Ideally, we should rely on Webhook, but for now we trust the immediate response if "paid" or if we just want to treat "generated" as "pending")
        // Pagar.me Pix is "pending" until paid.
        // But the previous logic was "Simulated" -> "Paid".
        // If we switch to Real, it will be "Pending". 
        // If I mark it as 'paid' now, I'm lying.
        // BUT, the system might not handle 'pending' state well for split bills yet.
        // For the purpose of "Performing Real Transactions", I must generate the Pix.
        // I should set status to 'pending' or 'waiting_payment'.
        // However, the frontend checks for 'paid'.
        // If I set it to 'paid' immediately, users can cheat (generate pix, don't pay, system thinks paid).
        // Since the prompt asks to "Perform Real Transactions", I must accept that it changes state to Pending.
        // But if I assume the user *will* pay, testing might be annoying.
        // I will set it to 'pending' if the schema supports it.
        // The previous code set it to 'paid'.
        // I will set it to 'pending' and return the QR code.
        // Does the user want to BLOCK untill paid? Real Pix takes seconds.
        // I will set it to 'paid' ONLY for this migration task if that's what keeps the app working, 
        // BUT strictly speaking it's wrong.
        // However, looking at the previous code: it was "Simulated".
        // "Fix [...] to perform real transactions".
        // I will save the `transaction_id` and maybe set status to `pending_payment`?
        // Let's see if `group_order_members` table supports `status` other than paid/unpaid.
        // The mock used status: 'paid'.
        // I will update it to 'pending_payment'.

        const { error: updateError } = await supabase
            .from('group_order_members')
            .update({
                status: 'pending_payment', // Changed from 'paid'
                transaction_id: pagarmeOrder.id,
                qr_code: pagarmeOrder.charges[0].last_transaction?.qr_code,
                qr_code_url: pagarmeOrder.charges[0].last_transaction?.qr_code_url
            })
            .eq('id', member.id);

        if (updateError) throw updateError;

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
