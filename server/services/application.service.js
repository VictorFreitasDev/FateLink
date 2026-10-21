const applicationRepository = require('../repositories/application.repository');
const opportunityRepository = require('../repositories/opportunity.repository');
const candidateRepository = require('../repositories/candidate.repository');
const notificationRepository = require('../repositories/notification.repository');
const { calculateMatch } = require('./matchEngine');

const applicationService = {
  async apply(alunoId, vagaId, mensagemApresentacao) {
    const cleanVagaId = typeof vagaId === 'string' ? parseInt(vagaId.replace('opp-', ''), 10) : vagaId;

    const existing = await applicationRepository.findExisting(alunoId, cleanVagaId);
    if (existing) {
      throw { status: 409, message: 'Você já se candidatou a esta vaga.', application: existing };
    }

    const vaga = await opportunityRepository.findById(cleanVagaId);
    if (!vaga) {
      throw { status: 404, message: 'Vaga não encontrada.' };
    }

    const candidato = await candidateRepository.findByUserId(alunoId);
    const matchEval = calculateMatch(candidato, vaga);

    const newApp = await applicationRepository.create({
      alunoId,
      candidatoId: candidato ? candidato.id : null,
      vagaId: cleanVagaId,
      mensagem: mensagemApresentacao,
      matchScoreMomento: matchEval.score,
      matchJustificativas: matchEval.explanations,
    });

    await applicationRepository.addHistory(
      newApp.id,
      null,
      'enviada',
      'Candidatura submetida pelo estudante.',
      alunoId
    );

    if (vaga.empresa_id) {
      await notificationRepository.create({
        usuarioId: vaga.empresa_id,
        titulo: 'Nova Candidatura Recebida! 🚀',
        descricao: `${candidato ? candidato.nome : 'Um estudante'} candidatou-se para a vaga de "${vaga.cargo}". Compatibilidade: ${matchEval.score}%.`,
        tipo: 'candidatura',
        metadata: { candidaturaId: newApp.id, vagaId: cleanVagaId, alunoId },
      });
    }

    return {
      id: newApp.id,
      alunoId: newApp.aluno_id,
      vagaId: newApp.vaga_id,
      status: newApp.status,
      matchScoreMomento: newApp.match_score_momento,
      matchJustificativas: newApp.match_justificativas,
      criadoEm: newApp.criado_em,
    };
  },

  async getStudentApplications(alunoId) {
    const rows = await applicationRepository.findByStudent(alunoId);
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
      vaga: {
        id: `opp-${row.vaga_id}`,
        dbId: row.vaga_id,
        empresaId: row.empresa_id,
        cargo: row.cargo,
        empresa: row.empresa_nome,
        nomeFantasia: row.nome_fantasia,
        modalidade: row.modalidade,
        bolsa: row.bolsa,
        localizacao: row.localizacao,
        imagemUrl: row.imagem_url,
      },
    }));
  },

  async getCompanyApplications(empresaId) {
    const rows = await applicationRepository.findByCompany(empresaId);
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
        unidadeFatec: row.unidade_fatec || 'Fatec',
        previsaoFormacao: row.previsao_formacao || 'Dez/2026',
        localizacao: row.candidato_localizacao || row.unidade_fatec || 'São Paulo - SP',
        modalidadeDesejada: row.modalidade_desejada || 'Híbrido',
        portfolio: row.portfolio,
        competencias: row.competencias || [],
        disponibilidade: row.disponibilidade || 'Manhã',
        imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        github: row.github,
        linkedin: row.linkedin,
        sobre: row.sobre || 'Estudante FATEC dedicado.',
        curriculoUrl: row.curriculo_url,
        projetos: Array.isArray(row.projetos) ? row.projetos : [],
        experiencias: Array.isArray(row.experiencias) ? row.experiencias : [],
        certificacoes: Array.isArray(row.certificacoes) ? row.certificacoes : [],
        matchScore: row.match_score_momento || 85,
        usuarioId: row.aluno_id,
      },
      vaga: {
        id: `opp-${row.vaga_id}`,
        dbId: row.vaga_id,
        cargo: row.cargo,
        nomeFantasia: row.nome_fantasia,
        empresaId: row.empresa_id,
        localizacao: row.vaga_localizacao,
        modalidade: row.vaga_modalidade,
        bolsa: row.vaga_bolsa,
      },
    }));
  },

  async getApplicationHistory(candidaturaId) {
    return await applicationRepository.getHistory(candidaturaId);
  },

  async updateStatus(id, status, motivo, alteradoPor) {
    const currentApp = await applicationRepository.findById(id);
    if (!currentApp) {
      throw { status: 404, message: 'Candidatura não encontrada.' };
    }

    const statusAnterior = currentApp.status;
    const updated = await applicationRepository.updateStatus(id, status);

    await applicationRepository.addHistory(
      id,
      statusAnterior,
      status,
      motivo || `Status atualizado para ${status}`,
      alteradoPor || null
    );

    const vaga = await opportunityRepository.findById(currentApp.vaga_id);
    const statusLabels = {
      nova: 'Candidatura recebida pela empresa.',
      enviada: 'Candidatura recebida pela empresa.',
      em_analise: 'Seu perfil está em análise!',
      selecionado: 'Parabéns! Seu perfil foi selecionado para a próxima etapa!',
      entrevista: 'Parabéns! Você foi convidado para uma entrevista!',
      proposta: 'Você recebeu uma proposta formal de contratação! 🎉',
      contratado: 'Contratação confirmada! Bem-vindo(a) ao time! 🏆',
      recusada: 'Atualização sobre o processo seletivo.',
      recusado: 'Atualização sobre o processo seletivo.',
      encerrado: 'Processo seletivo encerrado.',
      desistente: 'Candidatura encerrada.',
    };

    await notificationRepository.create({
      usuarioId: currentApp.aluno_id,
      titulo: statusLabels[status] || 'Atualização na sua candidatura',
      descricao: `A empresa ${vaga ? vaga.nome_fantasia : 'recrutadora'} atualizou a etapa da vaga "${vaga ? vaga.cargo : ''}" para: ${status.toUpperCase()}.`,
      tipo: 'status',
      metadata: { candidaturaId: id, statusNovo: status },
    });

    return updated;
  }
};

module.exports = applicationService;
