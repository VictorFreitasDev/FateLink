const matchRepository = require('../repositories/match.repository');
const userRepository = require('../repositories/user.repository');

const matchService = {
  async getMatches(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'Usuário não encontrado.' };
    }

    if (user.tipo === 'aluno') {
      const rows = await matchRepository.findStudentMatches(userId);
      const matches = rows.map((row) => ({
        id: `match-aluno-${row.vaga_id}-${row.empresa_id}`,
        vagaId: row.vaga_id,
        empresaId: row.empresa_id,
        empresaNome: row.empresa_nome,
        cargo: row.cargo,
        localizacao: row.localizacao,
        modalidade: row.modalidade,
        bolsa: row.bolsa,
        requisitos: row.requisitos || [],
        descricao: row.descricao,
        empresaImagem: row.empresa_imagem || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
        vagaImagem: row.vaga_imagem || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        matchScore: parseInt(row.match_score || '95', 10),
        statusConexao: row.status_conexao,
        badgeLabel: row.badge_label,
        matchData: row.match_data,
      }));
      return { role: 'aluno', matches };
    } else {
      const rows = await matchRepository.findCompanyMatches(userId);
      const matches = rows.map((row) => ({
        id: `match-empresa-${row.candidato_id}-${row.vaga_id}`,
        empresaId: parseInt(userId, 10),
        alunoId: row.aluno_id,
        candidatoId: row.candidato_id,
        alunoNome: row.aluno_nome,
        curso: row.curso,
        semestre: row.semestre,
        unidadeFatec: row.unidade_fatec,
        competencias: row.competencias || [],
        disponibilidade: row.disponibilidade,
        sobre: row.sobre,
        github: row.github,
        linkedin: row.linkedin,
        alunoImagem: row.aluno_imagem || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        vagaId: row.vaga_id,
        vagaCargo: row.vaga_cargo,
        matchScore: parseInt(row.match_score || '95', 10),
        statusConexao: row.status_conexao,
        badgeLabel: row.badge_label,
        matchData: row.match_data,
      }));
      return { role: 'empresa', matches };
    }
  }
};

module.exports = matchService;
