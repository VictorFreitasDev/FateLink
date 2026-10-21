const pool = require('../config/db');

const messageRepository = {
  async findByConversation(conversaId) {
    const cleanId = typeof conversaId === 'string' ? parseInt(conversaId.replace('conv-', ''), 10) : conversaId;
    const result = await pool.query(
      'SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY criado_em ASC',
      [cleanId]
    );
    return result.rows;
  },

  async markAsRead(conversaId, currentUserId) {
    const cleanId = typeof conversaId === 'string' ? parseInt(conversaId.replace('conv-', ''), 10) : conversaId;
    await pool.query(
      'UPDATE mensagens SET lida = true WHERE conversa_id = $1 AND remetente_id != $2 AND lida = false',
      [cleanId, currentUserId]
    );
  },

  async create(conversaId, remetenteId, conteudo) {
    const cleanId = typeof conversaId === 'string' ? parseInt(conversaId.replace('conv-', ''), 10) : conversaId;
    const result = await pool.query(
      `INSERT INTO mensagens (conversa_id, remetente_id, conteudo, lida)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [cleanId, remetenteId, conteudo]
    );
    return result.rows[0];
  }
};

module.exports = messageRepository;
