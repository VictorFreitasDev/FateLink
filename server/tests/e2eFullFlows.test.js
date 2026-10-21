/**
 * ====================================================================
 * FATELINK 2.0 — ETAPA 10: TESTES E2E DOS 16 FLUXOS COMPLETOS
 * ====================================================================
 * 
 * Validação ponta a ponta dos fluxos operacionais com PostgreSQL:
 * 1. Cadastro de estudante
 * 2. Cadastro de empresa
 * 3. Login de ambos os perfis
 * 4. Edição de perfil de estudante
 * 5. Upload e persistência de currículo PDF
 * 6. Publicação de vaga pela empresa
 * 7. Consulta de Feed (Vagas e Candidatos)
 * 8. Mecanismo de Filtros multi-critério
 * 9. Decisões do Swipe (Like/Pass)
 * 10. Match mútuo e cálculo de compatibilidade explicável
 * 11. Chat em tempo real (conversas e mensagens)
 * 12. Candidatura a vaga com auditoria histórica
 * 13. Dashboard corporativo e consolidação de KPIs
 * 14. Pipeline Kanban (movimentação entre etapas)
 * 15. Notificações persistentes e controle de lidas
 * 16. Agendamento e confirmação de entrevistas
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { calculateMatch } = require('../services/matchEngine');
const authService = require('../services/auth.service');
const candidateService = require('../services/candidate.service');
const opportunityService = require('../services/opportunity.service');
const feedService = require('../services/feed.service');
const applicationService = require('../services/application.service');
const chatService = require('../services/chat.service');
const dashboardService = require('../services/dashboard.service');
const interviewService = require('../services/interview.service');

console.log('====================================================');
console.log('🚀 TESTES DE INTEGRAÇÃO E2E: 16 FLUXOS DO FATELINK 2.0');
console.log('====================================================\n');

let passedTests = 0;

async function runTest(fluxoNum, title, fn) {
  try {
    await fn();
    console.log(`✅ [FLUXO ${fluxoNum}] ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FLUXO ${fluxoNum} FALHOU] ${title}`);
    console.error(err);
    process.exit(1);
  }
}

async function runAllFlows() {
  const timestamp = Date.now();
  let studentUserId = null;
  let studentCandidateId = null;
  let companyUserId = null;
  let studentEmail = null;
  let companyEmail = null;
  let opportunityId = null;
  let applicationId = null;
  let conversationId = null;
  let interviewId = null;

  // ----------------------------------------------------
  // FLUXO 1: CADASTRO DE ESTUDANTE
  // ----------------------------------------------------
  await runTest(1, 'Cadastro de estudante no banco de dados', async () => {
    studentEmail = `aluno_e2e_${timestamp}@fatec.sp.gov.br`;
    const doc = `RA-${timestamp.toString().slice(-8)}`;

    const userRes = await authService.register({
      tipo: 'aluno',
      nome: 'Lucas Silva FATEC',
      email: studentEmail,
      documento: doc,
      senha: 'senha123',
      curso_ou_ramo: 'Desenvolvimento de Software Multiplataforma',
    });

    studentUserId = userRes.id;
    assert.strictEqual(userRes.tipo, 'aluno');

    const cand = await candidateService.getProfileByUserId(studentUserId);
    assert(cand, 'Registro do candidato deve ser criado automaticamente no cadastro');
    studentCandidateId = cand.dbId;
    assert(studentCandidateId > 0, 'Candidato deve possuir ID válido');
  });

  // ----------------------------------------------------
  // FLUXO 2: CADASTRO DE EMPRESA
  // ----------------------------------------------------
  await runTest(2, 'Cadastro de empresa parceira no banco de dados', async () => {
    companyEmail = `empresa_e2e_${timestamp}@techcorp.com.br`;
    const cnpj = `CNPJ-${timestamp.toString().slice(-10)}`;

    const userRes = await authService.register({
      tipo: 'empresa',
      nome: 'TechCorp Soluções Digitais',
      email: companyEmail,
      documento: cnpj,
      senha: 'empresa123',
      curso_ou_ramo: 'Tecnologia da Informação',
    });

    companyUserId = userRes.id;
    assert.strictEqual(userRes.tipo, 'empresa');
    assert(companyUserId > 0, 'Empresa deve possuir ID válido');
  });

  // ----------------------------------------------------
  // FLUXO 3: LOGIN
  // ----------------------------------------------------
  await runTest(3, 'Autenticação e Login de ambos os perfis', async () => {
    const studentLogin = await authService.login(studentEmail, 'senha123');
    assert(studentLogin && studentLogin.id);
    assert.strictEqual(studentLogin.tipo, 'aluno');

    const companyLogin = await authService.login(companyEmail, 'empresa123');
    assert(companyLogin && companyLogin.id);
    assert.strictEqual(companyLogin.tipo, 'empresa');
  });

  // ----------------------------------------------------
  // FLUXO 4: EDIÇÃO DE PERFIL
  // ----------------------------------------------------
  await runTest(4, 'Edição e atualização do perfil do estudante', async () => {
    const updated = await candidateService.updateProfileByUserId(studentUserId, {
      previsaoFormacao: 'Dezembro / 2026',
      github: 'https://github.com/lucassilva-fatec',
      linkedin: 'https://linkedin.com/in/lucassilva-fatec',
      portfolio: 'https://lucasfatec.dev',
      competencias: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      projetos: [
        {
          titulo: 'FATElink App',
          descricao: 'Aplicativo de conexão universitária',
          tecnologias: ['React Native', 'Expo', 'Express'],
          githubUrl: 'https://github.com/lucassilva-fatec/fatelink',
        },
      ],
    });

    assert.strictEqual(updated.previsaoFormacao, 'Dezembro / 2026');
    assert.strictEqual(updated.github, 'https://github.com/lucassilva-fatec');
    assert(updated.competencias.includes('Docker'), 'Competências devem conter Docker');
  });

  // ----------------------------------------------------
  // FLUXO 5: UPLOAD DE CURRÍCULO
  // ----------------------------------------------------
  await runTest(5, 'Upload de currículo PDF real com persistência em disco', async () => {
    const dummyPdfBase64 = Buffer.from('%PDF-1.4 E2E Test PDF for FateLink').toString('base64');
    const uploadRes = await candidateService.uploadResume(studentUserId, {
      fileName: `curriculo_lucas_${timestamp}.pdf`,
      base64: dummyPdfBase64,
    });

    assert(uploadRes.curriculoUrl.includes('/uploads/resumes/'));
    const diskPath = path.join(__dirname, '..', uploadRes.curriculoUrl);
    assert(fs.existsSync(diskPath), 'Arquivo PDF físico deve existir no disco');

    // Remoção limpa
    await candidateService.deleteResume(studentUserId);
    assert(!fs.existsSync(diskPath), 'Arquivo físico deve ter sido removido com sucesso');
  });

  // ----------------------------------------------------
  // FLUXO 6: PUBLICAÇÃO DE VAGA
  // ----------------------------------------------------
  await runTest(6, 'Publicação de nova vaga pela empresa parceira', async () => {
    const oppRes = await opportunityService.createOpportunity({
      empresaId: companyUserId,
      empresa: 'TechCorp Soluções Digitais',
      nomeFantasia: 'TechCorp Soluções Digitais',
      cargo: 'Estágio em Desenvolvimento Full Stack',
      area: 'Tecnologia da Informação',
      cursoRelacionado: 'Desenvolvimento de Software Multiplataforma',
      localizacao: 'Jales, SP',
      modalidade: 'Híbrido',
      tipo: 'Estágio',
      bolsa: 'R$ 1.800,00',
      descricao: 'Vaga para atuar em soluções mobile com React Native e backend Node.js.',
      requisitos: ['React Native', 'TypeScript', 'Node.js'],
      beneficios: ['Bolsa-auxílio', 'Vale-transporte', 'Seguro de vida', 'Gympass'],
      matchScore: 92,
    });

    assert(oppRes.dbId > 0);
    opportunityId = oppRes.dbId;
    assert.strictEqual(oppRes.cargo, 'Estágio em Desenvolvimento Full Stack');
    assert.strictEqual(oppRes.status, 'ativa');
  });

  // ----------------------------------------------------
  // FLUXO 7: FEED
  // ----------------------------------------------------
  await runTest(7, 'Carregamento do Feed de Oportunidades e Candidatos', async () => {
    const opps = await opportunityService.getOpportunities(studentUserId);
    assert(Array.isArray(opps));
    const createdOpp = opps.find((o) => o.dbId === opportunityId);
    assert(createdOpp, 'Vaga recém-criada deve constar no feed');

    const cands = await candidateService.getCandidates();
    assert(Array.isArray(cands));
    const createdCand = cands.find((c) => c.usuarioId === studentUserId);
    assert(createdCand, 'Candidato recém-criado deve constar no feed');
  });

  // ----------------------------------------------------
  // FLUXO 8: FILTROS
  // ----------------------------------------------------
  await runTest(8, 'Aplicação de filtros multi-critério no feed', async () => {
    const filteredOpps = await opportunityService.getOpportunities(studentUserId, null, {
      modalidade: 'Híbrido',
      curso: 'Desenvolvimento de Software Multiplataforma',
    });

    assert(Array.isArray(filteredOpps));
    assert(filteredOpps.some((o) => o.dbId === opportunityId), 'Vaga compatível deve ser retornada no filtro');

    // Filtro sem correspondência
    const emptyOpps = await opportunityService.getOpportunities(studentUserId, null, {
      modalidade: 'Presencial Exclusivo Inexistente',
    });
    assert(!emptyOpps.some((o) => o.dbId === opportunityId), 'Vaga não deve ser retornada em filtro divergente');
  });

  // ----------------------------------------------------
  // FLUXO 9: SWIPE (LIKE / PASS)
  // ----------------------------------------------------
  await runTest(9, 'Decisões do Swipe (Like/Pass) persistidas no banco', async () => {
    // Aluno curte a vaga
    const resAluno = await feedService.recordDecision(
      studentUserId,
      'aluno',
      opportunityId,
      'vaga',
      'like'
    );
    assert.strictEqual(resAluno.decisao, 'like');

    // Empresa curte o aluno
    const resEmpresa = await feedService.recordDecision(
      companyUserId,
      'empresa',
      studentCandidateId,
      'candidato',
      'like'
    );
    assert.strictEqual(resEmpresa.decisao, 'like');
  });

  // ----------------------------------------------------
  // FLUXO 10: MATCH ENGINE
  // ----------------------------------------------------
  await runTest(10, 'Cálculo de compatibilidade explicável e detecção de match mútuo', async () => {
    const opps = await opportunityService.getOpportunities(studentUserId);
    const opp = opps.find((o) => o.dbId === opportunityId);
    const cand = await candidateService.getProfileByUserId(studentUserId);

    const matchResult = calculateMatch(cand, opp);
    assert(matchResult.score >= 70, `Pontuação deve ser alta (obtido: ${matchResult.score})`);
    assert(matchResult.breakdown.competencias > 10, 'Pontuação de competências deve ser positiva');
    assert(matchResult.matchedSkills.length > 0, 'Deve listar competências compatíveis');
  });

  // ----------------------------------------------------
  // FLUXO 11: CHAT
  // ----------------------------------------------------
  await runTest(11, 'Comunicação via Chat em tempo real (conversa e mensagens)', async () => {
    const conv = await chatService.startOrGetConversation(
      studentUserId,
      companyUserId,
      opportunityId
    );
    assert(conv && conv.id > 0);
    conversationId = conv.id;

    // Aluno envia mensagem
    const msg = await chatService.sendMessage(
      conversationId,
      studentUserId,
      'Olá! Fico muito honrado e disponível para uma conversa!'
    );
    assert(msg && msg.id);
    assert.strictEqual(msg.text, 'Olá! Fico muito honrado e disponível para uma conversa!');

    // Empresa abre a conversa (marca como lida)
    await chatService.getMessages(conversationId, companyUserId);
    const msgs = await chatService.getMessages(conversationId, studentUserId);
    const lastMsg = msgs[msgs.length - 1];
    assert.strictEqual(lastMsg.lida, true, 'Mensagem deve ser marcada como lida pelo destinatário');
  });

  // ----------------------------------------------------
  // FLUXO 12: CANDIDATURA
  // ----------------------------------------------------
  await runTest(12, 'Envio de candidatura com auditoria no histórico', async () => {
    const app = await applicationService.apply(
      studentUserId,
      opportunityId,
      'Gostaria muito de contribuir no time de desenvolvimento com React Native.'
    );
    assert(app && app.id > 0);
    applicationId = app.id;
    assert.strictEqual(app.status, 'enviada');

    const history = await applicationService.getApplicationHistory(applicationId);
    assert(history.length >= 1);
    assert.strictEqual(history[0].status_novo, 'enviada');
  });

  // ----------------------------------------------------
  // FLUXO 13: DASHBOARD
  // ----------------------------------------------------
  await runTest(13, 'Consulta de indicadores reais do Dashboard corporativo', async () => {
    const dash = await dashboardService.getRecruiterDashboard(companyUserId);
    assert(dash && dash.indicadores);
    assert(dash.indicadores.vagasAtivas >= 1, 'Deve possuir ao menos 1 vaga ativa');
    assert(dash.indicadores.totalCandidaturas >= 1, 'Deve possuir ao menos 1 candidatura recebida');
    assert(typeof dash.indicadores.matches === 'number', 'Métrica de matches deve ser numérica e consistente');
  });

  // ----------------------------------------------------
  // FLUXO 14: PIPELINE DE RECRUTAMENTO (KANBAN)
  // ----------------------------------------------------
  await runTest(14, 'Movimentação do candidato pelas etapas do pipeline Kanban', async () => {
    const stages = ['em_analise', 'selecionado', 'entrevista', 'proposta', 'contratado'];

    for (const stage of stages) {
      const moved = await applicationService.updateStatus(
        applicationId,
        stage,
        `Transição de etapa para ${stage}`,
        companyUserId
      );
      assert.strictEqual(moved.status, stage);
    }

    const fullHistory = await applicationService.getApplicationHistory(applicationId);
    assert(fullHistory.length >= 6, 'Histórico deve conter todas as transições de etapa');
  });

  // ----------------------------------------------------
  // FLUXO 15: NOTIFICAÇÕES
  // ----------------------------------------------------
  await runTest(15, 'Notificações persistidas e controle de leitura', async () => {
    const notifRes = await pool.query(
      `INSERT INTO notificacoes (usuario_id, titulo, descricao, tipo, lida, metadata, criado_em)
       VALUES ($1, 'Etapa Concluída!', 'Parabéns, você foi aprovado na oportunidade.', 'status', FALSE, '{}'::jsonb, NOW())
       RETURNING id, titulo, lida`,
      [studentUserId]
    );

    const notifId = notifRes.rows[0].id;
    assert.strictEqual(notifRes.rows[0].lida, false);

    await pool.query('UPDATE notificacoes SET lida = TRUE WHERE id = $1', [notifId]);
    const checkNotif = await pool.query('SELECT lida FROM notificacoes WHERE id = $1', [notifId]);
    assert.strictEqual(checkNotif.rows[0].lida, true);
  });

  // ----------------------------------------------------
  // FLUXO 16: AGENDAMENTO DE ENTREVISTA
  // ----------------------------------------------------
  await runTest(16, 'Agendamento de entrevista (proposta de horários e confirmação)', async () => {
    const proposed = await interviewService.proposeInterview({
      candidaturaId: applicationId,
      empresaId: companyUserId,
      formato: 'online',
      linkOuLocal: 'https://meet.google.com/abc-defg-hij',
      horariosPropostos: [
        'Segunda-feira, 26/10 às 14:30',
        'Terça-feira, 27/10 às 10:00',
      ],
      observacoes: 'Entrevista técnica com o líder de engenharia',
    });

    assert(proposed.id > 0);
    interviewId = proposed.id;
    assert.strictEqual(proposed.status, 'pendente');

    // Aluno confirma um dos horários propostos
    const confirmed = await interviewService.confirmInterview(
      interviewId,
      studentUserId,
      'Segunda-feira, 26/10 às 14:30'
    );

    assert.strictEqual(confirmed.status, 'confirmada');
    assert.strictEqual(confirmed.horario_confirmado, 'Segunda-feira, 26/10 às 14:30');
  });

  // ----------------------------------------------------
  // LIMPEZA FINAL SEGURA DOS DADOS DE TESTE E2E
  // ----------------------------------------------------
  await pool.query('DELETE FROM usuarios WHERE id IN ($1, $2)', [studentUserId, companyUserId]);

  console.log('\n====================================================');
  console.log(`🎉 SUCESSO TOTAL: ${passedTests}/16 FLUXOS OPERACIONAIS VALIDADOS COM ÊXITO!`);
  console.log('====================================================\n');
  process.exit(0);
}

runAllFlows().catch((e) => {
  console.error('Falha geral no teste E2E:', e);
  process.exit(1);
});
