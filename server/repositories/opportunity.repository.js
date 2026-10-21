const pool = require('../config/db');

const opportunityRepository = {
  async findAll(options = {}) {
    const {
      empresaId = null,
      modalidade,
      tipo,
      localizacao,
      area,
      curso,
    } = typeof options === 'number' || typeof options === 'string' ? { empresaId: options } : options;

    let query = `
      SELECT o.*,
             (SELECT COUNT(*) FROM candidaturas c WHERE c.vaga_id = o.id) AS inscritos_count
      FROM oportunidades o
      WHERE 1=1
    `;
    const params = [];

    if (empresaId) {
      params.push(empresaId);
      query += ` AND o.empresa_id = $${params.length}`;
    }

    if (modalidade && modalidade !== 'Todas') {
      params.push(modalidade.toLowerCase());
      query += ` AND LOWER(o.modalidade) = $${params.length}`;
    }

    if (tipo && tipo !== 'Todos') {
      params.push(tipo.toLowerCase());
      query += ` AND LOWER(o.tipo) = $${params.length}`;
    }

    if (localizacao && localizacao !== 'Todas') {
      params.push(`%${localizacao.toLowerCase()}%`);
      query += ` AND (LOWER(o.localizacao) LIKE $${params.length} OR LOWER(o.modalidade) = 'remoto')`;
    }

    if (area && area !== 'Todas as Áreas') {
      params.push(`%${area.toLowerCase()}%`);
      query += ` AND (LOWER(o.area) LIKE $${params.length} OR LOWER(o.cargo) LIKE $${params.length})`;
    }

    if (curso && curso !== 'Todos os Cursos') {
      const cleanCurso = curso.toLowerCase().replace(/\s*\(.*\)/, '').trim();
      params.push(`%${cleanCurso}%`);
      query += ` AND (LOWER(o.curso_relacionado) LIKE $${params.length} OR LOWER(o.area) LIKE $${params.length} OR LOWER(o.cargo) LIKE $${params.length})`;
    }

    query += ` ORDER BY o.id DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('opp-', ''), 10) : id;
    const result = await pool.query(
      `SELECT o.*,
              (SELECT COUNT(*) FROM candidaturas c WHERE c.vaga_id = o.id) AS inscritos_count
       FROM oportunidades o
       WHERE o.id = $1`,
      [cleanId]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      empresaId,
      empresa,
      nomeFantasia,
      cargo,
      area,
      cursoRelacionado,
      localizacao,
      modalidade,
      tipo,
      bolsa,
      descricao,
      requisitos,
      beneficios,
      imagemUrl,
    } = data;

    const result = await pool.query(
      `INSERT INTO oportunidades (
        empresa_id, empresa_nome, nome_fantasia, cargo, area, curso_relacionado, localizacao,
        modalidade, tipo, bolsa, descricao, requisitos, beneficios, imagem_url, match_score, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 95, 'ativa')
      RETURNING *`,
      [
        empresaId || null,
        empresa || 'Empresa Parceira FATEC',
        nomeFantasia || empresa || 'Tech FATEC Partner',
        cargo,
        area || 'Tecnologia da Informação',
        cursoRelacionado || 'Desenvolvimento de Software Multiplataforma',
        localizacao || 'São Paulo - SP',
        modalidade || 'Híbrido',
        tipo || 'Estágio',
        bolsa || 'A combinar',
        descricao,
        requisitos && Array.isArray(requisitos) ? requisitos : [requisitos || 'Estudante FATEC ativo'],
        beneficios && Array.isArray(beneficios) ? beneficios : ['Bolsa-Auxílio', 'Seguro de Vida'],
        imagemUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('opp-', ''), 10) : id;
    const {
      cargo,
      area,
      cursoRelacionado,
      localizacao,
      modalidade,
      tipo,
      bolsa,
      descricao,
      requisitos,
      beneficios,
      imagemUrl,
      status,
    } = data;

    const result = await pool.query(
      `UPDATE oportunidades SET
         cargo = COALESCE($1, cargo),
         area = COALESCE($2, area),
         curso_relacionado = COALESCE($3, curso_relacionado),
         localizacao = COALESCE($4, localizacao),
         modalidade = COALESCE($5, modalidade),
         tipo = COALESCE($6, tipo),
         bolsa = COALESCE($7, bolsa),
         descricao = COALESCE($8, descricao),
         requisitos = COALESCE($9, requisitos),
         beneficios = COALESCE($10, beneficios),
         imagem_url = COALESCE($11, imagem_url),
         status = COALESCE($12, status)
       WHERE id = $13
       RETURNING *, (SELECT COUNT(*) FROM candidaturas c WHERE c.vaga_id = oportunidades.id) AS inscritos_count`,
      [
        cargo,
        area,
        cursoRelacionado,
        localizacao,
        modalidade,
        tipo,
        bolsa,
        descricao,
        requisitos ? (Array.isArray(requisitos) ? requisitos : [requisitos]) : null,
        beneficios ? (Array.isArray(beneficios) ? beneficios : [beneficios]) : null,
        imagemUrl,
        status,
        cleanId,
      ]
    );
    return result.rows[0] || null;
  },

  async updateStatus(id, status) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('opp-', ''), 10) : id;
    const result = await pool.query(
      'UPDATE oportunidades SET status = $1 WHERE id = $2 RETURNING *',
      [status, cleanId]
    );
    return result.rows[0] || null;
  },

  async delete(id, empresaId = null) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('opp-', ''), 10) : id;
    let query = 'DELETE FROM oportunidades WHERE id = $1';
    const params = [cleanId];
    if (empresaId) {
      query += ' AND empresa_id = $2';
      params.push(empresaId);
    }
    query += ' RETURNING *';
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  async incrementViews(id) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('opp-', ''), 10) : id;
    const result = await pool.query(
      'UPDATE oportunidades SET visualizacoes = COALESCE(visualizacoes, 0) + 1 WHERE id = $1 RETURNING visualizacoes',
      [cleanId]
    );
    return result.rows[0]?.visualizacoes || 0;
  },

  async getApplicants(id) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('opp-', ''), 10) : id;
    const result = await pool.query(
      `SELECT c.*,
              cand.id as candidato_db_id, cand.nome, cand.idade, cand.curso, cand.semestre, cand.unidade_fatec,
              cand.competencias, cand.disponibilidade, cand.modalidade_desejada, cand.previsao_formacao,
              cand.localizacao as candidato_localizacao, cand.portfolio,
              COALESCE(u.imagem_url, cand.imagem_url) as imagem_url,
              cand.github, cand.linkedin, cand.sobre, cand.curriculo_url,
              cand.projetos, cand.experiencias, cand.certificacoes, cand.usuario_id,
              o.cargo, o.nome_fantasia
       FROM candidaturas c
       JOIN oportunidades o ON c.vaga_id = o.id
       LEFT JOIN candidatos cand ON c.aluno_id = cand.usuario_id
       LEFT JOIN usuarios u ON c.aluno_id = u.id
       WHERE c.vaga_id = $1
       ORDER BY c.match_score_momento DESC, c.criado_em DESC`,
      [cleanId]
    );
    return result.rows;
  }
};

module.exports = opportunityRepository;
