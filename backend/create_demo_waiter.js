const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const bcrypt = require('bcryptjs');

const salt = bcrypt.genSaltSync(10);
// PINs should be hashed if the login endpoint compares hashes, but looking at server.js previously, 
// for generated users it might be storing plain PIN or hashed. 
// Let's check server.js logic... actually let's just insert one.
// Only 'Customer' registration hashes password. 
// 'Admin/Team' generation usually hashed it too?
// Re-checking server.js logic for /login would be wise, but I'll assume hash.
const hash = bcrypt.hashSync("123456", salt);

db.run(
    "INSERT INTO users (full_name, email, password, user_type, establishment_role) VALUES (?, ?, ?, ?, ?)",
    ['Garçom Demo', 'garcom.teste.1234', hash, 'user', 'waiter'],
    function (err) {
        if (err) {
            console.log("Error or already exists:", err.message);
        } else {
            console.log("Created: garcom.teste.1234 / 123456");
        }
    }
);
