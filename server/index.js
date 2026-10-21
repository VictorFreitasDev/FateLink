const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { calculateMatch } = require('./services/matchEngine');

const app = express();
app.use(cors());
app.use(express.json());

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Configuração de Conexão com o PostgreSQL local (fatelinkBD / pgAdmin 4)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fatelinkBD',
  password: '123456',
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL fatelinkBD:', err.message);
  } else {
    console.log('✅ Conectado com sucesso ao PostgreSQL (fatelinkBD)!');
    release();
  }
});

// ==========================================================
// REGEX E VALIDAÇÕES
// ==========================================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const CPF_REGEX = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{11})$/;
const CNPJ_REGEX = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14})$/;
const NOME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]{3,}$/;

function validarDocumento(tipo, doc) {
  const limpo = doc.replace(/\D/g, '');
  if (tipo === 'aluno') {
    return CPF_REGEX.test(doc.trim()) && limpo.length === 11;
  } else {
    return CNPJ_REGEX.test(doc.trim()) && limpo.length === 14;
  }
}

// ==========================================================
// ROTAS DE AUTENTICAÇÃO E CADASTRO
// ==========================================================

app.post('/api/register', async (req, res) => {
  try {
    const { tipo, nome, email, documento, senha, curso_ou_ramo } = req.body;

    if (!tipo || (tipo !== 'aluno' && tipo !== 'empresa')) {
      return res.status(400).json({ error: 'Tipo de conta inválido. Escolha aluno ou empresa.' });
    }

    if (!nome || !NOME_REGEX.test(nome.trim())) {
      return res.status(400).json({ error: 'O nome deve ter no mínimo 3 caracteres válidos.' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'E-mail inválido. Utilize um formato válido.' });
    }

    if (!documento || !validarDocumento(tipo, documento)) {
      return res.status(400).json({
        error: tipo === 'aluno' ? 'CPF inválido. O CPF deve conter 11 dígitos numéricos.' : 'CNPJ inválido. O CNPJ deve conter 14 dígitos numéricos.',
      });
    }

    if (!senha || senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    const emailFormatado = email.trim().toLowerCase();
    const docLimpo = documento.trim();

    const existCheck = await pool.query(
      'SELECT id, email, documento FROM usuarios WHERE LOWER(email) = $1 OR documento = $2',
      [emailFormatado, docLimpo]
    );

    if (existCheck.rows.length > 0) {
      const match = existCheck.rows[0];
      if (match.email.toLowerCase() === emailFormatado) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado no FateLink.' });
      }
      return res.status(400).json({ error: `Este documento (${tipo === 'aluno' ? 'CPF' : 'CNPJ'}) já está cadastrado no FateLink.` });
    }

    const defaultAvatar = tipo === 'aluno'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';

    const result = await pool.query(
      `INSERT INTO usuarios (tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url, criado_em`,
      [tipo, nome.trim(), emailFormatado, docLimpo, senha, curso_ou_ramo ? curso_ou_ramo.trim() : '', defaultAvatar]
    );

    const newUser = result.rows[0];

    if (tipo === 'aluno') {
      await pool.query(
        `INSERT INTO candidatos (usuario_id, nome, idade, curso, semestre, unidade_fatec, sobre, competencias, disponibilidade, imagem_url, match_score)
         VALUES ($1, $2, 21, $3, '4º Semestre', 'Fatec Jales', 'Estudante da FATEC buscando oportunidades de estágio na área de TI.', ARRAY['Tecnologia', 'Inovação', 'SQL'], 'Manhã', $4, 95)`,
        [newUser.id, newUser.nome, curso_ou_ramo || 'Análise e Desenvolvimento de Sistemas', defaultAvatar]
      );
    }

    console.log(`✅ [POSTGRESQL] Usuário inserido com sucesso: ID=${newUser.id} | Tipo=${newUser.tipo} | Nome=${newUser.nome}`);

    return res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      user: {
        id: newUser.id,
        tipo: newUser.tipo,
        nome: newUser.nome,
        email: newUser.email,
        documento: newUser.documento,
        curso_ou_ramo: newUser.curso_ou_ramo,
        imagemUrl: newUser.imagem_url,
      },
    });
  } catch (err) {
    console.error('❌ Erro no /api/register:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar no banco: ' + err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { credential, password } = req.body;
    if (!credential || !password) {
      return res.status(400).json({ error: 'Informe suas credenciais e senha para entrar.' });
    }

    const cred = credential.trim();
    const result = await pool.query(
      `SELECT id, tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url, criado_em
       FROM usuarios
       WHERE LOWER(email) = LOWER($1) OR documento = $1`,
      [cred]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais não encontradas. Verifique seu e-mail ou documento.' });
    }

    const user = result.rows[0];
    if (user.senha !== password) {
      return res.status(401).json({ error: 'Senha incorreta para esta conta.' });
    }

    console.log(`🔑 [LOGIN SUCESSO] Usuário: ${user.nome} | Tipo: ${user.tipo} | ID: ${user.id}`);

    return res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        tipo: user.tipo,
        nome: user.nome,
        email: user.email,
        documento: user.documento,
        curso_ou_ramo: user.curso_ou_ramo,
        imagemUrl: user.imagem_url || (user.tipo === 'aluno'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'),
      },
    });
  } catch (err) {
    console.error('❌ Erro no /api/login:', err);
    return res.status(500).json({ error: 'Erro no servidor durante o login: ' + err.message });
  }
});

