const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT id, full_name, email, establishment_role FROM users", [], (err, rows) => {
    if (err) throw err;
    console.log(`TOTAL USERS: ${rows.length}`);
    rows.forEach(row => {
        console.log(`[${row.id}] '${row.email}' (${row.full_name}) - Role: ${row.establishment_role}`);
        // Check for 'garcom' variants
        if (row.email.includes('garcom')) {
            console.log(`   -> Email Chars: ${row.email.split('').map(c => c.charCodeAt(0)).join(',')}`);
        }
    });
});
