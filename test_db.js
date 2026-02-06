const mysql = require('mysql2');
require('dotenv').config();

console.log("Testing connection with settings:");
console.log(`HOST: ${process.env.DB_HOST || 'localhost'}`);
console.log(`USER: ${process.env.DB_USER || 'root'}`);
console.log(`PASS: ${process.env.DB_PASS ? '' : '(empty)'}`);
console.log(`DB:   ${process.env.DB_NAME || 'personal_finance_tracker'}`);

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'personal_finance_tracker'
});

connection.connect((err) => {
    if (err) {
        console.error('\n❌ CONNECTION FAILED: ' + err.message);
        console.log('\nTroubleshooting suggestions:');
        console.log('1. Is XAMPP / MySQL running?');
        console.log('2. Is the password correct in .env?');
        console.log('3. Does the database "personal_finance_tracker" exist?');
    } else {
        console.log('\n✅ CONNECTION SUCCESSFUL!');
        console.log('The database is ready to use.');
        connection.end();
    }
});
