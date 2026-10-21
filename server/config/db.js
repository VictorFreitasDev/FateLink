const { Pool } = require('pg');

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl:
        process.env.PG_SSL === 'false'
          ? false
          : { rejectUnauthorized: false },
    }
  : {
      user: process.env.PG_USER || process.env.POSTGRES_USER || 'postgres',
      host: process.env.PG_HOST || process.env.POSTGRES_HOST || 'localhost',
      database: process.env.PG_DATABASE || process.env.POSTGRES_DATABASE || 'fatelinkBD',
      password: process.env.PG_PASSWORD || process.env.POSTGRES_PASSWORD || '123456',
      port: parseInt(process.env.PG_PORT || process.env.POSTGRES_PORT || '5432', 10),
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado com sucesso ao PostgreSQL (fatelinkBD)!');
    release();
  }
});

module.exports = pool;
