const pool = require('../config/db');

const interviewRepository = {
  async create({ candidaturaId, empresaId, alunoId, vagaId, formato, linkOuLocal, horariosPropostos, observacoes }) {
    const result = await pool.query(
      `INSERT INTO entrevistas (
        candidatura_id, empresa_id, aluno_id, vaga_id, formato,
        link_ou_local, horarios_propostos, observacoes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente')
      RETURNING *`,
      [
        candidaturaId,
        empresaId,
        alunoId,
        vagaId,
        formato || 'online',
        linkOuLocal || 'Link da videochamada será enviado por mensagem',
        JSON.stringify(horariosPropostos || []),
        observacoes || null,
      ]
    );
    return result.rows[0];
  },

  async findByCandidatura(candidaturaId) {
    const result = await pool.query(
      `SELECT e.*,
              o.cargo as vaga_cargo, o.empresa_nome, o.nome_fantasia,
              u1.nome as aluno_nome, u1.email as aluno_email,
              u2.nome as empresa_razao, u2.email as empresa_email
       FROM entrevistas e
       JOIN oportunidades o ON e.vaga_id = o.id
       JOIN usuarios u1 ON e.aluno_id = u1.id
       JOIN usuarios u2 ON e.empresa_id = u2.id
       WHERE e.candidatura_id = $1
       ORDER BY e.criado_em DESC LIMIT 1`,
      [candidaturaId]
    );
    return result.rows[0] || null;
  },

  async findByStudent(alunoId) {
    const result = await pool.query(
      `SELECT e.*,
              o.cargo as vaga_cargo, o.empresa_nome, o.nome_fantasia, o.modalidade, o.localizacao,
              u.nome as empresa_nome_user, u.imagem_url as empresa_imagem
       FROM entrevistas e
       JOIN oportunidades o ON e.vaga_id = o.id
       JOIN usuarios u ON e.empresa_id = u.id
       WHERE e.aluno_id = $1
       ORDER BY e.criado_em DESC`,
      [alunoId]
    );
    return result.rows;
  },

  async findByCompany(empresaId) {
    const result = await pool.query(
      `SELECT e.*,
              o.cargo as vaga_cargo,
              u.nome as aluno_nome, u.email as aluno_email, u.imagem_url as aluno_imagem,
              cand.curso as aluno_curso, cand.semestre as aluno_semestre, cand.unidade_fatec
       FROM entrevistas e
       JOIN oportunidades o ON e.vaga_id = o.id
       JOIN usuarios u ON e.aluno_id = u.id
       LEFT JOIN candidatos cand ON e.aluno_id = cand.usuario_id
       WHERE e.empresa_id = $1
       ORDER BY e.criado_em DESC`,
      [empresaId]
    );
    return result.rows;
  },

  async findById(id) {
    const cleanId = parseInt(id, 10);
    const result = await pool.query(
      `SELECT e.*,
              o.cargo as vaga_cargo, o.nome_fantasia,
              u1.nome as aluno_nome, u2.nome as empresa_nome
       FROM entrevistas e
       JOIN oportunidades o ON e.vaga_id = o.id
       JOIN usuarios u1 ON e.aluno_id = u1.id
       JOIN usuarios u2 ON e.empresa_id = u2.id
       WHERE e.id = $1`,
      [cleanId]
    );
    return result.rows[0] || null;
  },

  async confirmSchedule(id, horarioConfirmado) {
    const cleanId = parseInt(id, 10);
    const result = await pool.query(
      `UPDATE entrevistas
       SET horario_confirmado = $1, status = 'confirmada', atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [horarioConfirmado, cleanId]
    );
    return result.rows[0] || null;
  },

  async updateStatus(id, status) {
    const cleanId = parseInt(id, 10);
    const result = await pool.query(
      `UPDATE entrevistas
       SET status = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, cleanId]
    );
    return result.rows[0] || null;
  }
};

module.exports = interviewRepository;

