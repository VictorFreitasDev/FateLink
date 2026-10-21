const applicationValidator = {
  validateCreate(body) {
    const { alunoId, vagaId } = body || {};
    if (!alunoId || !vagaId) {
      return 'alunoId e vagaId são obrigatórios para realizar a candidatura.';
    }
    return null;
  },

  validateStatusUpdate(status) {
    const valid = [
      'enviada',
      'nova',
      'em_analise',
      'selecionado',
      'entrevista',
      'proposta',
      'contratado',
      'recusada',
      'recusado',
      'encerrado',
      'desistente',
    ];
    if (!valid.includes(status)) {
      return `Status inválido. Escolha: ${valid.join(', ')}.`;
    }
    return null;
  }
};

module.exports = applicationValidator;
