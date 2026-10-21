const interviewRepository = require('../repositories/interview.repository');
const applicationRepository = require('../repositories/application.repository');
const notificationRepository = require('../repositories/notification.repository');
const opportunityRepository = require('../repositories/opportunity.repository');
const userRepository = require('../repositories/user.repository');

const interviewService = {
  async proposeInterview({ candidaturaId, empresaId, formato, linkOuLocal, horariosPropostos, observacoes }) {
    const cleanCandId = parseInt(candidaturaId, 10);
    const cleanEmpresaId = parseInt(empresaId, 10);

    const app = await applicationRepository.findById(cleanCandId);
    if (!app) {
      throw { status: 404, message: 'Candidatura não encontrada.' };
    }

    const vaga = await opportunityRepository.findById(app.vaga_id);
    if (!vaga) {
      throw { status: 404, message: 'Vaga vinculada não encontrada.' };
    }

    if (vaga.empresa_id !== cleanEmpresaId) {
      throw { status: 403, message: 'Apenas a empresa dona da vaga pode agendar entrevista.' };
    }

    if (!Array.isArray(horariosPropostos) || horariosPropostos.length === 0) {
      throw { status: 400, message: 'Ao menos uma opção de horário deve ser informada.' };
    }

    // Cria a proposta de entrevista
    const interview = await interviewRepository.create({
      candidaturaId: cleanCandId,
      empresaId: cleanEmpresaId,
      alunoId: app.aluno_id,
      vagaId: app.vaga_id,
      formato,
      linkOuLocal,
      horariosPropostos,
      observacoes,
    });

    // Atualiza status da candidatura para 'entrevista' caso ainda não esteja
    if (app.status !== 'entrevista') {
      await applicationRepository.updateStatus(cleanCandId, 'entrevista');
      await applicationRepository.addHistory(
        cleanCandId,
        app.status,
        'entrevista',
        `Convite de entrevista enviado com ${horariosPropostos.length} opções de horário.`,
        cleanEmpresaId
      );
    }

    // Cria notificação real para o estudante
    const empresaUser = await userRepository.findById(cleanEmpresaId);
    const empresaNome = empresaUser ? empresaUser.nome : vaga.nome_fantasia || 'Empresa';

    await notificationRepository.create({
      usuarioId: app.aluno_id,
      titulo: 'Convite para Entrevista! 🎯',
      descricao: `A empresa ${empresaNome} convidou você para entrevista na vaga "${vaga.cargo}". Escolha o melhor horário!`,
      tipo: 'entrevista',
      metadata: {
        entrevistaId: interview.id,
        candidaturaId: cleanCandId,
        vagaId: app.vaga_id,
        horariosPropostos,
      },
    });

    return interview;
  },

  async confirmInterview(interviewId, alunoId, horarioEscolhido) {
    const cleanId = parseInt(interviewId, 10);
    const cleanAlunoId = parseInt(alunoId, 10);

    const interview = await interviewRepository.findById(cleanId);
    if (!interview) {
      throw { status: 404, message: 'Agendamento de entrevista não encontrado.' };
    }

    if (interview.aluno_id !== cleanAlunoId) {
      throw { status: 403, message: 'Apenas o candidato pode confirmar este horário.' };
    }

    if (!horarioEscolhido || !horarioEscolhido.trim()) {
      throw { status: 400, message: 'É obrigatório selecionar um dos horários propostos.' };
    }

    const updated = await interviewRepository.confirmSchedule(cleanId, horarioEscolhido.trim());

    // Registra na auditoria da candidatura
    await applicationRepository.addHistory(
      interview.candidatura_id,
      'entrevista',
      'entrevista',
      `Horário de entrevista confirmado pelo estudante: ${horarioEscolhido}`,
      cleanAlunoId
    );

    // Notifica a empresa
    const alunoUser = await userRepository.findById(cleanAlunoId);
    const alunoNome = alunoUser ? alunoUser.nome : 'Estudante FATEC';

    await notificationRepository.create({
      usuarioId: interview.empresa_id,
      titulo: 'Entrevista Confirmada! 🎉',
      descricao: `${alunoNome} confirmou o horário de entrevista para "${interview.vaga_cargo}": ${horarioEscolhido}.`,
      tipo: 'entrevista',
      metadata: {
        entrevistaId: cleanId,
        candidaturaId: interview.candidatura_id,
        horarioConfirmado: horarioEscolhido,
      },
    });

    return updated;
  },

  async getStudentInterviews(alunoId) {
    const cleanId = parseInt(alunoId, 10);
    return await interviewRepository.findByStudent(cleanId);
  },

  async getCompanyInterviews(empresaId) {
    const cleanId = parseInt(empresaId, 10);
    return await interviewRepository.findByCompany(cleanId);
  },

  async getInterviewByCandidatura(candidaturaId) {
    const cleanId = parseInt(candidaturaId, 10);
    return await interviewRepository.findByCandidatura(cleanId);
  }
};

module.exports = interviewService;

