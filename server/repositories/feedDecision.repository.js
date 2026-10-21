const pool = require('../config/db');

const feedDecisionRepository = {
  async saveDecision({ usuarioId, tipoUsuario, targetId, targetTipo, decisao }) {
    const result = await pool.query(
      `INSERT INTO feed_decisoes (usuario_id, tipo_usuario, target_id, target_tipo, decisao)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_id, target_id, target_tipo)
       DO UPDATE SET decisao = EXCLUDED.decisao, criado_em = CURRENT_TIMESTAMP
       RETURNING *`,
      [usuarioId, tipoUsuario || 'aluno', targetId, targetTipo || 'vaga', decisao]
    );
    return result.rows[0];
  },

  async findUserDecisions(userId, targetTipo = null) {
    let query = 'SELECT target_id, decisao, target_tipo, criado_em FROM feed_decisoes WHERE usuario_id = $1';
    const params = [userId];
    if (targetTipo) {
      query += ' AND target_tipo = $2';
      params.push(targetTipo);
    }
    query += ' ORDER BY criado_em DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async undoLastDecision(userId, targetTipo = null) {
    let query = `
      DELETE FROM feed_decisoes
      WHERE id = (
        SELECT id FROM feed_decisoes
        WHERE usuario_id = $1
    `;
    const params = [userId];
    if (targetTipo) {
      query += ' AND target_tipo = $2';
      params.push(targetTipo);
    }
    query += ' ORDER BY criado_em DESC LIMIT 1) RETURNING *';

    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  async resetDecisions(userId, targetTipo = null) {
    if (targetTipo) {
      await pool.query('DELETE FROM feed_decisoes WHERE usuario_id = $1 AND target_tipo = $2', [userId, targetTipo]);
    } else {
      await pool.query('DELETE FROM feed_decisoes WHERE usuario_id = $1', [userId]);
    }
  }
};

module.exports = feedDecisionRepository;
