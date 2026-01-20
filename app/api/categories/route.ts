
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Robust Env Var Fetching
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(req: Request) {
    // 1. Check Auth presence
    const token = req.headers.get('authorization');
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });
    }

    try {
        if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
        if (!supabaseServiceKey) throw new Error("Missing SUPABASE_KEY (Service Role or Anon)");

        const body = await req.json();
        const { name, icon, order_index } = body;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase.from('categories').insert([{
            name,
            icon,
            order_index
        }]).select();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("API Error Debug:", {
            msg: error.message,
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseServiceKey,
            keyType: supabaseServiceKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE' : 'FALLBACK'
        });

        return NextResponse.json({
            error: error.message,
            debug: {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseServiceKey // Don't return the key itself
            }
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const token = req.headers.get('authorization');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        if (!supabaseUrl || !supabaseServiceKey) throw new Error("Configuration Error: Missing Supabase Keys");

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase.from('categories').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
