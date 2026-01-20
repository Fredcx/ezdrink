
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Robust Env Var Fetching
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Try Service Role first, then fallback
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Helper to check key role
function getKeyRole(key: string): string {
    try {
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
        return payload.role || 'unknown';
    } catch (e) {
        return 'invalid_jwt';
    }
}

export async function POST(req: Request) {
    const token = req.headers.get('authorization');
    if (!token) return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });

    try {
        if (!supabaseUrl) throw new Error("Missing SUPABASE_URL Env Var");
        if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY Env Var");

        // Validate Key Role
        const keyRole = getKeyRole(supabaseServiceKey);
        if (keyRole !== 'service_role') {
            throw new Error(`Configuration Error: The available API Key has role '${keyRole}'. It MUST be 'service_role' to bypass RLS. Check Vercel Env Vars: SUPABASE_SERVICE_ROLE_KEY.`);
        }

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
        console.error("API Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const token = req.headers.get('authorization');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Validate Key Role
        const keyRole = getKeyRole(supabaseServiceKey);
        if (keyRole !== 'service_role') {
            throw new Error(`Configuration Error: Key role is '${keyRole}'. Must be 'service_role'.`);
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase.from('categories').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
