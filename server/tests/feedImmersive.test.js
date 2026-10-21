const assert = require('assert');
const pool = require('../config/db');
const authService = require('../services/auth.service');
const candidateService = require('../services/candidate.service');
const opportunityService = require('../services/opportunity.service');
const feedService = require('../services/feed.service');

async function runFeedImmersiveTests() {
  console.log('====================================================');
  console.log('📱 TESTES DO FEED IMERSIVO FATELINK 2.0 (ETAPA 3)');
  console.log('====================================================\n');

  try {
    const dbTest = await pool.query('SELECT 1 + 1 AS result');
    assert.strictEqual(dbTest.rows[0].result, 2, 'Banco PostgreSQL deve responder');
    console.log('✅ Conectado com sucesso ao PostgreSQL (fatelinkBD)!');

    const unique = Date.now();
    const studentUser = await authService.register({
      tipo: 'aluno',
      nome: 'Estudante Feed Imersivo',
      email: `feed_${unique}@fatec.sp.gov.br`,
      documento: `RA-${unique.toString().slice(-8)}`,
      senha: 'senha123',
      curso_ou_ramo: 'Desenvolvimento de Software Multiplataforma',
    });

    const companyUser = await authService.register({
      tipo: 'empresa',
      nome: 'Tech Immersive S/A',
      email: `tech_${unique}@empresa.com`,
      documento: `CNPJ-${unique.toString().slice(-10)}`,
      senha: 'senha123',
      curso_ou_ramo: 'Tecnologia da Informação',
    });

    const candProfile = await candidateService.getProfileByUserId(studentUser.id);
    assert(candProfile, 'Perfil do candidato deve existir');

    const oppCreated = await opportunityService.createOpportunity({
      empresaId: companyUser.id,
      cargo: 'Desenvolvedor Mobile Júnior (React Native)',
      area: 'Tecnologia da Informação',
      cursoRelacionado: 'Desenvolvimento de Software Multiplataforma',
      localizacao: 'Jales, SP (Híbrido)',
      modalidade: 'Híbrido',
      tipo: 'Estágio',
      bolsa: 'R$ 1.800,00',
      descricao: 'Atuação no app mobile com React Native, Expo e APIs REST.',
      requisitos: ['React Native', 'TypeScript', 'Git'],
      beneficios: ['Bolsa auxílio', 'Seguro de vida', 'Vale transporte'],
      imagemUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    });

    // 1. Cenário: Registro de Like do Aluno na Vaga
    console.log('🧪 Cenário 1: Estudante curte vaga no Swipe...');
    const decAluno = await feedService.recordDecision(
      studentUser.id,
      'aluno',
      oppCreated.id,
      'vaga',
      'like'
    );
    assert.strictEqual(decAluno.success, true);
    assert.strictEqual(decAluno.decisao, 'like');
    assert.strictEqual(decAluno.isMutualMatch, false, 'Ainda não é mútuo pois empresa não curtiu');
    console.log('✅ [PASS] Cenário 1: Decisão de like do aluno persistida.');

    // 2. Cenário: Consulta de Decisões Anteriores (para não repetir no Feed)
    console.log('🧪 Cenário 2: Consulta de decisões anteriores para exclusão do feed...');
    const previousDecs = await feedService.getUserDecisions(studentUser.id, 'vaga');
    assert.ok(Array.isArray(previousDecs));
    assert.ok(previousDecs.some((d) => d.target_id === oppCreated.dbId && d.decisao === 'like'));
    console.log('✅ [PASS] Cenário 2: Decisão de swipe encontrada no histórico.');

    // 3. Cenário: Empresa curte o Estudante -> Detecção de Match Mútuo!
    console.log('🧪 Cenário 3: Empresa curte o candidato correspondente (Disparo de Match Mútuo)...');
    const decEmpresa = await feedService.recordDecision(
      companyUser.id,
      'empresa',
      candProfile.dbId,
      'candidato',
      'like'
    );
    assert.strictEqual(decEmpresa.success, true);
    assert.strictEqual(decEmpresa.isMutualMatch, true, 'Deve identificar Match Mútuo');
    assert.ok(decEmpresa.matchInfo, 'Deve retornar matchInfo detalhado');
    assert.strictEqual(decEmpresa.matchInfo.cargo, oppCreated.cargo);
    assert.strictEqual(decEmpresa.matchInfo.alunoNome, candProfile.nome);
    console.log('✅ [PASS] Cenário 3: Match Mútuo detectado com sucesso entre Aluno e Empresa!');

    // 4. Cenário: Registro de Notificação Automática do Match
    console.log('🧪 Cenário 4: Verificação de notificação gerada para o estudante...');
    const notifs = await pool.query(
      `SELECT * FROM notificacoes WHERE usuario_id = $1 AND tipo = 'match' ORDER BY id DESC LIMIT 1`,
      [studentUser.id]
    );
    assert.ok(notifs.rows.length > 0, 'Notificação de match deve existir no banco');
    assert.ok(notifs.rows[0].titulo.includes('MATCH'));
    console.log('✅ [PASS] Cenário 4: Notificação real de match persistida no banco.');

    // 5. Cenário: Desfazer Decisão (Undo Swipe)
    console.log('🧪 Cenário 5: Desfazer última decisão (Undo)...');
    const undoRes = await feedService.undoDecision(companyUser.id, 'candidato');
    assert.ok(undoRes, 'Ação de desfazer deve retornar o registro removido');
    const afterUndo = await feedService.getUserDecisions(companyUser.id, 'candidato');
    assert.strictEqual(afterUndo.length, 0, 'Histórico de decisão da empresa deve estar limpo após undo');
    console.log('✅ [PASS] Cenário 5: Ação de desfazer (Undo) executada com sucesso.');

    // 6. Cenário: Reset Completo do Feed (Rever recomendações)
    console.log('🧪 Cenário 6: Resetar avaliações para rever feed...');
    await feedService.resetFeed(studentUser.id, 'vaga');
    const afterReset = await feedService.getUserDecisions(studentUser.id, 'vaga');
    assert.strictEqual(afterReset.length, 0, 'Feed deve estar zerado permitindo reavaliação de todos os cards');
    console.log('✅ [PASS] Cenário 6: Reset de feed redefiniu recomendações.');

    // Limpeza dos dados de teste
    await pool.query(`DELETE FROM feed_decisoes WHERE usuario_id IN ($1, $2)`, [studentUser.id, companyUser.id]);
    await pool.query(`DELETE FROM notificacoes WHERE usuario_id IN ($1, $2)`, [studentUser.id, companyUser.id]);
    await pool.query(`DELETE FROM candidaturas WHERE aluno_id = $1`, [studentUser.id]);
    await pool.query(`DELETE FROM candidatos WHERE usuario_id = $1`, [studentUser.id]);
    await pool.query(`DELETE FROM oportunidades WHERE id = $1`, [oppCreated.dbId]);
    await pool.query(`DELETE FROM usuarios WHERE id IN ($1, $2)`, [studentUser.id, companyUser.id]);

    console.log('\n====================================================');
    console.log('🎉 RESULTADO: 6/6 TESTES DO FEED IMERSIVO APROVADOS!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Falha nos testes de feed imersivo:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runFeedImmersiveTests();
