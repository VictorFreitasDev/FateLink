// ==========================================================
// FATELINK 2.0: SUITE DE TESTES DE COMUNICAÇÃO E CANDIDATURAS (ETAPA 8)
// ==========================================================

const assert = require('assert');
const pool = require('../config/db');
const chatService = require('../services/chat.service');
const interviewService = require('../services/interview.service');
const applicationService = require('../services/application.service');
const notificationRepository = require('../repositories/notification.repository');

console.log('====================================================');
console.log('🧪 INICIANDO TESTES DE COMUNICAÇÃO & CANDIDATURAS (ETAPA 8)');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runAsyncTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Detalhes: ${err.message}\n`);
  }
}

async function runSuite() {
  const alunoId = 1; // Victor Freitas
  const empresaId = 4; // IBM Brasil
  const vagaId = 1; // Estagiário de Desenvolvimento Full-Stack

  // -------------------------------------------------------------
  // 1. CHAT PERSISTENTE E PREVENÇÃO DE CONVERSAS DUPLICADAS
  // -------------------------------------------------------------
  let testConv = null;

  await runAsyncTest('Cenário 1: Iniciar conversa real e prevenir criação de conversas duplicadas', async () => {
    // Primeira chamada: cria ou recupera
    const conv1 = await chatService.startOrGetConversation(alunoId, empresaId, vagaId);
    assert(conv1 && conv1.id, 'Conversa 1 deve ser válida com ID');
    testConv = conv1;

    // Segunda chamada idêntica: deve retornar a MESMA conversa sem duplicar
    const conv2 = await chatService.startOrGetConversation(alunoId, empresaId, vagaId);
    assert.strictEqual(conv1.id, conv2.id, 'Deve retornar a mesma conversa para evitar duplicatas');

    // Terceira chamada com ordem invertida dos IDs (empresa -> aluno)
    const conv3 = await chatService.startOrGetConversation(empresaId, alunoId, vagaId);
    assert.strictEqual(conv1.id, conv3.id, 'Deve reconhecer participantes independentemente da ordem');
  });

  // -------------------------------------------------------------
  // 2. ENVIO DE MENSAGENS COM PERSISTÊNCIA E NOTIFICAÇÃO
  // -------------------------------------------------------------
  let testMsgId = null;

  await runAsyncTest('Cenário 2: Envio de mensagem persistente com atualização de status e notificação', async () => {
    assert(testConv, 'Conversa de teste deve existir');
    const msgText = 'Olá! Gostaria de saber mais sobre as tecnologias utilizadas na vaga.';

    const sent = await chatService.sendMessage(testConv.id, alunoId, msgText);
    assert(sent && sent.id, 'Mensagem deve ser gerada');
    assert.strictEqual(sent.text, msgText);
    testMsgId = sent.id;

    // Consulta mensagens da conversa pelo destinatário (empresa)
    const msgs = await chatService.getMessages(testConv.id, empresaId);
    const found = msgs.find((m) => m.text === msgText);
    assert(found, 'Mensagem enviada deve constar no histórico da conversa');

    // Confirma que foi gerada uma notificação persistente para o destinatário (empresa)
    const notifs = await notificationRepository.findByUser(empresaId);
    const msgNotif = notifs.find((n) => n.tipo === 'mensagem' && n.metadata?.conversaId === testConv.id);
    assert(msgNotif, 'Notificação de nova mensagem deve ser persistida para o destinatário');
  });

  // -------------------------------------------------------------
  // 3. LEITURA DE MENSAGENS E CONTROLE DE NÃO LIDAS
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 3: Marcação automática de mensagens como lidas ao abrir conversa', async () => {
    assert(testConv, 'Conversa de teste deve existir');

    // Ao consultar com currentUserId = empresaId, marca mensagens do aluno como lidas
    await chatService.getMessages(testConv.id, empresaId);

    // Consulta no banco de dados para confirmar campo lida = true
    const cleanMsgId = parseInt(String(testMsgId).replace('msg-', ''), 10);
    const checkDb = await pool.query('SELECT lida FROM mensagens WHERE id = $1', [cleanMsgId]);
    assert.strictEqual(checkDb.rows[0].lida, true, 'Mensagem deve estar com lida = true no banco de dados');
  });

  // -------------------------------------------------------------
  // 4. NOTIFICAÇÕES: DEDUPLICAÇÃO E MARCAR TODAS COMO LIDAS
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 4: Deduplicação de notificações repetidas e ação de marcar todas como lidas', async () => {
    const payload = {
      usuarioId: alunoId,
      titulo: 'Atualização de Processo Seletivo FATEC',
      descricao: 'Seu perfil avançou de etapa no processo.',
      tipo: 'status',
    };

    // Cria notificação 1
    const n1 = await notificationRepository.create(payload);
    assert(n1 && n1.id, 'Notificação 1 deve ser criada');

    // Cria notificação 2 idêntica em curto intervalo: deve reutilizar sem duplicar
    const n2 = await notificationRepository.create(payload);
    assert.strictEqual(n1.id, n2.id, 'Deduplicação deve evitar notificações repetidas em menos de 3 minutos');

    // Marcar todas como lidas
    const markedCount = await notificationRepository.markAllAsRead(alunoId);
    assert(typeof markedCount === 'number', 'Deve retornar número de notificações marcadas');

    const unreadCheck = await pool.query('SELECT COUNT(*) FROM notificacoes WHERE usuario_id = $1 AND lida = false', [alunoId]);
    assert.strictEqual(parseInt(unreadCheck.rows[0].count, 10), 0, 'Todas as notificações devem estar lidas');
  });

  // -------------------------------------------------------------
  // 5. AGENDAMENTO DE ENTREVISTA: PROPOSTA DA EMPRESA
  // -------------------------------------------------------------
  let testInterviewId = null;
  const testCandidaturaId = 1; // Candidatura existente

  await runAsyncTest('Cenário 5: Empresa propõe horários de entrevista com persistência e notificação', async () => {
    // Garante que a candidatura 1 existe e pertence à vaga da empresa 4
    const slots = ['2026-10-28 às 14:00', '2026-10-29 às 10:30'];
    const interview = await interviewService.proposeInterview({
      candidaturaId: testCandidaturaId,
      empresaId,
      formato: 'online',
      linkOuLocal: 'https://meet.google.com/fatec-tech-interview',
      horariosPropostos: slots,
      observacoes: 'Bate-papo técnico sobre arquitetura com React Native.',
    });

    assert(interview && interview.id, 'Entrevista deve ser gerada no banco');
    testInterviewId = interview.id;
    assert.strictEqual(interview.status, 'pendente');
    assert.strictEqual(interview.formato, 'online');

    // Notificação persistida para o aluno
    const notifs = await notificationRepository.findByUser(alunoId);
    const intvNotif = notifs.find((n) => n.tipo === 'entrevista');
    assert(intvNotif, 'Estudante deve receber notificação de convite para entrevista');
  });

  // -------------------------------------------------------------
  // 6. AGENDAMENTO DE ENTREVISTA: CONFIRMAÇÃO PELO ESTUDANTE
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 6: Estudante escolhe e confirma horário, notificando a empresa contratante', async () => {
    assert(testInterviewId, 'ID da entrevista deve existir');
    const chosenSlot = '2026-10-28 às 14:00';

    const confirmed = await interviewService.confirmInterview(testInterviewId, alunoId, chosenSlot);
    assert(confirmed, 'Entrevista confirmada deve retornar');
    assert.strictEqual(confirmed.status, 'confirmada');
    assert.strictEqual(confirmed.horario_confirmado, chosenSlot);

    // Consulta por candidatura
    const byApp = await interviewService.getInterviewByCandidatura(testCandidaturaId);
    assert(byApp, 'Entrevista deve ser consultada pela candidatura');
    assert.strictEqual(byApp.status, 'confirmada');
    assert.strictEqual(byApp.horario_confirmado, chosenSlot);

    // Auditoria em historico_candidaturas
    const history = await applicationService.getApplicationHistory(testCandidaturaId);
    const hasConfirmation = history.some((h) => h.motivo && h.motivo.includes('Horário de entrevista confirmado'));
    assert(hasConfirmation, 'Confirmação deve constar na auditoria da candidatura');
  });

  // -------------------------------------------------------------
  // FINALIZAÇÃO
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
  console.log('====================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite().catch((e) => {
  console.error('Erro na execução da suíte de Comunicação e Candidaturas:', e);
  process.exit(1);
});

