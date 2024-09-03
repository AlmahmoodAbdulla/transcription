const { Pool } = require('pg');
const path = require('path');

const cert = path.join(process.cwd(), 'src/utils/me-south-1-bundle.pem');

const pool = new Pool({
    connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require&sslrootcert=${cert}`,
    ssl: {
        rejectUnauthorized: true,
    },
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};