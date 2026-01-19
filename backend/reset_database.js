const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const products = require('./products.json');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO CRÍTICO: .env não carregou as chaves do Supabase. Verifique o arquivo backend/.env.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetAndSeed() {
    console.log(`\n--- INICIANDO RESET NO BANCO: ${supabaseUrl} ---`);

    // 1. DELETE NON-ADMIN USERS
    console.log('\n1. Limpando usuários (exceto Admin)...');
    const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .neq('email', 'admin@ezdrink.com');

    if (deleteError) console.error('Erro ao deletar usuários:', deleteError);
    else console.log('✅ Usuários limpos.');

    // 2. ENSURE ADMIN EXISTS
    console.log('\n2. Garantindo conta Admin...');
    const { error: adminError } = await supabase
        .from('users')
        .upsert({
            full_name: 'Administrador EzDrink',
            email: 'admin@ezdrink.com',
            password: 'admin',
            user_type: 'admin',
            establishment_role: 'manager'
        }, { onConflict: 'email' });

    if (adminError) console.error('Erro no Admin:', adminError);
    else console.log('✅ Admin garantido (admin@ezdrink.com / admin).');

    // 3. SEED CATEGORIES
    console.log('\n3. Populando Categorias...');
    const categories = [
        { id: 1, name: 'Cervejas', slug: 'cervejas' },
        { id: 2, name: 'Drinks', slug: 'drinks' },
        { id: 3, name: 'Combos', slug: 'combos' },
        { id: 4, name: 'Destilados', slug: 'destilados' },
        { id: 5, name: 'Vinhos', slug: 'vinhos' },
        { id: 6, name: 'Sem Álcool', slug: 'sem-alcool' },
    ];

    for (const cat of categories) {
        const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'id' });
        if (error) console.error(`Erro cat ${cat.name}:`, error.message);
    }
    console.log('✅ Categorias populadas.');

    // 4. SEED PRODUCTS
    console.log('\n4. Populando Produtos...');
    for (const p of products) {
        const { error } = await supabase.from('products').upsert({
            id: p.id,
            name: p.name,
            price: p.price,
            image_url: p.image_url,
            category_id: p.category_id,
            is_popular: p.is_popular,
            created_at: p.created_at
        });
        if (error) console.error(`Erro prod ${p.name}:`, error.message);
    }
    console.log('✅ Produtos populados.');

    console.log('\n--- CONCLUÍDO COM SUCESSO ---');
}

resetAndSeed();
