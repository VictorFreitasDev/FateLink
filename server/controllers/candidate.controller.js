const candidateService = require('../services/candidate.service');

const candidateController = {
  async getAll(req, res) {
    try {
      const {
        curso,
        unidadeFatec,
        disponibilidade,
        semestre,
        minMatch,
        sortBy,
        competencias,
        vagaId,
      } = req.query;

      const filters = {
        curso,
        unidadeFatec,
        disponibilidade,
        semestre,
        minMatch: minMatch ? parseInt(minMatch, 10) : undefined,
        sortBy,
        competencias: competencias ? (Array.isArray(competencias) ? competencias : competencias.split(',')) : undefined,
        vagaId: vagaId ? parseInt(vagaId, 10) : undefined,
      };

      const candidates = await candidateService.getCandidates(filters);
      return res.json(candidates);
    } catch (err) {
      console.error('Erro em GET /api/candidates:', err);
      return res.status(500).json({ error: 'Erro ao buscar candidatos.' });
    }
  },

  async getProfile(req, res) {
    try {
      const { userId } = req.params;
      const profile = await candidateService.getProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ error: 'Perfil do estudante não encontrado.' });
      }
      return res.json(profile);
    } catch (err) {
      console.error('Erro em GET /api/candidates/profile/:userId:', err);
      return res.status(500).json({ error: 'Erro ao buscar perfil do estudante.' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { userId } = req.params;
      const profile = await candidateService.updateProfileByUserId(userId, req.body);
      return res.json(profile);
    } catch (err) {
      console.error('Erro em PUT /api/candidates/profile/:userId:', err);
      return res.status(500).json({ error: 'Erro ao atualizar perfil do estudante no banco.' });
    }
  },

  async uploadResume(req, res) {
    try {
      const { userId } = req.params;
      const result = await candidateService.uploadResume(userId, req.body);
      return res.json(result);
    } catch (err) {
      console.error('Erro em POST /api/candidates/profile/:userId/resume:', err);
      return res.status(500).json({ error: err.message || 'Erro ao fazer upload do currículo em PDF.' });
    }
  },

  async deleteResume(req, res) {
    try {
      const { userId } = req.params;
      const result = await candidateService.deleteResume(userId);
      return res.json(result);
    } catch (err) {
      console.error('Erro em DELETE /api/candidates/profile/:userId/resume:', err);
      return res.status(500).json({ error: 'Erro ao remover currículo em PDF.' });
    }
  },

  async create(req, res) {
    try {
      const { nome } = req.body || {};
      if (!nome || !nome.trim()) {
        return res.status(400).json({ error: 'Nome do candidato é obrigatório.' });
      }

      const candidate = await candidateService.createCandidate(req.body);
      return res.status(201).json(candidate);
    } catch (err) {
      console.error('Erro em POST /api/candidates:', err);
      return res.status(500).json({ error: 'Erro ao cadastrar currículo no banco de dados.' });
    }
  }
};

module.exports = candidateController;
