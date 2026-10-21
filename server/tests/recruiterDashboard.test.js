// ==========================================================
// FATELINK 2.0: SUITE DE TESTES DO DASHBOARD EMPRESARIAL (ETAPA 7)
// ==========================================================

const assert = require('assert');
const pool = require('../config/db');
const dashboardService = require('../services/dashboard.service');
const opportunityService = require('../services/opportunity.service');
const applicationService = require('../services/application.service');

console.log('====================================================');
console.log('🧪 INICIANDO TESTES DO DASHBOARD EMPRESARIAL FATELINK 2.0');
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
  const empresaId = 4; // IBM Brasil

  // -------------------------------------------------------------
  // 1. INDICADORES PERSISTIDOS DO RECRUTADOR (7 KPIS)
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 1: Consulta de indicadores reais e persistidos do dashboard corporativo', async () => {
    const dash = await dashboardService.getRecruiterDashboard(empresaId);
    assert(dash, 'Dashboard deve retornar dados');
    assert(dash.indicadores, 'Deve conter objeto indicadores');

    const ind = dash.indicadores;
    assert(typeof ind.vagasAtivas === 'number', 'vagasAtivas deve ser número');
    assert(typeof ind.vagasEncerradas === 'number', 'vagasEncerradas deve ser número');
    assert(typeof ind.totalCandidaturas === 'number', 'totalCandidaturas deve ser número');
    assert(typeof ind.novosCandidatos === 'number', 'novosCandidatos deve ser número');
    assert(typeof ind.matches === 'number', 'matches deve ser número');
    assert(typeof ind.entrevistas === 'number', 'entrevistas deve ser número');
    assert(typeof ind.contratacoes === 'number', 'contratacoes deve ser número');

    assert(typeof dash.totalVisualizacoes === 'number', 'totalVisualizacoes deve ser número');
    assert(typeof dash.taxaConversao === 'number', 'taxaConversao deve ser número');
    assert(dash.candidatosPorEtapa, 'Deve conter mapa de candidatos por etapa');
  });

  // -------------------------------------------------------------
  // 2. CICLO DE VIDA DA OPORTUNIDADE (CRIAR, EDITAR, ENCERRAR, REABRIR, EXCLUIR)
  // -------------------------------------------------------------
  let testOppId = null;

  await runAsyncTest('Cenário 2: Criação de vaga de teste no banco de dados', async () => {
    const created = await opportunityService.createOpportunity({
      empresaId,
      empresa: 'IBM Brasil',
      nomeFantasia: 'IBM Tech Center',
      cargo: 'Estágio em Cloud & AI (Vaga Teste Etapa 7)',
      area: 'Inteligência Artificial',
      cursoRelacionado: 'Análise e Desenvolvimento de Sistemas',
      localizacao: 'São Paulo - SP',
      modalidade: 'Híbrido',
      tipo: 'Estágio',
      bolsa: 'R$ 2.500,00',
      descricao: 'Oportunidade para atuar com soluções corporativas em nuvem e IA generativa.',
      requisitos: ['Node.js', 'TypeScript', 'Docker', 'PostgreSQL'],
      beneficios: ['Bolsa-Auxílio', 'VR', 'VT', 'Seguro de Vida'],
    });

    assert(created, 'Vaga deve ser criada');
    assert(created.id, 'Vaga deve conter ID');
    testOppId = created.dbId || parseInt(String(created.id).replace('opp-', ''), 10);
    assert.strictEqual(created.cargo, 'Estágio em Cloud & AI (Vaga Teste Etapa 7)');
  });

  await runAsyncTest('Cenário 3: Edição e atualização de informações da vaga no banco', async () => {
    assert(testOppId, 'ID da vaga de teste deve existir');
    const updated = await opportunityService.updateOpportunity(testOppId, {
      bolsa: 'R$ 2.800,00',
      modalidade: 'Remoto',
      descricao: 'Descrição atualizada com novas atribuições de cloud.',
    });

    assert(updated, 'Vaga atualizada deve retornar');
    assert.strictEqual(updated.bolsa, 'R$ 2.800,00');
    assert.strictEqual(updated.modalidade, 'Remoto');
  });

  await runAsyncTest('Cenário 4: Registro de visualizações da publicação (incrementViews)', async () => {
    assert(testOppId, 'ID da vaga de teste deve existir');
    const res = await opportunityService.recordView(testOppId);
    assert(res && res.visualizacoes >= 1, 'Visualizações devem ser incrementadas');
  });

  await runAsyncTest('Cenário 5: Encerrar e reabrir vaga com controle de status', async () => {
    assert(testOppId, 'ID da vaga de teste deve existir');
    // Encerrar
    const closed = await opportunityService.updateStatus(testOppId, 'encerrada');
    assert.strictEqual(closed.status, 'encerrada');

    // Reabrir
    const reopened = await opportunityService.updateStatus(testOppId, 'ativa');
    assert.strictEqual(reopened.status, 'ativa');
  });

  // -------------------------------------------------------------
  // 3. PIPELINE KANBAN: MOVIMENTAÇÃO DE CANDIDATO E HISTÓRICO AUDITADO
  // -------------------------------------------------------------
  let testAppId = null;

  await runAsyncTest('Cenário 6: Submissão de candidatura para vaga e consulta na empresa', async () => {
    const studentUserId = 2; // Beatriz Lima
    // Deleta candidatura pré-existente se houver para idempotência
    await pool.query('DELETE FROM candidaturas WHERE aluno_id = $1 AND vaga_id = $2', [studentUserId, testOppId]);

    const newApp = await applicationService.apply(studentUserId, testOppId, 'Tenho grande interesse nesta oportunidade de estágio!');
    assert(newApp, 'Candidatura deve ser gerada');
    testAppId = newApp.id;

    // Verificar se aparece na listagem da empresa com perfil completo
    const companyApps = await applicationService.getCompanyApplications(empresaId);
    const found = companyApps.find((a) => a.id === testAppId);
    assert(found, 'Candidatura deve ser listada para a empresa contratante');
    assert(found.candidato, 'Deve conter dados do candidato');
    assert(found.candidato.nome, 'Deve conter nome do candidato');
    assert(Array.isArray(found.candidato.competencias), 'Competências devem ser array');
  });

  await runAsyncTest('Cenário 7: Movimentação de etapas no pipeline Kanban (Nova -> Em análise -> Selecionado -> Entrevista -> Proposta -> Contratado)', async () => {
    assert(testAppId, 'ID da candidatura deve existir');

    // 1. Mover para 'em_analise'
    let ok = await applicationService.updateStatus(testAppId, 'em_analise', 'Triagem de currículo aprovada', empresaId);
    assert.strictEqual(ok.status, 'em_analise');

    // 2. Mover para 'selecionado'
    ok = await applicationService.updateStatus(testAppId, 'selecionado', 'Candidato selecionado para teste técnico', empresaId);
    assert.strictEqual(ok.status, 'selecionado');

    // 3. Mover para 'entrevista'
    ok = await applicationService.updateStatus(testAppId, 'entrevista', 'Entrevista técnica agendada com o líder de Cloud', empresaId);
    assert.strictEqual(ok.status, 'entrevista');

    // 4. Mover para 'proposta'
    ok = await applicationService.updateStatus(testAppId, 'proposta', 'Proposta formal enviada ao aluno', empresaId);
    assert.strictEqual(ok.status, 'proposta');

    // 5. Mover para 'contratado'
    ok = await applicationService.updateStatus(testAppId, 'contratado', 'Contrato de estágio assinado e homologado com a FATEC', empresaId);
    assert.strictEqual(ok.status, 'contratado');
  });

  await runAsyncTest('Cenário 8: Auditoria persistente do histórico de transição de etapas (historico_candidaturas)', async () => {
    assert(testAppId, 'ID da candidatura deve existir');
    const history = await applicationService.getApplicationHistory(testAppId);
    assert(Array.isArray(history), 'Histórico deve ser um array');
    assert(history.length >= 6, `Histórico deve conter pelo menos 6 registros (inclusão + 5 transições), obtido: ${history.length}`);

    // Verifica ordenação cronológica e integridade dos motivos
    const latest = history[history.length - 1];
    assert.strictEqual(latest.status_novo, 'contratado');
    assert(latest.motivo.includes('Contrato de estágio'), 'Motivo da contratação deve ser preservado');
  });

  // -------------------------------------------------------------
  // 4. EXCLUSÃO REAL DA VAGA DE TESTE
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 9: Exclusão segura de oportunidade com cascata no banco de dados', async () => {
    assert(testOppId, 'ID da vaga de teste deve existir');
    const delRes = await opportunityService.deleteOpportunity(testOppId, empresaId);
    assert(delRes && delRes.success, 'Exclusão deve ser bem sucedida');

    // Confirma que a vaga não existe mais
    const checkVaga = await pool.query('SELECT * FROM oportunidades WHERE id = $1', [testOppId]);
    assert.strictEqual(checkVaga.rows.length, 0, 'Vaga não deve mais existir no banco de dados');
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
  console.error('Erro na execução da suíte do Dashboard:', e);
  process.exit(1);
});

