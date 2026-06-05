const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('connect', () => {
    console.log('✅ Conectado correctamente a la base de datos Neon PostgreSQL');
});

pool.on('error', (error) => {
    console.error('❌ Error inesperado en la conexión a PostgreSQL:', error);
});

module.exports = pool;