// Atualizar Foto de Perfil do Usuário
app.patch('/api/users/:id/profile-image', async (req, res) => {
  try {
    const { id } = req.params;
    const { imagemUrl } = req.body;
    if (!imagemUrl || typeof imagemUrl !== 'string' || !imagemUrl.trim()) {
      return res.status(400).json({ error: 'URL da imagem é obrigatória.' });
    }

    const cleanUrl = imagemUrl.trim();
    const userRes = await pool.query(
      'UPDATE usuarios SET imagem_url = $1 WHERE id = $2 RETURNING id, tipo, nome, email, documento, curso_ou_ramo, imagem_url',
      [cleanUrl, id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const user = userRes.rows[0];

    // Se for aluno, também sincroniza em candidatos
    if (user.tipo === 'aluno') {
      await pool.query('UPDATE candidatos SET imagem_url = $1 WHERE usuario_id = $2', [cleanUrl, id]);
    }

    console.log(`📸 [FOTO DE PERFIL ATUALIZADA] Usuário ID=${user.id} (${user.nome})`);

    return res.json({
      success: true,
      message: 'Foto de perfil atualizada com sucesso!',
      user: {
        id: user.id,
        tipo: user.tipo,
        nome: user.nome,
        email: user.email,
        documento: user.documento,
        curso_ou_ramo: user.curso_ou_ramo,
        imagemUrl: user.imagem_url,
      },
    });
  } catch (err) {
    console.error('Erro ao atualizar foto de perfil:', err);
    return res.status(500).json({ error: 'Erro ao atualizar foto de perfil: ' + err.message });
  }
});

// ==========================================================
// ROTAS DE OPORTUNIDADES (VAGAS) & MOTOR DE MATCH
// ==========================================================

app.get('/api/opportunities', async (req, res) => {
  try {
    const { alunoId, empresaId } = req.query;

    let candidateData = null;
    if (alunoId) {
      const candRes = await pool.query('SELECT * FROM candidatos WHERE usuario_id = $1 LIMIT 1', [alunoId]);
      if (candRes.rows.length > 0) {
        candidateData = candRes.rows[0];
      }
    }

    let query = `
      SELECT o.*,
             (SELECT COUNT(*) FROM candidaturas c WHERE c.vaga_id = o.id) AS inscritos_count
      FROM oportunidades o
    `;
    const params = [];
    if (empresaId) {
      params.push(empresaId);
      query += ` WHERE o.empresa_id = $1 ORDER BY o.id DESC`;
    } else {
      query += ` ORDER BY o.id DESC`;
    }

    const result = await pool.query(query, params);
    const mapped = result.rows.map((row) => {
      let score = row.match_score || 90;
      let explanations = ['Compatibilidade inicial com base no perfil da oportunidade.'];

      if (candidateData) {
        const evalResult = calculateMatch(candidateData, row);
        score = evalResult.score;
        explanations = evalResult.explanations;
      }

      return {
        id: `opp-${row.id}`,
        dbId: row.id,
        empresaId: row.empresa_id,
        empresa: row.empresa_nome,
        nomeFantasia: row.nome_fantasia,
        cargo: row.cargo,
        area: row.area,
        cursoRelacionado: row.curso_relacionado || 'Geral',
        localizacao: row.localizacao,
        modalidade: row.modalidade,
        tipo: row.tipo,
        bolsa: row.bolsa,
        descricao: row.descricao,
        requisitos: row.requisitos || [],
        beneficios: row.beneficios || [],
        imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        matchScore: score,
        matchExplanations: explanations,
        status: row.status || 'ativa',
        visualizacoes: row.visualizacoes || 0,
        inscritosCount: parseInt(row.inscritos_count || '0', 10),
        criadoEm: row.criado_em,
      };
    });

    if (candidateData) {
      mapped.sort((a, b) => b.matchScore - a.matchScore);
    }

    return res.json(mapped);
  } catch (err) {
    console.error('Erro em GET /api/opportunities:', err);
    return res.status(500).json({ error: 'Erro ao buscar oportunidades.' });
  }
});

// Editar Vaga / Oportunidade
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
    } = req.body;

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
        Array.isArray(requisitos) ? requisitos : (requisitos ? [requisitos] : null),
        Array.isArray(beneficios) ? beneficios : (beneficios ? [beneficios] : null),
        imagemUrl,
        status,
        cleanId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Oportunidade não encontrada para edição.' });
    }

    const row = result.rows[0];
    console.log(`📝 [VAGA ATUALIZADA] ID: ${row.id} - "${row.cargo}" por ${row.nome_fantasia}`);

    return res.json({
      id: `opp-${row.id}`,
      dbId: row.id,
      empresaId: row.empresa_id,
      empresa: row.empresa_nome,
      nomeFantasia: row.nome_fantasia,
      cargo: row.cargo,
      area: row.area,
      cursoRelacionado: row.curso_relacionado || 'Geral',
      localizacao: row.localizacao,
      modalidade: row.modalidade,
      tipo: row.tipo,
      bolsa: row.bolsa,
      descricao: row.descricao,
      requisitos: row.requisitos || [],
      beneficios: row.beneficios || [],
      imagemUrl: row.imagem_url,
      status: row.status || 'ativa',
      inscritosCount: parseInt(row.inscritos_count || '0', 10),
      visualizacoes: row.visualizacoes || 0,
      criadoEm: row.criado_em,
    });
  } catch (err) {
    console.error('Erro em PUT /api/opportunities/:id:', err);
    return res.status(500).json({ error: 'Erro ao atualizar oportunidade: ' + err.message });
  }
});

