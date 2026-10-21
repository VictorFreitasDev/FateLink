const opportunityValidator = {
  validateCreate(body) {
    const { cargo, area, descricao } = body || {};
    if (!cargo || !cargo.trim()) {
      return 'O título do cargo da oportunidade é obrigatório.';
    }
    if (!descricao || !descricao.trim()) {
      return 'A descrição da oportunidade é obrigatória.';
    }
    return null;
  },

  validateStatus(status) {
    const valid = ['ativa', 'pausada', 'encerrada'];
    if (!valid.includes(status)) {
      return `Status inválido. Escolha: ${valid.join(', ')}.`;
    }
    return null;
  }
};

module.exports = opportunityValidator;
