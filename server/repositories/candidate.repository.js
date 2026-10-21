const pool = require('../config/db');

const candidateRepository = {
  async findAll(filters = {}) {
    const { curso, unidadeFatec, disponibilidade, semestre } = filters;
    let query = 'SELECT * FROM candidatos WHERE 1=1';
    const params = [];

    if (curso && curso !== 'Todos os Cursos') {
      const cleanCurso = curso.toLowerCase().replace(/\s*\(.*\)/, '').trim();
      params.push(`%${cleanCurso}%`);
      query += ` AND LOWER(curso) LIKE $${params.length}`;
    }

    if (unidadeFatec && unidadeFatec !== 'Todas as Unidades') {
      params.push(`%${unidadeFatec.toLowerCase()}%`);
      query += ` AND LOWER(unidade_fatec) LIKE $${params.length}`;
    }

    if (disponibilidade && disponibilidade !== 'Todas') {
      params.push(disponibilidade.toLowerCase());
      query += ` AND LOWER(disponibilidade) = $${params.length}`;
    }

    if (semestre && semestre !== 'Todos os Semestres') {
      params.push(`%${semestre.toLowerCase().replace(/[^0-9]/g, '')}%`);
      query += ` AND semestre LIKE $${params.length}`;
    }

    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(id) {
    const cleanId = typeof id === 'string' ? parseInt(id.replace('cand-', ''), 10) : id;
    const result = await pool.query('SELECT * FROM candidatos WHERE id = $1', [cleanId]);
    return result.rows[0] || null;
  },

  async findByUserId(userId) {
    const cleanUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const result = await pool.query('SELECT * FROM candidatos WHERE usuario_id = $1 LIMIT 1', [cleanUserId]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      usuarioId,
      nome,
      idade,
      curso,
      semestre,
      unidadeFatec,
      sobre,
      competencias,
      disponibilidade,
      imagemUrl,
      github,
      linkedin,
      portfolio,
      previsaoFormacao,
      localizacao,
      modalidadeDesejada,
      projetos,
      experiencias,
      certificacoes,
      curriculoUrl,
    } = data;

    const result = await pool.query(
      `INSERT INTO candidatos (
        usuario_id, nome, idade, curso, semestre, unidade_fatec, sobre,
        competencias, disponibilidade, imagem_url, github, linkedin,
        portfolio, previsao_formacao, localizacao, modalidade_desejada,
        projetos, experiencias, certificacoes, curriculo_url, match_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 95)
      RETURNING *`,
      [
        usuarioId || null,
        nome || 'Estudante FATEC',
        idade || 21,
        curso || 'Análise e Desenvolvimento de Sistemas',
        semestre || '4º Semestre',
        unidadeFatec || 'Fatec Jales',
        sobre || 'Estudante dedicado da FATEC em busca de oportunidades.',
        Array.isArray(competencias) ? competencias : ['JavaScript', 'React'],
        disponibilidade || 'Tarde',
        imagemUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        github || '',
        linkedin || '',
        portfolio || '',
        previsaoFormacao || 'Dezembro / 2026',
        localizacao || 'Jales - SP',
        modalidadeDesejada || 'Híbrido',
        JSON.stringify(projetos || []),
        JSON.stringify(experiencias || []),
        Array.isArray(certificacoes) ? certificacoes : [],
        curriculoUrl || null,
      ]
    );
    return result.rows[0];
  },

  async upsertByUserId(userId, data) {
    const cleanUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const existing = await this.findByUserId(cleanUserId);

    if (!existing) {
      return this.create({ ...data, usuarioId: cleanUserId });
    }

    const {
      nome,
      idade,
      curso,
      semestre,
      unidadeFatec,
      sobre,
      competencias,
      disponibilidade,
      imagemUrl,
      github,
      linkedin,
      portfolio,
      previsaoFormacao,
      localizacao,
      modalidadeDesejada,
      projetos,
      experiencias,
      certificacoes,
      curriculoUrl,
    } = data;

    const result = await pool.query(
      `UPDATE candidatos SET
        nome = COALESCE($2, nome),
        idade = COALESCE($3, idade),
        curso = COALESCE($4, curso),
        semestre = COALESCE($5, semestre),
        unidade_fatec = COALESCE($6, unidade_fatec),
        sobre = COALESCE($7, sobre),
        competencias = COALESCE($8, competencias),
        disponibilidade = COALESCE($9, disponibilidade),
        imagem_url = COALESCE($10, imagem_url),
        github = COALESCE($11, github),
        linkedin = COALESCE($12, linkedin),
        portfolio = COALESCE($13, portfolio),
        previsao_formacao = COALESCE($14, previsao_formacao),
        localizacao = COALESCE($15, localizacao),
        modalidade_desejada = COALESCE($16, modalidade_desejada),
        projetos = COALESCE($17, projetos),
        experiencias = COALESCE($18, experiencias),
        certificacoes = COALESCE($19, certificacoes),
        curriculo_url = COALESCE($20, curriculo_url)
      WHERE usuario_id = $1
      RETURNING *`,
      [
        cleanUserId,
        nome !== undefined ? nome : null,
        idade !== undefined ? idade : null,
        curso !== undefined ? curso : null,
        semestre !== undefined ? semestre : null,
        unidadeFatec !== undefined ? unidadeFatec : null,
        sobre !== undefined ? sobre : null,
        Array.isArray(competencias) ? competencias : null,
        disponibilidade !== undefined ? disponibilidade : null,
        imagemUrl !== undefined ? imagemUrl : null,
        github !== undefined ? github : null,
        linkedin !== undefined ? linkedin : null,
        portfolio !== undefined ? portfolio : null,
        previsaoFormacao !== undefined ? previsaoFormacao : null,
        localizacao !== undefined ? localizacao : null,
        modalidadeDesejada !== undefined ? modalidadeDesejada : null,
        projetos !== undefined ? JSON.stringify(projetos) : null,
        experiencias !== undefined ? JSON.stringify(experiencias) : null,
        Array.isArray(certificacoes) ? certificacoes : null,
        curriculoUrl !== undefined ? curriculoUrl : null,
      ]
    );

    // Sincroniza tabela de usuarios
    if (nome || curso || imagemUrl) {
      await pool.query(
        `UPDATE usuarios SET
          nome = COALESCE($2, nome),
          curso_ou_ramo = COALESCE($3, curso_ou_ramo),
          imagem_url = COALESCE($4, imagem_url)
        WHERE id = $1`,
        [cleanUserId, nome || null, curso || null, imagemUrl || null]
      );
    }

    return result.rows[0];
  },

  async updateResumeUrl(userId, curriculoUrl) {
    const cleanUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const result = await pool.query(
      'UPDATE candidatos SET curriculo_url = $2 WHERE usuario_id = $1 RETURNING *',
      [cleanUserId, curriculoUrl]
    );
    return result.rows[0] || null;
  },

  async deleteResume(userId) {
    const cleanUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const result = await pool.query(
      'UPDATE candidatos SET curriculo_url = NULL WHERE usuario_id = $1 RETURNING *',
      [cleanUserId]
    );
    return result.rows[0] || null;
  },

  async updateImageByUserId(userId, imagemUrl) {
    const cleanUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    await pool.query('UPDATE candidatos SET imagem_url = $1 WHERE usuario_id = $2', [imagemUrl, cleanUserId]);
    await pool.query('UPDATE usuarios SET imagem_url = $1 WHERE id = $2', [imagemUrl, cleanUserId]);
  },
};

module.exports = candidateRepository;
