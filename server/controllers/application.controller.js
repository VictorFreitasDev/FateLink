const applicationService = require('../services/application.service');
const applicationValidator = require('../validators/application.validator');

const applicationController = {
  async apply(req, res) {
    try {
      const err = applicationValidator.validateCreate(req.body);
      if (err) {
        return res.status(400).json({ error: err });
      }

      const { alunoId, vagaId, mensagemApresentacao } = req.body;
      const application = await applicationService.apply(alunoId, vagaId, mensagemApresentacao);
      return res.status(201).json({
        success: true,
        message: 'Candidatura enviada com sucesso!',
        application,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({
        error: err.message || 'Erro ao processar candidatura.',
        application: err.application,
      });
    }
  },

  async getStudentApplications(req, res) {
    try {
      const { alunoId } = req.params;
      const apps = await applicationService.getStudentApplications(alunoId);
      return res.json(apps);
    } catch (err) {
      console.error('Erro em GET /api/applications/student:', err);
      return res.status(500).json({ error: 'Erro ao buscar candidaturas do estudante.' });
    }
  },

  async getCompanyApplications(req, res) {
    try {
      const { empresaId } = req.params;
      const apps = await applicationService.getCompanyApplications(empresaId);
      return res.json(apps);
    } catch (err) {
      console.error('Erro em GET /api/applications/company:', err);
      return res.status(500).json({ error: 'Erro ao buscar candidaturas da empresa.' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, motivo, alteradoPor } = req.body;

      const err = applicationValidator.validateStatusUpdate(status);
      if (err) {
        return res.status(400).json({ error: err });
      }

      const updated = await applicationService.updateStatus(id, status, motivo, alteradoPor);
      return res.json({
        success: true,
        message: `Etapa da candidatura alterada com sucesso para ${status}.`,
        application: updated,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao atualizar status.' });
    }
  },

  async getHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await applicationService.getApplicationHistory(id);
      return res.json(history);
    } catch (err) {
      console.error('Erro em GET /api/applications/:id/history:', err);
      return res.status(500).json({ error: 'Erro ao buscar histórico da candidatura.' });
    }
  }
};

module.exports = applicationController;
