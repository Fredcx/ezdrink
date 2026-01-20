
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ezdrink_secure_jwt_secret_dev';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, otp } = body;

        // Login with OTP
        if (otp) {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
            }

            if (user.otp === otp) {
                // Clear OTP
                await supabase.from('users').update({ otp: null }).eq('id', user.id);

                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
                return NextResponse.json({ token, user });
            } else {
                return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
            }
        }

        // Login with Password (PIN)
        if (email && password) {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
            }

            // Simple hash verification (In production use bcrypt)
            // Assuming legacy backend used simple hash
            const hash = crypto.createHash('sha256').update(password).digest('hex');

            // Handle legacy or direct comparison if PIN is plain (Waiters)
            // Let's assume waiters use PIN stored as text or hash. 
            // Checking both for compatibility during migration
            const isMatch = user.password === hash || user.password === password;

            if (isMatch) {
                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
                return NextResponse.json({ token, user });
            } else {
                return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
            }
        }

        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

    } catch (error) {
        console.error("Auth Error:", error);
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
