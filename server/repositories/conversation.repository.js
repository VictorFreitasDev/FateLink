const pool = require('../config/db');

const conversationRepository = {
  async findByUser(userId) {
    const result = await pool.query(
      `SELECT c.*,
              u1.nome as aluno_nome, u1.email as aluno_email, u1.imagem_url as aluno_imagem,
              u2.nome as empresa_nome, u2.email as empresa_email, u2.imagem_url as empresa_imagem,
              o.cargo as vaga_cargo,
              (SELECT COUNT(*) FROM mensagens m WHERE m.conversa_id = c.id AND m.remetente_id != $1 AND m.lida = false) as unread_count
       FROM conversas c
       JOIN usuarios u1 ON c.participante_aluno_id = u1.id
       JOIN usuarios u2 ON c.participante_empresa_id = u2.id
       LEFT JOIN oportunidades o ON c.vaga_id = o.id
       WHERE c.participante_aluno_id = $1 OR c.participante_empresa_id = $1
       ORDER BY c.ultima_mensagem_em DESC`,
      [userId]
    );
    return result.rows;
  },

  async findBetweenUsers(userId1, userId2, vagaId = null) {
    let query = `SELECT * FROM conversas
       WHERE ((participante_aluno_id = $1 AND participante_empresa_id = $2)
          OR (participante_aluno_id = $2 AND participante_empresa_id = $1))`;
    const params = [userId1, userId2];
    if (vagaId) {
      params.push(vagaId);
      query += ` AND vaga_id = $3`;
    }
    query += ` ORDER BY ultima_mensagem_em DESC LIMIT 1`;
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  async findById(id) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('conv-', ''), 10) : id;
    const result = await pool.query('SELECT * FROM conversas WHERE id = $1', [cleanId]);
    return result.rows[0] || null;
  },

  async create(alunoId, empresaId, vagaId = null) {
    const result = await pool.query(
      `INSERT INTO conversas (participante_aluno_id, participante_empresa_id, vaga_id, ultima_mensagem)
       VALUES ($1, $2, $3, 'Conversa iniciada!')
       RETURNING *`,
      [alunoId, empresaId, vagaId]
    );
    return result.rows[0];
  },

  async updateLastMessage(id, text) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('conv-', ''), 10) : id;
    await pool.query(
      `UPDATE conversas
       SET ultima_mensagem = $1, ultima_mensagem_em = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [text, cleanId]
    );
  }
};

module.exports = conversationRepository;
