import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const token = req.headers.get('authorization');
    if (!token) return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, icon, order_index } = body;

        const { data, error } = await supabase.from('menu_categories').insert([{
            name,
            icon,
            order_index
        }]).select();

        if (error) {
            console.error("Supabase Error:", error);
            return NextResponse.json({ error: error.message, details: error }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const token = req.headers.get('authorization');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        const { error } = await supabase.from('menu_categories').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
