const pool = require('../config/db');

const savedJobController = {
  async getSavedJobs(req, res) {
    try {
      const { userId } = req.params;
      const result = await pool.query(
        `SELECT o.* FROM vagas_salvas vs
         JOIN oportunidades o ON vs.vaga_id = o.id
         WHERE vs.usuario_id = $1
         ORDER BY vs.criado_em DESC`,
        [userId]
      );
      return res.json(result.rows);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar vagas salvas.' });
    }
  },

  async toggleSaveJob(req, res) {
    try {
      const { userId, vagaId } = req.body;
      const cleanVagaId = typeof vagaId === 'string' ? parseInt(vagaId.replace('opp-', ''), 10) : vagaId;

      const existing = await pool.query(
        'SELECT id FROM vagas_salvas WHERE usuario_id = $1 AND vaga_id = $2',
        [userId, cleanVagaId]
      );

      if (existing.rows.length > 0) {
        await pool.query('DELETE FROM vagas_salvas WHERE id = $1', [existing.rows[0].id]);
        return res.json({ success: true, saved: false });
      }

      await pool.query(
        'INSERT INTO vagas_salvas (usuario_id, vaga_id) VALUES ($1, $2)',
        [userId, cleanVagaId]
      );
      return res.json({ success: true, saved: true });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao salvar vaga.' });
    }
  }
};

module.exports = savedJobController;
