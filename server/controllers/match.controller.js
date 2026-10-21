const matchService = require('../services/match.service');

const matchController = {
  async getMatches(req, res) {
    try {
      const { userId } = req.params;
      const data = await matchService.getMatches(userId);
      return res.json(data);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao buscar matches.' });
    }
  }
};

module.exports = matchController;
