const authValidator = {
  validateRegister(body) {
    const { tipo, nome, email, documento, senha } = body || {};
    if (!tipo || !nome || !email || !documento || !senha) {
      return 'Todos os campos obrigatórios devem ser preenchidos (tipo, nome, email, documento, senha).';
    }
    if (!['aluno', 'empresa'].includes(tipo)) {
      return "Tipo de conta inválido. Escolha 'aluno' ou 'empresa'.";
    }
    if (!email.includes('@')) {
      return 'Informe um e-mail válido.';
    }
    if (senha.length < 4) {
      return 'A senha deve conter ao menos 4 caracteres.';
    }
    return null;
  },

  validateLogin(body) {
    const { credential, password } = body || {};
    if (!credential || !password) {
      return 'Informe suas credenciais e senha para entrar.';
    }
    return null;
  }
};

module.exports = authValidator;
