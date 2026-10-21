const opportunityService = require('../services/opportunity.service');
const opportunityValidator = require('../validators/opportunity.validator');

const opportunityController = {
  async getAll(req, res) {
    try {
      const {
        alunoId,
        empresaId,
        curso,
        area,
        modalidade,
        tipo,
        localizacao,
        minBolsa,
        minMatch,
        sortBy,
        competencias,
      } = req.query;

      const filters = {
        curso,
        area,
        modalidade,
        tipo,
        localizacao,
        minBolsa: minBolsa ? parseInt(minBolsa, 10) : undefined,
        minMatch: minMatch ? parseInt(minMatch, 10) : undefined,
        sortBy,
        competencias: competencias ? (Array.isArray(competencias) ? competencias : competencias.split(',')) : undefined,
      };

      const list = await opportunityService.getOpportunities(alunoId, empresaId, filters);
      return res.json(list);
    } catch (err) {
      console.error('Erro em GET /api/opportunities:', err);
      return res.status(500).json({ error: 'Erro ao buscar oportunidades.' });
    }
  },

  async create(req, res) {
    try {
      const error = opportunityValidator.validateCreate(req.body);
      if (error) {
        return res.status(400).json({ error });
      }

      const opp = await opportunityService.createOpportunity(req.body);
      return res.status(201).json(opp);
    } catch (err) {
      console.error('Erro em POST /api/opportunities:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar vaga no banco de dados.' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const opp = await opportunityService.updateOpportunity(id, req.body);
      return res.json(opp);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao atualizar oportunidade.' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const err = opportunityValidator.validateStatus(status);
      if (err) {
        return res.status(400).json({ error: err });
      }

      const opp = await opportunityService.updateStatus(id, status);
      return res.json({ success: true, opportunity: opp });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao atualizar status da vaga.' });
    }
  },

  async getApplicants(req, res) {
    try {
      const { id } = req.params;
      const candidates = await opportunityService.getOpportunityApplicants(id);
      return res.json(candidates);
    } catch (err) {
      console.error('Erro em GET /api/opportunities/:id/candidates:', err);
      return res.status(500).json({ error: 'Erro ao buscar candidatos da vaga.' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { empresaId } = req.query;
      const result = await opportunityService.deleteOpportunity(id, empresaId);
      return res.json(result);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao excluir oportunidade.' });
    }
  },

  async recordView(req, res) {
    try {
      const { id } = req.params;
      const result = await opportunityService.recordView(id);
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao registrar visualização.' });
    }
  }
};

module.exports = opportunityController;
