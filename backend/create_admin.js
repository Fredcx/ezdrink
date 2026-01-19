
const { createClient } = require('@supabase/supabase-js');

// Credentials from server.js
const supabaseUrl = 'https://bnkijzgiyvieqourlhzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2lqemdpeXZpZXFvdXJsaHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjcyMDQsImV4cCI6MjA4MzgwMzIwNH0.akBcInRwr1HcWauNSpgaEL1D-pQa3nZFA6Bu2PpyU2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    console.log("Criando usuário admin...");

    const email = 'admin@ezdrink.com';
    const password = 'admin'; // Simples para teste

    // 1. Check if exists
    const { data: existing } = await supabase.from('users').select('*').eq('email', email).single();

    if (existing) {
        console.log("⚠️ Usuário admin já existe. Atualizando permissões...");
        const { error } = await supabase.from('users').update({
            user_type: 'admin',
            establishment_role: 'manager',
            password: 'admin' // Force reset password to 'admin'
        }).eq('id', existing.id);

        if (error) console.error("Erro ao atualizar:", error.message);
        else console.log("✅ Permissões de admin garantidas!");
        return;
    }

    // 2. Create if new
    const { data, error } = await supabase.from('users').insert({
        full_name: 'Administrador EzDrink',
        email: email,
        password: password,
        user_type: 'admin',
        establishment_role: 'manager'
    });

    if (error) {
        console.error("❌ Erro ao criar:", error.message);
    } else {
        console.log("✅ Usuário Admin criado com sucesso!");
        console.log(`Login: ${email}`);
        console.log(`Senha: ${password}`);
    }
}

createAdmin();
