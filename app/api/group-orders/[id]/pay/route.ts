
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/group-orders/[id]/pay
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { email } = body;

        // 1. Mark member as paid
        // First check if member exists
        const { data: member, error: findError } = await supabase
            .from('group_order_members')
            .select('*')
            .eq('group_order_id', id)
            .eq('email', email)
            .single();

        if (findError || !member) {
            // Check if it's the Host (maybe missing in table? or we add on fly?)
            // If strict: fail.
            // For MVP: If email provided but not in list, maybe it's the Host claiming their share?
            // Let's stick to strict: must be in table.

            // Allow auto-add if it's the Host? 
            // Let's create a record if it doesn't exist? (Dangerous for splitting math)
            // Safer: Just Error.
            return NextResponse.json({ error: 'Membro não encontrado nesta divisão' }, { status: 404 });
        }

        // 2. Process Payment (Mocked for now, or use Pagar.me Pix if implemented)
        // Here we simulate success.

        const { error: updateError } = await supabase
            .from('group_order_members')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', member.id);

        if (updateError) throw updateError;

        // 3. Check if EVERYONE paid
        const { data: allMembers, error: listError } = await supabase
            .from('group_order_members')
            .select('status')
            .eq('group_order_id', id);

        if (!listError && allMembers && allMembers.every((m: any) => m.status === 'paid')) {
            // Update Group Order Status
            await supabase.from('group_orders').update({ status: 'completed' }).eq('id', id);

            // Update Main Order Status?
            const { data: group } = await supabase.from('group_orders').select('order_id').eq('id', id).single();
            if (group) {
                await supabase.from('orders').update({ status: 'paid' }).eq('id', group.order_id);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Pay Group Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
