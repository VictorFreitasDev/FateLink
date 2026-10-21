const pool = require('../config/db');

const applicationRepository = {
  async findExisting(alunoId, vagaId) {
    const result = await pool.query(
      'SELECT * FROM candidaturas WHERE aluno_id = $1 AND vaga_id = $2 LIMIT 1',
      [alunoId, vagaId]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM candidaturas WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ alunoId, candidatoId, vagaId, mensagem, matchScoreMomento, matchJustificativas }) {
    const result = await pool.query(
      `INSERT INTO candidaturas (
        aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao,
        match_score_momento, match_justificativas
      ) VALUES ($1, $2, $3, 'enviada', $4, $5, $6)
      RETURNING *`,
      [
        alunoId,
        candidatoId || null,
        vagaId,
        mensagem || 'Olá! Tenho muito interesse nesta oportunidade e gostaria de apresentar minhas qualificações.',
        matchScoreMomento,
        matchJustificativas,
      ]
    );
    return result.rows[0];
  },

  async addHistory(candidaturaId, statusAnterior, statusNovo, motivo, alteradoPor) {
    await pool.query(
      `INSERT INTO historico_candidaturas (candidatura_id, status_anterior, status_novo, motivo, alterado_por)
       VALUES ($1, $2, $3, $4, $5)`,
      [candidaturaId, statusAnterior, statusNovo, motivo, alteradoPor]
    );
  },

  async findByStudent(alunoId) {
    const result = await pool.query(
      `SELECT c.*, o.empresa_id, o.cargo, o.empresa_nome, o.nome_fantasia, o.modalidade, o.bolsa, o.localizacao, o.imagem_url
       FROM candidaturas c
       JOIN oportunidades o ON c.vaga_id = o.id
       WHERE c.aluno_id = $1
       ORDER BY c.criado_em DESC`,
      [alunoId]
    );
    return result.rows;
  },

  async findByCompany(empresaId) {
    const result = await pool.query(
      `SELECT c.*,
              cand.id as candidato_db_id, cand.nome, cand.idade, cand.curso, cand.semestre, cand.unidade_fatec,
              cand.competencias, cand.disponibilidade, cand.modalidade_desejada, cand.previsao_formacao,
              cand.localizacao as candidato_localizacao, cand.portfolio, cand.github, cand.linkedin,
              cand.curriculo_url, cand.projetos, cand.experiencias, cand.certificacoes, cand.sobre,
              COALESCE(u.imagem_url, cand.imagem_url) as imagem_url,
              o.cargo, o.nome_fantasia, o.empresa_id, o.localizacao as vaga_localizacao,
              o.modalidade as vaga_modalidade, o.bolsa as vaga_bolsa
       FROM candidaturas c
       JOIN oportunidades o ON c.vaga_id = o.id
       LEFT JOIN candidatos cand ON c.aluno_id = cand.usuario_id
       LEFT JOIN usuarios u ON c.aluno_id = u.id
       WHERE o.empresa_id = $1
       ORDER BY c.criado_em DESC`,
      [empresaId]
    );
    return result.rows;
  },

  async getHistory(candidaturaId) {
    const result = await pool.query(
      `SELECT h.*, u.nome as alterado_por_nome
       FROM historico_candidaturas h
       LEFT JOIN usuarios u ON h.alterado_por = u.id
       WHERE h.candidatura_id = $1
       ORDER BY h.criado_em ASC`,
      [candidaturaId]
    );
    return result.rows;
  },

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE candidaturas
       SET status = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }
};

module.exports = applicationRepository;
