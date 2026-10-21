const feedDecisionRepository = require('../repositories/feedDecision.repository');
const opportunityRepository = require('../repositories/opportunity.repository');
const candidateRepository = require('../repositories/candidate.repository');
const notificationRepository = require('../repositories/notification.repository');
const pool = require('../config/db');

const feedService = {
  async recordDecision(usuarioId, tipoUsuario, targetId, targetTipo, decisao) {
    const cleanTargetId = typeof targetId === 'string'
      ? parseInt(targetId.replace('opp-', '').replace('cand-', ''), 10)
      : targetId;

    await feedDecisionRepository.saveDecision({
      usuarioId,
      tipoUsuario: tipoUsuario || 'aluno',
      targetId: cleanTargetId,
      targetTipo: targetTipo || 'vaga',
      decisao,
    });

    let isMutualMatch = false;
    let matchInfo = null;

    if (decisao === 'like') {
      if (tipoUsuario === 'aluno' && targetTipo === 'vaga') {
        const vaga = await opportunityRepository.findById(cleanTargetId);
        if (vaga && vaga.empresa_id) {
          const empresaId = vaga.empresa_id;
          const cand = await candidateRepository.findByUserId(usuarioId);
          if (cand) {
            const mutual = await pool.query(
              `SELECT * FROM feed_decisoes WHERE usuario_id = $1 AND target_id = $2 AND target_tipo = 'candidato' AND decisao = 'like'`,
              [empresaId, cand.id]
            );
            if (mutual.rows.length > 0) {
              isMutualMatch = true;
              matchInfo = {
                empresaNome: vaga.nome_fantasia || vaga.empresa_nome,
                cargo: vaga.cargo,
                alunoNome: cand.nome,
                empresaId,
                vagaId: cleanTargetId,
                alunoId: usuarioId,
              };
              await notificationRepository.create({
                usuarioId,
                titulo: 'DEU MATCH! 💚',
                descricao: `A empresa ${matchInfo.empresaNome} também se interessou pelo seu perfil! Inicie uma conversa agora.`,
                tipo: 'match',
                metadata: { empresaId, vagaId: cleanTargetId },
              });
            }
          }
        }
      } else if (tipoUsuario === 'empresa' && targetTipo === 'candidato') {
        const cand = await candidateRepository.findById(cleanTargetId);
        if (cand && cand.usuario_id) {
          const alunoUserId = cand.usuario_id;
          const mutual = await pool.query(
            `SELECT fd.*, o.cargo, o.nome_fantasia FROM feed_decisoes fd
             JOIN oportunidades o ON fd.target_id = o.id
             WHERE fd.usuario_id = $1 AND fd.target_tipo = 'vaga' AND fd.decisao = 'like' AND o.empresa_id = $2`,
            [alunoUserId, usuarioId]
          );
          if (mutual.rows.length > 0) {
            isMutualMatch = true;
            matchInfo = {
              empresaNome: mutual.rows[0].nome_fantasia,
              cargo: mutual.rows[0].cargo,
              alunoNome: cand.nome,
              empresaId: usuarioId,
              vagaId: mutual.rows[0].target_id,
              alunoId: alunoUserId,
            };
            await notificationRepository.create({
              usuarioId: alunoUserId,
              titulo: 'DEU MATCH MÚTUO! 🎉',
              descricao: `A empresa ${mutual.rows[0].nome_fantasia} aprovou seu perfil para "${mutual.rows[0].cargo}"!`,
              tipo: 'match',
              metadata: { empresaId: usuarioId },
            });
          }
        }
      }
    }

    return {
      success: true,
      decisao,
      targetId: cleanTargetId,
      isMutualMatch,
      matchInfo,
    };
  },

  async getUserDecisions(userId, targetTipo) {
    return await feedDecisionRepository.findUserDecisions(userId, targetTipo);
  },

  async undoDecision(userId, targetTipo) {
    const undone = await feedDecisionRepository.undoLastDecision(userId, targetTipo);
    if (!undone) {
      throw { status: 404, message: 'Nenhuma decisão anterior encontrada para desfazer.' };
    }
    return undone;
  },

  async resetFeed(userId, targetTipo) {
    await feedDecisionRepository.resetDecisions(userId, targetTipo);
    return true;
  }
};

module.exports = feedService;
