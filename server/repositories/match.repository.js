const pool = require('../config/db');

const matchRepository = {
  async findStudentMatches(userId) {
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
    return result.rows;
  },

  async findCompanyMatches(userId) {
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
    return result.rows;
  }
};

module.exports = matchRepository;
