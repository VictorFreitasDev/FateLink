const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'fatelinkBD',
  password: process.env.PG_PASSWORD || '123456',
  port: parseInt(process.env.PG_PORT || '5432', 10),
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL fatelinkBD:', err.message);
  } else {
    console.log('✅ Conectado com sucesso ao PostgreSQL (fatelinkBD)!');
    release();
  }
});

module.exports = pool;
