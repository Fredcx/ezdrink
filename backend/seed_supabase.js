const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const products = require('./products.json');

const supabaseUrl = process.env.SUPABASE_URL || 'https://bnkijzgiyvieqourlhzl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2lqemdpeXZpZXFvdXJsaHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjcyMDQsImV4cCI6MjA4MzgwMzIwNH0.akBcInRwr1HcWauNSpgaEL1D-pQa3nZFA6Bu2PpyU2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting seed...');

    // 1. Seed Categories (Ensure IDs match products.json)
    const categories = [
        { id: 1, name: 'Cervejas', slug: 'cervejas' }, // inferred from "cerva"
        { id: 2, name: 'Drinks', slug: 'drinks' },
        { id: 3, name: 'Combos', slug: 'combos' }, // inferred from schema/common sense
        { id: 4, name: 'Destilados', slug: 'destilados' }, // inferred from "buchanaaas"
        { id: 5, name: 'Vinhos', slug: 'vinhos' },
        { id: 6, name: 'Sem Álcool', slug: 'sem-alcool' }, // inferred from "agua"
    ];

    console.log('Seeding Categories...');
    for (const cat of categories) {
        const { error } = await supabase
            .from('categories')
            .upsert(cat, { onConflict: 'id' }); // Force specific IDs

        if (error) console.error(`Error inserting category ${cat.name}:`, error);
    }

    // 2. Seed Products
    console.log('Seeding Products...');
    for (const p of products) {
        const { error } = await supabase
            .from('products')
            .upsert({
                id: p.id,
                name: p.name,
                price: p.price,
                image_url: p.image_url,
                category_id: p.category_id,
                is_popular: p.is_popular,
                created_at: p.created_at
            }); // Uses ID from JSON to prevent duplicates

        if (error) {
            console.error(`Error inserting product ${p.name}:`, error);
        } else {
            console.log(`Inserted: ${p.name}`);
        }
    }

    console.log('Seed completed!');
}

seed();
