
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to check key role
function getKeyRole(key: string): string {
    try {
        const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
        return payload.role || 'unknown';
    } catch (e) {
        return 'invalid_jwt';
    }
}

// Robust Env Var Fetching with FS Fallback (for local dev without restart)
function getServiceConfig() {
    let url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    let key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fallback: Try reading .env.local directly if key is missing
    if (!key || !url) {
        try {
            const envPath = path.join(process.cwd(), '.env.local');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const lines = envContent.split('\n');
                for (const line of lines) {
                    const match = line.match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const k = match[1].trim();
                        const v = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                        if (k === 'SUPABASE_SERVICE_ROLE_KEY' && !key) key = v;
                        if (k === 'SUPABASE_URL' && !url) url = v;
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to read .env.local fallback:", e);
        }
    }

    return { supabaseUrl: url || "", supabaseServiceKey: key };
}

export async function POST(req: Request) {
    const token = req.headers.get('authorization');
    if (!token) return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });

    try {
        const { supabaseUrl, supabaseServiceKey } = getServiceConfig();

        if (!supabaseUrl) throw new Error("Missing SUPABASE_URL Env Var");

        // Check if variable exists at all
        if (!supabaseServiceKey) {
            const availableKeys = Object.keys(process.env)
                .filter(k => k.startsWith('SUPABASE') || k.startsWith('NEXT_PUBLIC_SUPABASE'))
                .join(', ');
            throw new Error(`Missing Env Var: SUPABASE_SERVICE_ROLE_KEY is undefined. Available keys on server: [${availableKeys}]. Check Vercel Settings > Environment Variables.`);
        }

        // Check if variable is valid (Service Role)
        const keyRole = getKeyRole(supabaseServiceKey);
        if (keyRole !== 'service_role') {
            throw new Error(`Configuration Error: SUPABASE_SERVICE_ROLE_KEY is set, but contains an '${keyRole}' key. It MUST be the 'service_role' (Secret) key.`);
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
        const { supabaseUrl, supabaseServiceKey } = getServiceConfig();

        if (!supabaseUrl) throw new Error("Missing URL");
        if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

        const keyRole = getKeyRole(supabaseServiceKey);
        if (keyRole !== 'service_role') {
            throw new Error(`Invalid Key Role: ${keyRole}`);
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
