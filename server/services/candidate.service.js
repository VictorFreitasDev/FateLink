const fs = require('fs');
const path = require('path');
const candidateRepository = require('../repositories/candidate.repository');
const opportunityRepository = require('../repositories/opportunity.repository');
const userRepository = require('../repositories/user.repository');
const { calculateMatch } = require('./matchEngine');

const candidateService = {
  _formatCandidate(row) {
    if (!row) return null;
    return {
      id: `cand-${row.id}`,
      dbId: row.id,
      usuarioId: row.usuario_id,
      nome: row.nome,
      idade: row.idade,
      curso: row.curso,
      semestre: row.semestre,
      unidadeFatec: row.unidade_fatec,
      previsaoFormacao: row.previsao_formacao || 'Dezembro / 2026',
      localizacao: row.localizacao || 'Jales - SP',
      modalidadeDesejada: row.modalidade_desejada || 'Híbrido',
      portfolio: row.portfolio || '',
      sobre: row.sobre,
      competencias: row.competencias || [],
      disponibilidade: row.disponibilidade,
      imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      github: row.github || '',
      linkedin: row.linkedin || '',
      matchScore: row.match_score || 90,
      projetos: row.projetos || [],
      experiencias: row.experiencias || [],
      certificacoes: row.certificacoes || [],
      curriculoUrl: row.curriculo_url || null,
      criadoEm: row.criado_em,
    };
  },

  async getCandidates(filters = {}) {
    let targetOpportunity = null;
    if (filters.vagaId) {
      targetOpportunity = await opportunityRepository.findById(filters.vagaId);
    }

    const rows = await candidateRepository.findAll(filters);
    let mapped = rows.map((row) => {
      let score = row.match_score || 90;
      let explanations = ['Perfil com graduação tecnológica FATEC.'];
      let breakdown = { competencias: 25, formacao: 15, experiencia: 10, disponibilidade: 15, localizacao: 15 };
      let matchedSkills = [];
      let missingSkills = [];
      let strengths = ['Graduando FATEC com formação voltada para o mercado.'];
      let improvements = [];
      let isBlocked = false;
      let blockReasons = [];
      let matchLevel = 'alto';

      if (targetOpportunity) {
        const evalResult = calculateMatch(row, targetOpportunity);
        score = evalResult.score;
        explanations = evalResult.explanations;
        breakdown = evalResult.breakdown;
        matchedSkills = evalResult.matchedSkills;
        missingSkills = [...evalResult.missingMandatorySkills, ...evalResult.missingDesirableSkills];
        strengths = evalResult.strengths;
        improvements = evalResult.improvements;
        isBlocked = evalResult.isBlocked;
        blockReasons = evalResult.blockReasons;
        matchLevel = evalResult.nivel;
      } else {
        const evalResult = calculateMatch(row, null);
        score = Math.max(score, evalResult.score);
        explanations = evalResult.explanations.length > 0 ? evalResult.explanations : explanations;
        breakdown = evalResult.breakdown;
        matchedSkills = row.competencias || [];
        strengths = evalResult.strengths;
        improvements = evalResult.improvements;
        matchLevel = evalResult.nivel;
      }

      const formatted = this._formatCandidate(row);
      return {
        ...formatted,
        matchScore: score,
        matchExplanations: explanations,
        matchBreakdown: breakdown,
        matchedSkills,
        missingSkills,
        strengths,
        improvements,
        isBlocked,
        blockReasons,
        matchLevel,
      };
    });

    // Filtro por compatibilidade mínima
    if (filters.minMatch && filters.minMatch > 0) {
      mapped = mapped.filter((cand) => cand.matchScore >= filters.minMatch);
    }

    // Filtro por competências técnicas
    if (filters.competencias && filters.competencias.length > 0) {
      const skillsNorm = filters.competencias.map((s) => s.toLowerCase().trim());
      mapped = mapped.filter((cand) => {
        const candSkills = (cand.competencias || []).map((c) => c.toLowerCase());
        const sobreNorm = (cand.sobre || '').toLowerCase();
        return skillsNorm.some((skill) =>
          candSkills.some((c) => c.includes(skill) || skill.includes(c)) || sobreNorm.includes(skill)
        );
      });
    }

    // Ordenação (Relevância / Recente / Semestre mais avançado)
    if (filters.sortBy === 'recente') {
      mapped.sort((a, b) => new Date(b.criadoEm || 0).getTime() - new Date(a.criadoEm || 0).getTime());
    } else if (filters.sortBy === 'semestre') {
      const getSem = (str) => {
        const m = (str || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      };
      mapped.sort((a, b) => getSem(b.semestre) - getSem(a.semestre));
    } else {
      mapped.sort((a, b) => b.matchScore - a.matchScore);
    }

    return mapped;
  },

  async getProfileByUserId(userId) {
    let row = await candidateRepository.findByUserId(userId);
    if (!row) {
      const user = await userRepository.findById(userId);
      if (user) {
        row = await candidateRepository.create({
          usuarioId: user.id,
          nome: user.nome,
          curso: user.curso_ou_ramo || 'Análise e Desenvolvimento de Sistemas',
          imagemUrl: user.imagem_url,
          sobre: 'Estudante FATEC dedicado a novos desafios.',
        });
      }
    }
    return this._formatCandidate(row);
  },

  async updateProfileByUserId(userId, data) {
    const updated = await candidateRepository.upsertByUserId(userId, data);
    return this._formatCandidate(updated);
  },

  async uploadResume(userId, { fileName, fileBase64, base64 }) {
    const rawBase64 = fileBase64 || base64;
    if (!rawBase64) {
      throw new Error('Arquivo de currículo em base64 não fornecido.');
    }

    const cleanBase64 = rawBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = `curriculo_${userId}_${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/resumes/${safeName}`;
    const updated = await candidateRepository.updateResumeUrl(userId, relativeUrl);
    return {
      success: true,
      curriculoUrl: relativeUrl,
      fileName: fileName || safeName,
      candidato: this._formatCandidate(updated),
    };
  },

  async deleteResume(userId) {
    const candidate = await candidateRepository.findByUserId(userId);
    if (candidate && candidate.curriculo_url) {
      const fullPath = path.join(__dirname, '..', candidate.curriculo_url);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn('Erro ao remover arquivo físico do currículo:', e);
        }
      }
    }
    const updated = await candidateRepository.deleteResume(userId);
    return {
      success: true,
      candidato: this._formatCandidate(updated),
    };
  },

  async createCandidate(payload) {
    const row = await candidateRepository.create(payload);
    return this._formatCandidate(row);
  },
};

module.exports = candidateService;
