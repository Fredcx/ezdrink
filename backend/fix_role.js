const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.run("UPDATE users SET establishment_role = 'waiter' WHERE email LIKE '%garcom.teste.1234%'", function (err) {
    if (err) console.log(err);
    console.log(`UPDATED ${this.changes} ROWS`);
});
