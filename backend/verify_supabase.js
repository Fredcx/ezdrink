
const { createClient } = require('@supabase/supabase-js');

// Credentials from server.js
const supabaseUrl = 'https://bnkijzgiyvieqourlhzl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua2lqemdpeXZpZXFvdXJsaHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjcyMDQsImV4cCI6MjA4MzgwMzIwNH0.akBcInRwr1HcWauNSpgaEL1D-pQa3nZFA6Bu2PpyU2I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("Testando conexão...");
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error("❌ Erro ao conectar:", error.message);
        } else {
            console.log("✅ Conexão bem sucedida! Supabase respondeu.");
        }
    } catch (err) {
        console.error("❌ Erro inesperado:", err.message);
    }
}

testConnection();
