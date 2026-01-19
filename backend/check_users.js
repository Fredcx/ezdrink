const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT email, password, establishment_role FROM users WHERE establishment_role IS NOT NULL", [], (err, rows) => {
    if (err) {
        throw err;
    }
    console.log("TEAM MEMBERS FOUND:");
    rows.forEach((row) => {
        console.log(`Login: ${row.email} | PIN: ${row.password} | Role: ${row.establishment_role}`);
    });
});
