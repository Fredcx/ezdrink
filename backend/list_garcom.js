const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT id, full_name, email, establishment_role FROM users WHERE email LIKE '%garcom%'", [], (err, rows) => {
    if (err) throw err;
    console.log(`FOUND: ${rows.length}`);
    rows.forEach(row => {
        console.log(`[${row.id}] '${row.email}' (${row.full_name}) - Role: ${row.establishment_role}`);
    });
});
