const interviewService = require('../services/interview.service');

const interviewController = {
  async propose(req, res) {
    try {
      const { candidaturaId, empresaId, formato, linkOuLocal, horariosPropostos, observacoes } = req.body;
      if (!candidaturaId || !empresaId) {
        return res.status(400).json({ error: 'candidaturaId e empresaId são obrigatórios.' });
      }

      const interview = await interviewService.proposeInterview({
        candidaturaId,
        empresaId,
        formato,
        linkOuLocal,
        horariosPropostos,
        observacoes,
      });

      return res.status(201).json({
        success: true,
        message: 'Convite de entrevista enviado com sucesso!',
        interview,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao agendar entrevista.' });
    }
  },

  async confirm(req, res) {
    try {
      const { id } = req.params;
      const { alunoId, horarioEscolhido } = req.body;
      if (!alunoId || !horarioEscolhido) {
        return res.status(400).json({ error: 'alunoId e horarioEscolhido são obrigatórios.' });
      }

      const interview = await interviewService.confirmInterview(id, alunoId, horarioEscolhido);
      return res.json({
        success: true,
        message: 'Horário de entrevista confirmado com sucesso!',
        interview,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao confirmar entrevista.' });
    }
  },

  async getStudentInterviews(req, res) {
    try {
      const { alunoId } = req.params;
      const interviews = await interviewService.getStudentInterviews(alunoId);
      return res.json(interviews);
    } catch (err) {
      console.error('Erro em GET /api/interviews/student:', err);
      return res.status(500).json({ error: 'Erro ao buscar entrevistas do estudante.' });
    }
  },

  async getCompanyInterviews(req, res) {
    try {
      const { empresaId } = req.params;
      const interviews = await interviewService.getCompanyInterviews(empresaId);
      return res.json(interviews);
    } catch (err) {
      console.error('Erro em GET /api/interviews/company:', err);
      return res.status(500).json({ error: 'Erro ao buscar entrevistas da empresa.' });
    }
  },

  async getByCandidatura(req, res) {
    try {
      const { candidaturaId } = req.params;
      const interview = await interviewService.getInterviewByCandidatura(candidaturaId);
      return res.json(interview || null);
    } catch (err) {
      console.error('Erro em GET /api/interviews/application:', err);
      return res.status(500).json({ error: 'Erro ao buscar entrevista da candidatura.' });
    }
  }
};

module.exports = interviewController;

