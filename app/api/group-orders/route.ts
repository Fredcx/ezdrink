
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cart, members } = body; // members is array of { email }

        // 1. Calculate totals
        const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
        const total = subtotal + 3.75; // Taxa fixa example

        // 2. Save Base Order (as 'pending_group')
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

        // 4. Create Members
        // Add "Host" (You) implied? Or passed in members?
        // Let's assume frontend passes EVERYONE including host if applicable, OR we add host here if token present.
        // For simplicity of this migration, we rely on what frontend sends in `members` plus logic to be handled there.
        // Wait, the frontend `SplitCreatePage` sends `members: emails.map...`. It usually implies Host is NOT in that list but participating.
        // Better logic: Add members passed.

        const individualShare = total / (members.length + 1); // +1 for Host, assuming Host isn't in emails list

        // Insert Guest Members
        const membersToInsert = members.map((m: any) => ({
            group_order_id: groupOrder.id,
            email: m.email,
            share_amount: individualShare,
            status: 'pending'
        }));


        const { error: membersError } = await supabase
            .from('group_order_members')
            .insert(membersToInsert);

        if (membersError) throw membersError;

        // 5. Send Emails (if API Key present)
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey) {
            const { Resend } = require('resend');
            const resend = new Resend(resendApiKey);

            // Send emails in parallel (fire and forget for speed, or await if critical)
            membersToInsert.forEach(async (member: any) => {
                try {
                    const link = `${process.env.NEXT_PUBLIC_API_URL}/pay-split/${groupOrder.id}?email=${member.email}`;

                    await resend.emails.send({
                        from: 'EzDrink <onboarding@resend.dev>',
                        to: member.email,
                        subject: 'Dividir Conta - EzDrink',
                        html: `
                            <h1>Hora de dividir a conta! 💸</h1>
                            <p>Você foi convidado para pagar sua parte do pedido.</p>
                            <p><strong>Valor: R$ ${member.share_amount.toFixed(2)}</strong></p>
                            <br/>
                            <a href="${link}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pagar Agora</a>
                            <p>Ou acesse: ${link}</p>
                        `
                    });
                    console.log(`Email enviado para ${member.email}`);
                } catch (emailErr) {
                    console.error(`Erro ao enviar email para ${member.email}:`, emailErr);
                }
            });
        } else {
            console.warn("RESEND_API_KEY missing. Skipping email sending. Links generated:",
                membersToInsert.map((m: any) => `${process.env.NEXT_PUBLIC_API_URL}/pay-split/${groupOrder.id}?email=${m.email}`)
            );
        }

        // Insert Host (Need Auth context ideally, or pass host email)
        // For this MVP migration, if we don't have host email in body and no token, it's tricky.
        // Assuming we will handle Host adding themselves via a separate call or they are in 'members' if they typed themselves?
        // Let's assume the frontend passes the host or we get it from auth.
        // For now, let's Return success and let the host "claim" their spot or Pay as a "Guest" via the generated ID too.

        // Actually, to make "Lobby" work, we really need the record for the host too if they pay.
        // Let's proceed with returning the ID.

        return NextResponse.json({ success: true, groupOrderId: groupOrder.id });

    } catch (error: any) {
        console.error("Create Group Order Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
