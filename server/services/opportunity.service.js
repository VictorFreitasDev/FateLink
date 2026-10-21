const opportunityRepository = require('../repositories/opportunity.repository');
const candidateRepository = require('../repositories/candidate.repository');
const { calculateMatch } = require('./matchEngine');

const opportunityService = {
  async getOpportunities(alunoId = null, empresaId = null, filters = {}) {
    let candidateData = null;
    if (alunoId) {
      candidateData = await candidateRepository.findByUserId(alunoId);
    }

    const rows = await opportunityRepository.findAll({
      empresaId,
      modalidade: filters.modalidade,
      tipo: filters.tipo,
      localizacao: filters.localizacao,
      area: filters.area,
      curso: filters.curso,
    });

    let mapped = rows.map((row) => {
      let score = row.match_score || 85;
      let explanations = ['Compatibilidade estimada com base na formação tecnológica FATEC.'];
      let breakdown = { competencias: 25, formacao: 15, experiencia: 10, disponibilidade: 15, localizacao: 15 };
      let matchedSkills = [];
      let missingSkills = [];
      let strengths = ['Oportunidade alinhada à formação em tecnologia.'];
      let improvements = [];
      let isBlocked = false;
      let blockReasons = [];
      let matchLevel = 'alto';

      if (candidateData) {
        const evalResult = calculateMatch(candidateData, row);
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
      }

      return {
        id: `opp-${row.id}`,
        dbId: row.id,
        empresaId: row.empresa_id,
        empresa: row.empresa_nome,
        nomeFantasia: row.nome_fantasia,
        cargo: row.cargo,
        area: row.area,
        cursoRelacionado: row.curso_relacionado || 'Geral',
        localizacao: row.localizacao,
        modalidade: row.modalidade,
        tipo: row.tipo,
        bolsa: row.bolsa,
        descricao: row.descricao,
        requisitos: row.requisitos || [],
        beneficios: row.beneficios || [],
        imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
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
        status: row.status || 'ativa',
        visualizacoes: row.visualizacoes || 0,
        inscritosCount: parseInt(row.inscritos_count || '0', 10),
        criadoEm: row.criado_em,
      };
    });

    // Filtro por compatibilidade mínima
    if (filters.minMatch && filters.minMatch > 0) {
      mapped = mapped.filter((opp) => opp.matchScore >= filters.minMatch);
    }

    // Filtro por competências exigidas
    if (filters.competencias && filters.competencias.length > 0) {
      const skillsNorm = filters.competencias.map((s) => s.toLowerCase().trim());
      mapped = mapped.filter((opp) => {
        const reqsNorm = (opp.requisitos || []).map((r) => r.toLowerCase());
        const descNorm = (opp.descricao || '').toLowerCase();
        return skillsNorm.some((skill) =>
          reqsNorm.some((r) => r.includes(skill) || skill.includes(r)) || descNorm.includes(skill)
        );
      });
    }

    // Filtro por faixa de bolsa mínima (ignora centavos após a vírgula)
    if (filters.minBolsa && filters.minBolsa > 0) {
      mapped = mapped.filter((opp) => {
        const clean = (opp.bolsa || '').split(',')[0].replace(/[^\d]/g, '');
        const val = clean ? parseInt(clean, 10) : 0;
        return val >= filters.minBolsa;
      });
    }

    // Ordenação (Relevância / Recente / Maior Bolsa)
    if (filters.sortBy === 'recente') {
      mapped.sort((a, b) => new Date(b.criadoEm || 0).getTime() - new Date(a.criadoEm || 0).getTime());
    } else if (filters.sortBy === 'maior_bolsa') {
      const extractVal = (str) => {
        const clean = (str || '').split(',')[0].replace(/[^\d]/g, '');
        return clean ? parseInt(clean, 10) : 0;
      };
      mapped.sort((a, b) => extractVal(b.bolsa) - extractVal(a.bolsa));
    } else {
      // Relevância (Maior Match Score primeiro)
      mapped.sort((a, b) => b.matchScore - a.matchScore);
    }

    return mapped;
  },

  async createOpportunity(payload) {
    const row = await opportunityRepository.create(payload);
    return {
      id: `opp-${row.id}`,
      dbId: row.id,
      empresaId: row.empresa_id,
      empresa: row.empresa_nome,
      nomeFantasia: row.nome_fantasia,
      cargo: row.cargo,
      area: row.area,
      cursoRelacionado: row.curso_relacionado || 'Geral',
      localizacao: row.localizacao,
      modalidade: row.modalidade,
      tipo: row.tipo,
      bolsa: row.bolsa,
      descricao: row.descricao,
      requisitos: row.requisitos || [],
      beneficios: row.beneficios || [],
      imagemUrl: row.imagem_url,
      matchScore: row.match_score || 95,
      status: row.status || 'ativa',
      criadoEm: row.criado_em,
    };
  },

  async updateOpportunity(id, payload) {
    const row = await opportunityRepository.update(id, payload);
    if (!row) {
      throw { status: 404, message: 'Oportunidade não encontrada para edição.' };
    }
    return {
      id: `opp-${row.id}`,
      dbId: row.id,
      empresaId: row.empresa_id,
      empresa: row.empresa_nome,
      nomeFantasia: row.nome_fantasia,
      cargo: row.cargo,
      area: row.area,
      cursoRelacionado: row.curso_relacionado || 'Geral',
      localizacao: row.localizacao,
      modalidade: row.modalidade,
      tipo: row.tipo,
      bolsa: row.bolsa,
      descricao: row.descricao,
      requisitos: row.requisitos || [],
      beneficios: row.beneficios || [],
      imagemUrl: row.imagem_url,
      status: row.status || 'ativa',
      inscritosCount: parseInt(row.inscritos_count || '0', 10),
      visualizacoes: row.visualizacoes || 0,
      criadoEm: row.criado_em,
    };
  },

  async updateStatus(id, status) {
    const opp = await opportunityRepository.updateStatus(id, status);
    if (!opp) {
      throw { status: 404, message: 'Oportunidade não encontrada.' };
    }
    return opp;
  },

  async deleteOpportunity(id, empresaId = null) {
    const deleted = await opportunityRepository.delete(id, empresaId);
    if (!deleted) {
      throw { status: 404, message: 'Oportunidade não encontrada ou já excluída.' };
    }
    return { success: true, message: 'Vaga excluída com sucesso.', id: deleted.id };
  },

  async recordView(id) {
    const views = await opportunityRepository.incrementViews(id);
    return { success: true, visualizacoes: views };
  },

  async getOpportunityApplicants(id) {
    const rows = await opportunityRepository.getApplicants(id);
    return rows.map((row) => ({
      id: row.id,
      alunoId: row.aluno_id,
      vagaId: row.vaga_id,
      status: row.status,
      mensagemApresentacao: row.mensagem_apresentacao,
      matchScoreMomento: row.match_score_momento,
      matchJustificativas: row.match_justificativas || [],
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      candidato: {
        id: `cand-${row.candidato_db_id || row.aluno_id}`,
        dbId: row.candidato_db_id || row.aluno_id,
        nome: row.nome || 'Estudante FATEC',
        idade: row.idade || 21,
        curso: row.curso || 'Tecnologia',
        semestre: row.semestre || '',
        unidadeFatec: row.unidade_fatec || 'Fatec Jales',
        previsaoFormacao: row.previsao_formacao || 'Dez/2026',
        localizacao: row.candidato_localizacao || row.unidade_fatec || 'São Paulo - SP',
        modalidadeDesejada: row.modalidade_desejada || 'Híbrido',
        portfolio: row.portfolio,
        competencias: row.competencias || [],
        disponibilidade: row.disponibilidade || 'Manhã',
        imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        github: row.github,
        linkedin: row.linkedin,
        sobre: row.sobre,
        curriculoUrl: row.curriculo_url,
        projetos: Array.isArray(row.projetos) ? row.projetos : [],
        experiencias: Array.isArray(row.experiencias) ? row.experiencias : [],
        certificacoes: Array.isArray(row.certificacoes) ? row.certificacoes : [],
        matchScore: row.match_score_momento || 85,
        usuarioId: row.usuario_id || row.aluno_id,
      },
      vaga: {
        id: `opp-${row.vaga_id}`,
        cargo: row.cargo,
        nomeFantasia: row.nome_fantasia,
      },
    }));
  }
};

module.exports = opportunityService;
