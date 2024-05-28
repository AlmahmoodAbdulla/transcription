const { Pool } = require('pg');
const path = require('path');
const cert = path.join(process.cwd(), 'src/utils/me-south-1-bundle.pem');
// console.log("Cert: ", cert)
// Create a new pool instance and pass configuration parameters from environment variables
const pool = new Pool({
    connectionString: `postgres://almahmood:3js9WVne3FKjY5@almahmood.cfcus2q68y68.me-south-1.rds.amazonaws.com:5432/almahmood_online_store?sslmode=require&sslrootcert=${cert}`, // This should be your PostgreSQL connection string
    ssl: {
        rejectUnauthorized: false // This is important for some hosted environments like Heroku
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};