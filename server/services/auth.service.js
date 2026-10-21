const userRepository = require('../repositories/user.repository');
const candidateRepository = require('../repositories/candidate.repository');

const authService = {
  async register(payload) {
    const { tipo, nome, email, documento, senha, curso_ou_ramo } = payload;
    const emailFormatado = email.trim().toLowerCase();
    const docLimpo = documento.trim();

    const existing = await userRepository.findByEmailOrDoc(emailFormatado);
    if (existing) {
      throw { status: 409, message: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    const defaultAvatar = tipo === 'aluno'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';

    const newUser = await userRepository.createUser({
      tipo,
      nome: nome.trim(),
      email: emailFormatado,
      documento: docLimpo,
      senha,
      curso_ou_ramo: curso_ou_ramo ? curso_ou_ramo.trim() : '',
      imagem_url: defaultAvatar,
    });

    if (tipo === 'aluno') {
      await candidateRepository.create({
        usuarioId: newUser.id,
        nome: newUser.nome,
        idade: 21,
        curso: curso_ou_ramo || 'Análise e Desenvolvimento de Sistemas',
        semestre: '4º Semestre',
        unidadeFatec: 'Fatec Jales',
        sobre: 'Estudante da FATEC buscando oportunidades de estágio na área de TI.',
        competencias: ['Tecnologia', 'Inovação', 'SQL'],
        disponibilidade: 'Manhã',
        imagemUrl: defaultAvatar,
      });
    }

    return {
      id: newUser.id,
      tipo: newUser.tipo,
      nome: newUser.nome,
      email: newUser.email,
      documento: newUser.documento,
      curso_ou_ramo: newUser.curso_ou_ramo,
      imagemUrl: newUser.imagem_url,
    };
  },

  async login(credential, password) {
    const user = await userRepository.findByEmailOrDoc(credential);
    if (!user) {
      throw { status: 401, message: 'Credenciais não encontradas. Verifique seu e-mail ou documento.' };
    }

    if (user.senha !== password) {
      throw { status: 401, message: 'Senha incorreta para esta conta.' };
    }

    return {
      id: user.id,
      tipo: user.tipo,
      nome: user.nome,
      email: user.email,
      documento: user.documento,
      curso_ou_ramo: user.curso_ou_ramo,
      imagemUrl: user.imagem_url || (user.tipo === 'aluno'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'),
    };
  },

  async updateProfileImage(userId, imageUrl) {
    const cleanUrl = imageUrl.trim();
    const updated = await userRepository.updateProfileImage(userId, cleanUrl);
    if (!updated) {
      throw { status: 404, message: 'Usuário não encontrado.' };
    }

    if (updated.tipo === 'aluno') {
      await candidateRepository.updateImageByUserId(userId, cleanUrl);
    }

    return {
      id: updated.id,
      tipo: updated.tipo,
      nome: updated.nome,
      email: updated.email,
      documento: updated.documento,
      curso_ou_ramo: updated.curso_ou_ramo,
      imagemUrl: updated.imagem_url,
    };
  }
};

module.exports = authService;
