const dashboardService = require('../services/dashboard.service');

const dashboardController = {
  async getRecruiterDashboard(req, res) {
    try {
      const { empresaId } = req.params;
      const data = await dashboardService.getRecruiterDashboard(empresaId);
      return res.json(data);
    } catch (err) {
      console.error('Erro em GET /api/dashboard/recruiter:', err);
      return res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
    }
  }
};

module.exports = dashboardController;
