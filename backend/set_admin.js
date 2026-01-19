const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://bnkijzgiyvieqourlhzl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2lqemdpeXZpZXFvdXJsaHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjcyMDQsImV4cCI6MjA4MzgwMzIwNH0.akBcInRwr1HcWauNSpgaEL1D-pQa3nZFA6Bu2PpyU2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setAdmin() {
    const email = 'fredmourinho@gmail.com';
    console.log(`Setting admin role for: ${email}`);

    // Update establishment_role to 'admin'
    const { data, error } = await supabase
        .from('users')
        .update({ establishment_role: 'admin' })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Error updating user:', error);
    } else {
        console.log('Success! User updated:', data);
    }
}

setAdmin();
