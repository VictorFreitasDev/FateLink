const feedService = require('../services/feed.service');

const feedController = {
  async recordDecision(req, res) {
    try {
      const { usuarioId, tipoUsuario, targetId, targetTipo, decisao } = req.body;
      if (!usuarioId || !targetId || !decisao) {
        return res.status(400).json({ error: 'usuarioId, targetId e decisao são obrigatórios.' });
      }

      const result = await feedService.recordDecision(
        usuarioId,
        tipoUsuario,
        targetId,
        targetTipo,
        decisao
      );
      return res.json(result);
    } catch (err) {
      console.error('Erro ao salvar decisão de swipe:', err);
      return res.status(500).json({ error: 'Erro ao registrar decisão de swipe: ' + (err.message || err) });
    }
  },

  async getUserDecisions(req, res) {
    try {
      const { userId } = req.params;
      const { targetTipo } = req.query;
      const decisions = await feedService.getUserDecisions(userId, targetTipo);
      return res.json(decisions);
    } catch (err) {
      console.error('Erro em GET /api/feed/decisions:', err);
      return res.status(500).json({ error: 'Erro ao buscar decisões anteriores.' });
    }
  },

  async undoDecision(req, res) {
    try {
      const { usuarioId, targetTipo } = req.body;
      if (!usuarioId) {
        return res.status(400).json({ error: 'usuarioId é obrigatório.' });
      }

      const undone = await feedService.undoDecision(usuarioId, targetTipo);
      return res.json({ success: true, undone });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao desfazer ação.' });
    }
  },

  async resetFeed(req, res) {
    try {
      const { usuarioId, targetTipo } = req.body;
      if (!usuarioId) {
        return res.status(400).json({ error: 'usuarioId é obrigatório.' });
      }

      await feedService.resetFeed(usuarioId, targetTipo);
      return res.json({ success: true, message: 'Recomendações do feed redefinidas com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao resetar feed.' });
    }
  }
};

module.exports = feedController;
