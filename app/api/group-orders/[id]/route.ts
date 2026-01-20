
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/group-orders/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { data, error } = await supabase
            .from('group_orders')
            .select(`
                *,
                group_order_members (*)
            `)
            .eq('id', id)
            .single();

        if (error) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
