const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.get("SELECT email, user_type, establishment_role FROM users WHERE email = 'garcom.teste.1234'", [], (err, row) => {
    if (err) throw err;
    console.log("USER DATA:", row);
});
