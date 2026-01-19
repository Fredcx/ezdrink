const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the exact same config as server.js
const supabaseUrl = process.env.SUPABASE_URL || 'https://bnkijzgiyvieqourlhzl.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2lqemdpeXZpZXFvdXJsaHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjcyMDQsImV4cCI6MjA4MzgwMzIwNH0.akBcInRwr1HcWauNSpgaEL1D-pQa3nZFA6Bu2PpyU2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log(`Checked URL: ${supabaseUrl}`);

    // 1. Check Users Table
    const { data: users, error } = await supabase.from('users').select('*');

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log(`Found ${users.length} users in 'public.users' table.`);
        console.log(users);
    }

    // 2. Check Auth Users (if used, but we are using custom table)
    // const { data: authUsers } = await supabase.auth.admin.listUsers();
    // console.log(`Found ${authUsers?.users?.length || 0} users in Supabase Auth.`);
}

check();