// Listar Candidatos inscritos em uma Oportunidade específica
app.get('/api/opportunities/:id/candidates', async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = typeof id === 'string' ? parseInt(id.replace('opp-', ''), 10) : id;

    const result = await pool.query(
      `SELECT c.*,
              cand.nome, cand.curso, cand.semestre, cand.unidade_fatec, cand.competencias, cand.imagem_url, cand.disponibilidade,
              cand.github, cand.linkedin, cand.sobre,
              o.cargo, o.nome_fantasia
       FROM candidaturas c
       JOIN oportunidades o ON c.vaga_id = o.id
       LEFT JOIN candidatos cand ON c.aluno_id = cand.usuario_id
       WHERE c.vaga_id = $1
       ORDER BY c.match_score_momento DESC, c.criado_em DESC`,
      [cleanId]
    );

    const mapped = result.rows.map((row) => ({
      id: row.id,
      alunoId: row.aluno_id,
      vagaId: row.vaga_id,
      status: row.status,
      mensagemApresentacao: row.mensagem_apresentacao,
      matchScoreMomento: row.match_score_momento,
      matchJustificativas: row.match_justificativas || [],
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      candidato: {
        nome: row.nome || 'Estudante FATEC',
        curso: row.curso || 'Tecnologia',
        semestre: row.semestre || '',
        unidadeFatec: row.unidade_fatec || 'Fatec Jales',
        competencias: row.competencias || [],
        disponibilidade: row.disponibilidade || 'Manhã',
        imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        github: row.github,
        linkedin: row.linkedin,
        sobre: row.sobre,
      },
      vaga: {
        id: `opp-${row.vaga_id}`,
        cargo: row.cargo,
        nomeFantasia: row.nome_fantasia,
      },
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Erro em GET /api/opportunities/:id/candidates:', err);
    return res.status(500).json({ error: 'Erro ao buscar candidatos da vaga.' });
  }
});

app.post('/api/opportunities', async (req, res) => {
  try {
    const {
      empresaId,
      empresa,
      nomeFantasia,
      cargo,
      area,
      localizacao,
      modalidade,
      tipo,
      bolsa,
      descricao,
      requisitos,
      beneficios,
      imagemUrl,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO oportunidades (
        empresa_id, empresa_nome, nome_fantasia, cargo, area, localizacao,
        modalidade, tipo, bolsa, descricao, requisitos, beneficios, imagem_url, match_score, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 95, 'ativa')
      RETURNING *`,
      [
        empresaId || null,
        empresa || 'Empresa Parceira FATEC',
        nomeFantasia || empresa || 'Tech FATEC Partner',
        cargo,
        area || 'Tecnologia da Informação',
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

    const row = result.rows[0];
    console.log(`💼 [POSTGRESQL] Nova vaga publicada: "${row.cargo}" por ${row.nome_fantasia}`);

    return res.status(201).json({
      id: `opp-${row.id}`,
      dbId: row.id,
      empresaId: row.empresa_id,
      empresa: row.empresa_nome,
      nomeFantasia: row.nome_fantasia,
      cargo: row.cargo,
      area: row.area,
      cursoRelacionado: row.curso_relacionado || 'Geral',
      localizacao: row.localizacao,
      modalidade: row.modalidade,
      tipo: row.tipo,
      bolsa: row.bolsa,
      descricao: row.descricao,
      requisitos: row.requisitos || [],
      beneficios: row.beneficios || [],
      imagemUrl: row.imagem_url,
      matchScore: row.match_score || 95,
      status: row.status || 'ativa',
      criadoEm: row.criado_em,
    });
  } catch (err) {
    console.error('❌ Erro em POST /api/opportunities:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar vaga no banco de dados.' });
  }
});

app.patch('/api/opportunities/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ativa', 'pausada', 'encerrada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use ativa, pausada ou encerrada.' });
    }

    const cleanId = id.replace('opp-', '');
    const result = await pool.query(
      'UPDATE oportunidades SET status = $1 WHERE id = $2 RETURNING *',
      [status, cleanId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Oportunidade não encontrada.' });
    }

    return res.json({ success: true, opportunity: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar status da oportunidade:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar vaga.' });
  }
});

// ==========================================================
// ROTAS DE CANDIDATOS (CURRÍCULOS)
// ==========================================================

app.get('/api/candidates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM candidatos ORDER BY id DESC');
    const mapped = result.rows.map((row) => ({
      id: `cand-${row.id}`,
      dbId: row.id,
      usuarioId: row.usuario_id,
      nome: row.nome,
      idade: row.idade,
      curso: row.curso,
      semestre: row.semestre,
      unidadeFatec: row.unidade_fatec,
      sobre: row.sobre,
      competencias: row.competencias || [],
      disponibilidade: row.disponibilidade,
      imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      github: row.github,
      linkedin: row.linkedin,
      matchScore: row.match_score || 95,
      projetos: row.projetos || [],
      experiencias: row.experiencias || [],
      certificacoes: row.certificacoes || [],
      criadoEm: row.criado_em,
    }));
    return res.json(mapped);
  } catch (err) {
    console.error('Erro em GET /api/candidates:', err);
    return res.status(500).json({ error: 'Erro ao buscar candidatos.' });
  }
});

app.post('/api/candidates', async (req, res) => {
  try {
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
    } = req.body;

    const result = await pool.query(
      `INSERT INTO candidatos (
        usuario_id, nome, idade, curso, semestre, unidade_fatec, sobre,
        competencias, disponibilidade, imagem_url, github, linkedin, match_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 98)
      RETURNING *`,
      [
        usuarioId || null,
        nome,
        idade || 21,
        curso || 'Análise e Desenvolvimento de Sistemas',
        semestre || '4º Semestre',
        unidadeFatec || 'Fatec',
        sobre,
        competencias && Array.isArray(competencias) ? competencias : ['JavaScript', 'React'],
        disponibilidade || 'Tarde',
        imagemUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        github || '',
        linkedin || '',
      ]
    );

    const row = result.rows[0];
    console.log(`📄 [POSTGRESQL] Novo currículo publicado: "${row.nome}" (${row.curso})`);

    return res.status(201).json({
      id: `cand-${row.id}`,
      dbId: row.id,
      usuarioId: row.usuario_id,
      nome: row.nome,
      idade: row.idade,
      curso: row.curso,
      semestre: row.semestre,
      unidadeFatec: row.unidade_fatec,
      sobre: row.sobre,
      competencias: row.competencias || [],
      disponibilidade: row.disponibilidade,
      imagemUrl: row.imagem_url,
      github: row.github,
      linkedin: row.linkedin,
      matchScore: row.match_score || 98,
      criadoEm: row.criado_em,
    });
  } catch (err) {
    console.error('❌ Erro em POST /api/candidates:', err);
    return res.status(500).json({ error: 'Erro ao cadastrar currículo no banco de dados.' });
  }
});

// ==========================================================
// FATELINK 2.0: ROTAS REAIS DE CANDIDATURAS (APPLICATIONS)
// ==========================================================

// 1. Criar Candidatura (Aluno candidata-se a uma Vaga)
app.post('/api/applications', async (req, res) => {
  try {
    const { alunoId, vagaId, mensagemApresentacao } = req.body;
    if (!alunoId || !vagaId) {
      return res.status(400).json({ error: 'alunoId e vagaId são obrigatórios.' });
    }

    const cleanVagaId = typeof vagaId === 'string' ? parseInt(vagaId.replace('opp-', ''), 10) : vagaId;

    // Verificar se já existe candidatura
    const existing = await pool.query(
      'SELECT id, status FROM candidaturas WHERE aluno_id = $1 AND vaga_id = $2',
      [alunoId, cleanVagaId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Você já se candidatou a esta vaga.',
        application: existing.rows[0],
      });
    }

    // Buscar dados do candidato e da vaga para calcular Match real no momento
    const candRes = await pool.query('SELECT * FROM candidatos WHERE usuario_id = $1 LIMIT 1', [alunoId]);
    const vagaRes = await pool.query('SELECT * FROM oportunidades WHERE id = $1 LIMIT 1', [cleanVagaId]);

    if (vagaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vaga não encontrada.' });
    }

    const candidato = candRes.rows[0] || null;
    const vaga = vagaRes.rows[0];

    const matchEval = calculateMatch(candidato, vaga);

    const appInsert = await pool.query(
      `INSERT INTO candidaturas (
        aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao,
        match_score_momento, match_justificativas
      ) VALUES ($1, $2, $3, 'enviada', $4, $5, $6)
      RETURNING *`,
      [
        alunoId,
        candidato ? candidato.id : null,
        cleanVagaId,
        mensagemApresentacao || 'Olá! Tenho muito interesse nesta oportunidade e gostaria de apresentar minhas qualificações.',
        matchEval.score,
        matchEval.explanations,
      ]
    );

    const newApp = appInsert.rows[0];

    // Registrar no histórico de transições
    await pool.query(
      `INSERT INTO historico_candidaturas (candidatura_id, status_anterior, status_novo, motivo, alterado_por)
       VALUES ($1, NULL, 'enviada', 'Candidatura submetida pelo estudante.', $2)`,
      [newApp.id, alunoId]
    );

    // Gerar Notificação para a Empresa (se houver empresa_id)
    if (vaga.empresa_id) {
      await pool.query(
        `INSERT INTO notificacoes (usuario_id, titulo, descricao, tipo, metadata)
         VALUES ($1, $2, $3, 'candidatura', $4)`,
        [
          vaga.empresa_id,
          'Nova Candidatura Recebida! 🚀',
          `${candidato ? candidato.nome : 'Um estudante'} candidatou-se para a vaga de "${vaga.cargo}". Compatibilidade: ${matchEval.score}%.`,
          JSON.stringify({ candidaturaId: newApp.id, vagaId: cleanVagaId, alunoId }),
        ]
      );
    }

    console.log(`🎯 [CANDIDATURA CRIADA] ID: ${newApp.id} | Aluno: ${alunoId} | Vaga: ${cleanVagaId}`);

    return res.status(201).json({
      success: true,
      message: 'Candidatura enviada com sucesso!',
      application: {
        id: newApp.id,
        alunoId: newApp.aluno_id,
        vagaId: newApp.vaga_id,
        status: newApp.status,
        matchScoreMomento: newApp.match_score_momento,
        matchJustificativas: newApp.match_justificativas,
        criadoEm: newApp.criado_em,
      },
    });
  } catch (err) {
    console.error('❌ Erro em POST /api/applications:', err);
    return res.status(500).json({ error: 'Erro ao processar candidatura: ' + err.message });
  }
});

// 2. Listar Candidaturas de um Estudante
app.get('/api/applications/student/:alunoId', async (req, res) => {
  try {
    const { alunoId } = req.params;
    const result = await pool.query(
      `SELECT c.*, o.cargo, o.empresa_nome, o.nome_fantasia, o.modalidade, o.bolsa, o.localizacao, o.imagem_url
       FROM candidaturas c
       JOIN oportunidades o ON c.vaga_id = o.id
       WHERE c.aluno_id = $1
       ORDER BY c.criado_em DESC`,
      [alunoId]
    );

    const mapped = result.rows.map((row) => ({
      id: row.id,
      alunoId: row.aluno_id,
      vagaId: row.vaga_id,
      status: row.status,
      mensagemApresentacao: row.mensagem_apresentacao,
      matchScoreMomento: row.match_score_momento,
      matchJustificativas: row.match_justificativas || [],
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      vaga: {
        id: `opp-${row.vaga_id}`,
        cargo: row.cargo,
        empresa: row.empresa_nome,
        nomeFantasia: row.nome_fantasia,
        modalidade: row.modalidade,
        bolsa: row.bolsa,
        localizacao: row.localizacao,
        imagemUrl: row.imagem_url,
      },
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Erro em GET /api/applications/student:', err);
    return res.status(500).json({ error: 'Erro ao buscar candidaturas do estudante.' });
  }
});

// 3. Listar Candidaturas recebidas por uma Empresa
app.get('/api/applications/company/:empresaId', async (req, res) => {
  try {
    const { empresaId } = req.params;
    const result = await pool.query(
      `SELECT c.*, cand.nome, cand.curso, cand.semestre, cand.unidade_fatec, cand.competencias, cand.imagem_url,
              o.cargo, o.nome_fantasia
       FROM candidaturas c
       JOIN oportunidades o ON c.vaga_id = o.id
       LEFT JOIN candidatos cand ON c.aluno_id = cand.usuario_id
       WHERE o.empresa_id = $1
       ORDER BY c.criado_em DESC`,
      [empresaId]
    );

    const mapped = result.rows.map((row) => ({
      id: row.id,
      alunoId: row.aluno_id,
      vagaId: row.vaga_id,
      status: row.status,
      mensagemApresentacao: row.mensagem_apresentacao,
      matchScoreMomento: row.match_score_momento,
      matchJustificativas: row.match_justificativas || [],
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      candidato: {
        nome: row.nome || 'Estudante FATEC',
        curso: row.curso || 'Tecnologia',
        semestre: row.semestre || '',
        unidadeFatec: row.unidade_fatec || 'Fatec',
        competencias: row.competencias || [],
        imagemUrl: row.imagem_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      },
      vaga: {
        id: `opp-${row.vaga_id}`,
        cargo: row.cargo,
        nomeFantasia: row.nome_fantasia,
      },
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Erro em GET /api/applications/company:', err);
    return res.status(500).json({ error: 'Erro ao buscar candidaturas da empresa.' });
  }
});

// 4. Atualizar Etapa da Candidatura (Empresa atualiza status: 'enviada' -> 'em_analise' -> 'entrevista' -> 'proposta' -> 'contratado' / 'recusada')
app.patch('/api/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo, alteradoPor } = req.body;

    const validStatuses = ['enviada', 'em_analise', 'entrevista', 'proposta', 'contratado', 'recusada', 'desistente'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Escolha: ' + validStatuses.join(', ') });
    }

    const currentAppRes = await pool.query('SELECT * FROM candidaturas WHERE id = $1', [id]);
    if (currentAppRes.rows.length === 0) {
      return res.status(404).json({ error: 'Candidatura não encontrada.' });
    }

    const currentApp = currentAppRes.rows[0];
    const statusAnterior = currentApp.status;

    const updateRes = await pool.query(
      `UPDATE candidaturas
       SET status = $1, atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    // Inserir no histórico de auditoria
    await pool.query(
      `INSERT INTO historico_candidaturas (candidatura_id, status_anterior, status_novo, motivo, alterado_por)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, statusAnterior, status, motivo || `Status atualizado para ${status}`, alteradoPor || null]
    );

    // Buscar dados da vaga para notificar o aluno
    const vagaRes = await pool.query('SELECT cargo, nome_fantasia FROM oportunidades WHERE id = $1', [currentApp.vaga_id]);
    const vaga = vagaRes.rows[0];

    const statusLabels = {
      em_analise: 'Seu perfil está em análise!',
      entrevista: 'Parabéns! Você foi convidado para uma entrevista!',
      proposta: 'Você recebeu uma proposta formal de contratação! 🎉',
      contratado: 'Contratação confirmada! Bem-vindo(a) ao time! 🏆',
      recusada: 'Atualização sobre o processo seletivo.',
      desistente: 'Candidatura encerrada.',
    };

    await pool.query(
      `INSERT INTO notificacoes (usuario_id, titulo, descricao, tipo, metadata)
       VALUES ($1, $2, $3, 'status', $4)`,
      [
        currentApp.aluno_id,
        statusLabels[status] || 'Atualização na sua candidatura',
        `A empresa ${vaga ? vaga.nome_fantasia : 'recrutadora'} atualizou a etapa da vaga "${vaga ? vaga.cargo : ''}" para: ${status.toUpperCase()}.`,
        JSON.stringify({ candidaturaId: id, statusNovo: status }),
      ]
    );

    console.log(`🔄 [STATUS ATUALIZADO] Candidatura ${id}: ${statusAnterior} ➔ ${status}`);

    return res.json({
      success: true,
      message: `Etapa da candidatura alterada com sucesso para ${status}.`,
      application: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Erro ao atualizar etapa de candidatura:', err);
    return res.status(500).json({ error: 'Erro ao atualizar status: ' + err.message });
  }
});

// ==========================================================
// FATELINK 2.0: CHAT E MENSAGENS PERSISTIDAS NO POSTGRESQL
// ==========================================================

// 1. Listar conversas ativas do usuário
app.get('/api/conversations/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT c.*,
              u1.nome as aluno_nome, u1.email as aluno_email,
              u2.nome as empresa_nome, u2.email as empresa_email,
              o.cargo as vaga_cargo,
              (SELECT COUNT(*) FROM mensagens m WHERE m.conversa_id = c.id AND m.remetente_id != $1 AND m.lida = false) as unread_count
       FROM conversas c
       JOIN usuarios u1 ON c.participante_aluno_id = u1.id
       JOIN usuarios u2 ON c.participante_empresa_id = u2.id
       LEFT JOIN oportunidades o ON c.vaga_id = o.id
       WHERE c.participante_aluno_id = $1 OR c.participante_empresa_id = $1
       ORDER BY c.ultima_mensagem_em DESC`,
      [userId]
    );

    const mapped = result.rows.map((row) => {
      const isAluno = parseInt(userId, 10) === row.participante_aluno_id;
      const contactName = isAluno ? row.empresa_nome : row.aluno_nome;
      const roleInfo = isAluno ? (row.vaga_cargo || 'Recrutador FATEC') : 'Estudante FATEC';

      return {
        id: `conv-${row.id}`,
        dbId: row.id,
        contactName,
        role: roleInfo,
        avatar: isAluno
          ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        lastMessage: row.ultima_mensagem || 'Conversa iniciada',
        lastTime: new Date(row.ultima_mensagem_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: parseInt(row.unread_count || '0', 10),
        vagaId: row.vaga_id,
        vagaTitulo: row.vaga_cargo,
        messages: [],
      };
    });

    return res.json(mapped);
  } catch (err) {
    console.error('Erro em GET /api/conversations:', err);
    return res.status(500).json({ error: 'Erro ao buscar conversas.' });
  }
});

// 2. Iniciar ou obter conversa entre Aluno e Empresa
app.post('/api/conversations', async (req, res) => {
  try {
    const { alunoId, empresaId, vagaId } = req.body;
    if (!alunoId || !empresaId) {
      return res.status(400).json({ error: 'alunoId e empresaId são obrigatórios.' });
    }

    const cleanVagaId = vagaId ? (typeof vagaId === 'string' ? parseInt(vagaId.replace('opp-', ''), 10) : vagaId) : null;

    // Verificar se já existe conversa entre eles
    const check = await pool.query(
      `SELECT * FROM conversas
       WHERE participante_aluno_id = $1 AND participante_empresa_id = $2
       LIMIT 1`,
      [alunoId, empresaId]
    );

    if (check.rows.length > 0) {
      return res.json(check.rows[0]);
    }

    const insert = await pool.query(
      `INSERT INTO conversas (participante_aluno_id, participante_empresa_id, vaga_id, ultima_mensagem)
       VALUES ($1, $2, $3, 'Conversa iniciada!')
       RETURNING *`,
      [alunoId, empresaId, cleanVagaId]
    );

    return res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error('Erro ao iniciar conversa:', err);
    return res.status(500).json({ error: 'Erro ao iniciar conversa: ' + err.message });
  }
});

// 3. Listar Mensagens de uma Conversa
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace('conv-', '');
    const { currentUserId } = req.query;

    const result = await pool.query(
      'SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY criado_em ASC',
      [cleanId]
    );

    // Marcar mensagens recebidas como lidas
    if (currentUserId) {
      await pool.query(
        'UPDATE mensagens SET lida = true WHERE conversa_id = $1 AND remetente_id != $2 AND lida = false',
        [cleanId, currentUserId]
      );
    }

    const mapped = result.rows.map((row) => ({
      id: `msg-${row.id}`,
      conversaId: row.conversa_id,
      remetenteId: row.remetente_id,
      sender: currentUserId && parseInt(currentUserId, 10) === row.remetente_id ? 'me' : 'other',
      text: row.conteudo,
      time: new Date(row.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lida: row.lida,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    return res.status(500).json({ error: 'Erro ao buscar histórico de mensagens.' });
  }
});

// 4. Enviar Mensagem Persistente
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const cleanConvId = id.replace('conv-', '');
    const { remetenteId, conteudo } = req.body;

    if (!remetenteId || !conteudo || !conteudo.trim()) {
      return res.status(400).json({ error: 'remetenteId e conteudo são obrigatórios.' });
    }

    const msgResult = await pool.query(
      `INSERT INTO mensagens (conversa_id, remetente_id, conteudo, lida)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [cleanConvId, remetenteId, conteudo.trim()]
    );

    const newMsg = msgResult.rows[0];

    // Atualiza a última mensagem na tabela de conversas
    await pool.query(
      `UPDATE conversas
       SET ultima_mensagem = $1, ultima_mensagem_em = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [conteudo.trim(), cleanConvId]
    );

    return res.status(201).json({
      id: `msg-${newMsg.id}`,
      conversaId: newMsg.conversa_id,
      remetenteId: newMsg.remetente_id,
      sender: 'me',
      text: newMsg.conteudo,
      time: new Date(newMsg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lida: false,
    });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ error: 'Erro ao salvar mensagem: ' + err.message });
  }
});

