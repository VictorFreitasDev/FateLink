const pool = require('../config/db');

const notificationRepository = {
  async findByUser(userId) {
    const result = await pool.query(
      'SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 40',
      [userId]
    );
    return result.rows;
  },

  async markAsRead(id) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('notif-', ''), 10) : id;
    const result = await pool.query(
      'UPDATE notificacoes SET lida = true WHERE id = $1 RETURNING *',
      [cleanId]
    );
    return result.rows[0] || null;
  },

  async markAllAsRead(userId) {
    const cleanId = parseInt(userId, 10);
    const result = await pool.query(
      'UPDATE notificacoes SET lida = true WHERE usuario_id = $1 AND lida = false RETURNING id',
      [cleanId]
    );
    return result.rows.length;
  },

  async create({ usuarioId, titulo, descricao, tipo, metadata }) {
    const cleanUserId = parseInt(usuarioId, 10);

    // Evita notificações duplicadas idênticas criadas nos últimos 3 minutos para o mesmo usuário
    const dupCheck = await pool.query(
      `SELECT id FROM notificacoes
       WHERE usuario_id = $1 AND tipo = $2 AND titulo = $3
         AND criado_em > NOW() - INTERVAL '3 minutes'
       LIMIT 1`,
      [cleanUserId, tipo || 'sistema', titulo]
    );
    if (dupCheck.rows.length > 0) {
      return dupCheck.rows[0];
    }

    const result = await pool.query(
      `INSERT INTO notificacoes (usuario_id, titulo, descricao, tipo, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cleanUserId, titulo, descricao, tipo || 'sistema', metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }
};

module.exports = notificationRepository;
