
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Products List Error:", error);
        return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
    }
}