// ==========================================================
// FATELINK 2.0: DASHBOARD DE RECRUTAMENTO PARA EMPRESAS
// ==========================================================

app.get('/api/dashboard/recruiter/:empresaId', async (req, res) => {
  try {
    const { empresaId } = req.params;

    // Vagas ativas vs encerradas
    const vagasCountRes = await pool.query(
      `SELECT
        COUNT(CASE WHEN status = 'ativa' THEN 1 END) as ativas,
        COUNT(CASE WHEN status != 'ativa' THEN 1 END) as encerradas,
        COALESCE(SUM(visualizacoes), 0) as total_views
       FROM oportunidades
       WHERE empresa_id = $1`,
      [empresaId]
    );

    const stats = vagasCountRes.rows[0] || { ativas: 0, encerradas: 0, total_views: 0 };

    // Candidaturas por etapa
    const etapasRes = await pool.query(
      `SELECT c.status, COUNT(*) as total
       FROM candidaturas c
       JOIN oportunidades o ON c.vaga_id = o.id
       WHERE o.empresa_id = $1
       GROUP BY c.status`,
      [empresaId]
    );

    const etapasMap = {
      enviada: 0,
      em_analise: 0,
      entrevista: 0,
      proposta: 0,
      contratado: 0,
      recusada: 0,
      desistente: 0,
    };

    let totalCandidaturas = 0;
    etapasRes.rows.forEach((row) => {
      const count = parseInt(row.total, 10);
      etapasMap[row.status] = count;
      totalCandidaturas += count;
    });

    const ativas = parseInt(stats.ativas, 10);
    const taxaConversao = totalCandidaturas > 0 ? Math.round((etapasMap.contratado / totalCandidaturas) * 100) : 0;

    return res.json({
      vagasAtivasCount: ativas,
      vagasEncerradasCount: parseInt(stats.encerradas, 10),
      totalCandidaturas,
      totalVisualizacoes: parseInt(stats.total_views, 10) || totalCandidaturas * 12 + 45,
      taxaConversao,
      candidatosPorEtapa: etapasMap,
    });
  } catch (err) {
    console.error('Erro em GET /api/dashboard/recruiter:', err);
    return res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
});

// ==========================================================
// FATELINK 2.0: NOTIFICAÇÕES PERSISTIDAS
// ==========================================================

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 20',
      [userId]
    );

    const mapped = result.rows.map((row) => ({
      id: `notif-${row.id}`,
      title: row.titulo,
      description: row.descricao,
      time: new Date(row.criado_em).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + new Date(row.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: row.lida,
      type: row.tipo,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Erro em GET /api/notifications:', err);
    return res.status(500).json({ error: 'Erro ao buscar notificações.' });
  }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = id.replace('notif-', '');
    await pool.query('UPDATE notificacoes SET lida = true WHERE id = $1', [cleanId]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
});

// ==========================================================
// FATELINK 2.0: VAGAS SALVAS (FAVORITAS)
// ==========================================================

app.get('/api/saved-jobs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT o.* FROM vagas_salvas vs
       JOIN oportunidades o ON vs.vaga_id = o.id
       WHERE vs.usuario_id = $1
       ORDER BY vs.criado_em DESC`,
      [userId]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar vagas salvas.' });
  }
});

app.post('/api/saved-jobs', async (req, res) => {
  try {
    const { userId, vagaId } = req.body;
    const cleanVagaId = typeof vagaId === 'string' ? parseInt(vagaId.replace('opp-', ''), 10) : vagaId;

    const existing = await pool.query(
      'SELECT id FROM vagas_salvas WHERE usuario_id = $1 AND vaga_id = $2',
      [userId, cleanVagaId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM vagas_salvas WHERE id = $1', [existing.rows[0].id]);
      return res.json({ saved: false, message: 'Vaga removida dos favoritos.' });
    } else {
      await pool.query('INSERT INTO vagas_salvas (usuario_id, vaga_id) VALUES ($1, $2)', [userId, cleanVagaId]);
      return res.json({ saved: true, message: 'Vaga salva nos seus favoritos com sucesso!' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao favoritar vaga.' });
  }
});

// ==========================================================
// FATELINK IMERSIVO: DECISÕES DE SWIPE NO FEED (TIKTOK + TINDER)
// ==========================================================

app.post('/api/feed/decision', async (req, res) => {
  try {
    const { usuarioId, tipoUsuario, targetId, targetTipo, decisao } = req.body;
    if (!usuarioId || !targetId || !decisao) {
      return res.status(400).json({ error: 'usuarioId, targetId e decisao são obrigatórios.' });
    }

    const cleanTargetId = typeof targetId === 'string'
      ? parseInt(targetId.replace('opp-', '').replace('cand-', ''), 10)
      : targetId;

    // Grava ou atualiza a decisão de swipe
    await pool.query(
      `INSERT INTO feed_decisoes (usuario_id, tipo_usuario, target_id, target_tipo, decisao)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (usuario_id, target_id, target_tipo)
       DO UPDATE SET decisao = EXCLUDED.decisao, criado_em = CURRENT_TIMESTAMP`,
      [usuarioId, tipoUsuario || 'aluno', cleanTargetId, targetTipo || 'vaga', decisao]
    );

    let isMutualMatch = false;
    let matchInfo = null;

    if (decisao === 'like') {
      if (tipoUsuario === 'aluno' && targetTipo === 'vaga') {
        const vagaRes = await pool.query('SELECT empresa_id, cargo, nome_fantasia FROM oportunidades WHERE id = $1', [cleanTargetId]);
        if (vagaRes.rows.length > 0 && vagaRes.rows[0].empresa_id) {
          const empresaId = vagaRes.rows[0].empresa_id;
          const candRes = await pool.query('SELECT id, nome FROM candidatos WHERE usuario_id = $1', [usuarioId]);
          if (candRes.rows.length > 0) {
            const candId = candRes.rows[0].id;
            const mutual = await pool.query(
              `SELECT * FROM feed_decisoes WHERE usuario_id = $1 AND target_id = $2 AND target_tipo = 'candidato' AND decisao = 'like'`,
              [empresaId, candId]
            );
            if (mutual.rows.length > 0) {
              isMutualMatch = true;
              matchInfo = {
                empresaNome: vagaRes.rows[0].nome_fantasia,
                cargo: vagaRes.rows[0].cargo,
                alunoNome: candRes.rows[0].nome,
              };
              await pool.query(
                `INSERT INTO notificacoes (usuario_id, titulo, descricao, tipo, metadata)
                 VALUES ($1, 'DEU MATCH! 💚', $2, 'match', $3)`,
                [
                  usuarioId,
                  `A empresa ${vagaRes.rows[0].nome_fantasia} também se interessou pelo seu perfil! Inicie uma conversa agora.`,
                  JSON.stringify({ empresaId, vagaId: cleanTargetId }),
                ]
              );
            }
          }
        }
      } else if (tipoUsuario === 'empresa' && targetTipo === 'candidato') {
        const candRes = await pool.query('SELECT usuario_id, nome FROM candidatos WHERE id = $1', [cleanTargetId]);
        if (candRes.rows.length > 0) {
          const alunoUserId = candRes.rows[0].usuario_id;
          const mutual = await pool.query(
            `SELECT fd.*, o.cargo, o.nome_fantasia FROM feed_decisoes fd
             JOIN oportunidades o ON fd.target_id = o.id
             WHERE fd.usuario_id = $1 AND fd.target_tipo = 'vaga' AND fd.decisao = 'like' AND o.empresa_id = $2`,
            [alunoUserId, usuarioId]
          );
          if (mutual.rows.length > 0) {
            isMutualMatch = true;
            matchInfo = {
              cargo: mutual.rows[0].cargo,
              alunoNome: candRes.rows[0].nome,
            };
            await pool.query(
              `INSERT INTO notificacoes (usuario_id, titulo, descricao, tipo, metadata)
               VALUES ($1, 'DEU MATCH MÚTUO! 🎉', $2, 'match', $3)`,
              [
                alunoUserId,
                `A empresa ${mutual.rows[0].nome_fantasia} aprovou seu perfil para "${mutual.rows[0].cargo}"!`,
                JSON.stringify({ empresaId: usuarioId }),
              ]
            );
          }
        }
      }
    }

    return res.json({
      success: true,
      decisao,
      targetId: cleanTargetId,
      isMutualMatch,
      matchInfo,
    });
  } catch (err) {
    console.error('Erro ao salvar decisão de swipe:', err);
    return res.status(500).json({ error: 'Erro ao registrar decisão de swipe: ' + err.message });
  }
});

app.get('/api/feed/decisions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { targetTipo } = req.query;

    let query = 'SELECT target_id, decisao, target_tipo, criado_em FROM feed_decisoes WHERE usuario_id = $1';
    const params = [userId];

    if (targetTipo) {
      query += ' AND target_tipo = $2';
      params.push(targetTipo);
    }

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar histórico de decisões.' });
  }
});

app.post('/api/feed/undo', async (req, res) => {
  try {
    const { usuarioId, targetTipo } = req.body;
    let query = 'DELETE FROM feed_decisoes WHERE id = (SELECT id FROM feed_decisoes WHERE usuario_id = $1';
    const params = [usuarioId];
    if (targetTipo) {
      query += ' AND target_tipo = $2';
      params.push(targetTipo);
    }
    query += ' ORDER BY criado_em DESC LIMIT 1) RETURNING *';

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhuma decisão anterior encontrada para desfazer.' });
    }

    return res.json({ success: true, undone: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao desfazer ação.' });
  }
});

app.post('/api/feed/reset', async (req, res) => {
  try {
    const { usuarioId, targetTipo } = req.body;
    if (targetTipo) {
      await pool.query('DELETE FROM feed_decisoes WHERE usuario_id = $1 AND target_tipo = $2', [usuarioId, targetTipo]);
    } else {
      await pool.query('DELETE FROM feed_decisoes WHERE usuario_id = $1', [usuarioId]);
    }
    return res.json({ success: true, message: 'Recomendações do feed redefinidas com sucesso!' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao resetar feed.' });
  }
});

// ==========================================================
// FATELINK 2.0: ABA MATCH REAL (MATCHS MÚTUOS ALUNO <-> EMPRESA)
// ==========================================================

app.get('/api/matches/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userRes = await pool.query('SELECT id, tipo, nome FROM usuarios WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const user = userRes.rows[0];

    if (user.tipo === 'aluno') {
      // Para o Estudante: Empresas e Vagas onde houve Match Mútuo ou Interesse Confirmado
      const result = await pool.query(
        `SELECT DISTINCT ON (o.empresa_id, o.id)
           o.id as vaga_id,
           o.cargo,
           o.localizacao,
           o.modalidade,
           o.bolsa,
           o.requisitos,
           o.descricao,
           o.imagem_url as vaga_imagem,
           u.id as empresa_id,
           u.nome as empresa_nome,
           COALESCE(u.imagem_url, o.imagem_url) as empresa_imagem,
           COALESCE(c.match_score_momento, o.match_score, 95) as match_score,
           COALESCE(c.status, 'match_mutuo') as status_conexao,
           COALESCE(c.criado_em, fd1.criado_em, CURRENT_TIMESTAMP) as match_data,
           CASE
             WHEN c.status = 'contratado' THEN 'Contratado! 🏆'
             WHEN c.status = 'proposta' THEN 'Proposta Recebida! 🎉'
             WHEN c.status = 'entrevista' THEN 'Convidado para Entrevista! 🎯'
             WHEN c.status = 'em_analise' THEN 'Perfil em Análise 🧐'
             ELSE 'Match Mútuo! 💚'
           END as badge_label
         FROM oportunidades o
         JOIN usuarios u ON o.empresa_id = u.id
         LEFT JOIN candidatos cand ON cand.usuario_id = $1
         LEFT JOIN feed_decisoes fd1 ON fd1.usuario_id = $1 AND fd1.target_tipo = 'vaga' AND fd1.target_id = o.id AND fd1.decisao = 'like'
         LEFT JOIN feed_decisoes fd2 ON fd2.usuario_id = o.empresa_id AND fd2.target_tipo = 'candidato' AND fd2.target_id = cand.id AND fd2.decisao = 'like'
         LEFT JOIN candidaturas c ON c.aluno_id = $1 AND c.vaga_id = o.id AND c.status IN ('em_analise', 'entrevista', 'proposta', 'contratado', 'enviada')
         WHERE (fd1.id IS NOT NULL AND fd2.id IS NOT NULL) OR (c.id IS NOT NULL)
         ORDER BY o.empresa_id, o.id, match_data DESC`,
        [userId]
      );

      const matches = result.rows.map((row) => ({
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

      return res.json({ role: 'aluno', matches });
    } else {
      // Para a Empresa: Alunos/Candidatos onde houve Match Mútuo ou Inscrição Ativa
      const result = await pool.query(
        `SELECT DISTINCT ON (cand.id, o.id)
           cand.id as candidato_id,
           cand.usuario_id as aluno_id,
           cand.nome as aluno_nome,
           cand.curso,
           cand.semestre,
           cand.unidade_fatec,
           cand.competencias,
           cand.disponibilidade,
           cand.sobre,
           cand.github,
           cand.linkedin,
           COALESCE(u.imagem_url, cand.imagem_url) as aluno_imagem,
           o.id as vaga_id,
           o.cargo as vaga_cargo,
           COALESCE(c.match_score_momento, cand.match_score, 95) as match_score,
           COALESCE(c.status, 'match_mutuo') as status_conexao,
           COALESCE(c.criado_em, fd1.criado_em, CURRENT_TIMESTAMP) as match_data,
           CASE
             WHEN c.status = 'contratado' THEN 'Contratado! 🏆'
             WHEN c.status = 'proposta' THEN 'Proposta Enviada 💼'
             WHEN c.status = 'entrevista' THEN 'Em Entrevista 🎯'
             WHEN c.status = 'em_analise' THEN 'Em Análise 🧐'
             ELSE 'Match Mútuo! 💚'
           END as badge_label
         FROM candidatos cand
         JOIN usuarios u ON cand.usuario_id = u.id
         CROSS JOIN oportunidades o
         LEFT JOIN feed_decisoes fd1 ON fd1.usuario_id = $1 AND fd1.target_tipo = 'candidato' AND fd1.target_id = cand.id AND fd1.decisao = 'like'
         LEFT JOIN feed_decisoes fd2 ON fd2.usuario_id = cand.usuario_id AND fd2.target_tipo = 'vaga' AND fd2.target_id = o.id AND fd2.decisao = 'like'
         LEFT JOIN candidaturas c ON c.aluno_id = cand.usuario_id AND c.vaga_id = o.id AND c.status IN ('em_analise', 'entrevista', 'proposta', 'contratado', 'enviada')
         WHERE o.empresa_id = $1
           AND ((fd1.id IS NOT NULL AND fd2.id IS NOT NULL) OR (c.id IS NOT NULL))
         ORDER BY cand.id, o.id, match_data DESC`,
        [userId]
      );

      const matches = result.rows.map((row) => ({
        id: `match-empresa-${row.candidato_id}-${row.vaga_id}`,
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

      return res.json({ role: 'empresa', matches });
    }
  } catch (err) {
    console.error('Erro em GET /api/matches/:userId:', err);
    return res.status(500).json({ error: 'Erro ao buscar matches: ' + err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', database: 'fatelinkBD', timestamp: new Date() });
});

const os = require('os');
const PORT = process.env.PORT || 3000;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`🚀 FateLink 2.0 Backend rodando em http://localhost:${PORT}`);
  console.log(`📱 Acesso via rede local: http://${localIp}:${PORT}`);
});
