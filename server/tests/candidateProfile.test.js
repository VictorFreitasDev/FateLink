// ==========================================================
// FATELINK 2.0: SUITE DE TESTES DE PERFIL E CURRÍCULO (ETAPA 6)
// ==========================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const candidateService = require('../services/candidate.service');
const candidateRepository = require('../repositories/candidate.repository');

console.log('====================================================');
console.log('🧪 INICIANDO TESTES DE PERFIL E CURRÍCULO FATELINK 2.0');
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
  // -------------------------------------------------------------
  // 1. OBTENÇÃO DO PERFIL DO ALUNO
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 1: Obtenção de perfil de candidato existente pelo usuarioId', async () => {
    const profile = await candidateService.getProfileByUserId(1);
    assert(profile, 'Perfil do candidato 1 deve existir');
    assert.strictEqual(profile.usuarioId, 1, 'O usuarioId deve ser 1');
    assert(typeof profile.nome === 'string' && profile.nome.length > 0, 'Nome deve ser uma string não vazia');
    assert(Array.isArray(profile.competencias), 'Competências devem ser um array');
    assert(Array.isArray(profile.projetos), 'Projetos devem ser um array');
    assert(Array.isArray(profile.experiencias), 'Experiências devem ser um array');
    assert(Array.isArray(profile.certificacoes), 'Certificações devem ser um array');
  });

  // -------------------------------------------------------------
  // 2. ATUALIZAÇÃO COMPLETA DO PERFIL COM NOVOS CAMPOS
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 2: Atualização de dados profissionais (formação, modalidade, portfólio, projetos)', async () => {
    const updatePayload = {
      nome: 'Victor Freitas',
      idade: 22,
      curso: 'Análise e Desenvolvimento de Sistemas',
      semestre: '5º Semestre',
      unidadeFatec: 'Fatec Zona Leste',
      previsaoFormacao: 'Dezembro / 2026',
      localizacao: 'São Paulo - SP',
      modalidadeDesejada: 'Híbrido',
      portfolio: 'https://victorfreitas.dev',
      disponibilidade: 'Manhã',
      sobre: 'Desenvolvedor Full Stack apaixonado por arquitetura limpa e React Native.',
      competencias: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      github: 'https://github.com/victorfdev',
      linkedin: 'https://linkedin.com/in/victorfreitas',
      projetos: [
        {
          titulo: 'FateLink 2.0 Mobile',
          descricao: 'Plataforma de empregabilidade e matchmaking profissional para a rede FATEC.',
          tecnologias: ['React Native', 'Expo', 'TypeScript', 'Node.js', 'PostgreSQL'],
          githubUrl: 'https://github.com/victorfdev/FateLink',
          demoUrl: 'https://fatelink.fatec.sp.gov.br',
          imagemUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        },
      ],
      experiencias: [
        {
          cargo: 'Desenvolvedor Mobile Jr.',
          empresa: 'Tech Inovações',
          periodo: '2025 - Presente',
          descricao: 'Desenvolvimento de apps corporativos com React Native e consumo de APIs REST.',
        },
      ],
      certificacoes: ['Certificação AWS Cloud Practitioner', 'Formação React Native Avançado'],
    };

    const updated = await candidateService.updateProfileByUserId(1, updatePayload);
    assert(updated, 'Perfil retornado deve ser válido');
    assert.strictEqual(updated.previsaoFormacao, 'Dezembro / 2026');
    assert.strictEqual(updated.modalidadeDesejada, 'Híbrido');
    assert.strictEqual(updated.portfolio, 'https://victorfreitas.dev');
    assert.strictEqual(updated.projetos.length, 1);
    assert.strictEqual(updated.projetos[0].titulo, 'FateLink 2.0 Mobile');
    assert.strictEqual(updated.experiencias.length, 1);
    assert.strictEqual(updated.certificacoes.length, 2);
  });

  // -------------------------------------------------------------
  // 3. PERSISTÊNCIA REAL DE UPLOAD DE CURRÍCULO EM PDF
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 3: Upload de currículo PDF real no backend com persistência em disco', async () => {
    // Conteúdo simulado de PDF válido em base64 (%PDF-1.4 header)
    const samplePdfHeader = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
    const base64Pdf = Buffer.from(samplePdfHeader).toString('base64');

    const result = await candidateService.uploadResume(1, {
      base64: base64Pdf,
      fileName: 'Curriculo_Victor_Freitas.pdf',
    });

    assert(result && result.curriculoUrl, 'Upload deve retornar URL do currículo');
    assert(result.curriculoUrl.startsWith('/uploads/resumes/'), 'URL deve estar no diretório /uploads/resumes/');

    // Verificar se o arquivo físico foi gravado no disco
    const relativePath = result.curriculoUrl.replace(/^\//, '');
    const diskPath = path.join(__dirname, '..', relativePath);
    assert(fs.existsSync(diskPath), `Arquivo físico do currículo deve existir no caminho: ${diskPath}`);

    // Verificar tamanho do arquivo
    const stats = fs.statSync(diskPath);
    assert(stats.size > 0, 'O arquivo PDF salvo não pode ser vazio');
  });

  // -------------------------------------------------------------
  // 4. VERIFICAÇÃO DE CONSULTA PÓS-UPLOAD
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 4: Perfil atualizado reflete o currículo enviado', async () => {
    const profile = await candidateService.getProfileByUserId(1);
    assert(profile.curriculoUrl, 'Perfil deve conter curriculoUrl preenchido');
    assert(profile.curriculoUrl.includes('/uploads/resumes/'), 'URL do currículo deve ser válida');
  });

  // -------------------------------------------------------------
  // 5. EXCLUSÃO REAL DO CURRÍCULO EM PDF
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 5: Remoção física do arquivo PDF e limpeza no banco de dados', async () => {
    const profileBefore = await candidateService.getProfileByUserId(1);
    const existingUrl = profileBefore.curriculoUrl;
    assert(existingUrl, 'Deve haver um currículo antes de remover');

    const relativePath = existingUrl.replace(/^\//, '');
    const diskPath = path.join(__dirname, '..', relativePath);

    // Executa a remoção
    const deleteResult = await candidateService.deleteResume(1);
    assert.strictEqual(deleteResult.success, true, 'Remoção deve ser bem-sucedida');

    // Confirma que o arquivo em disco foi deletado
    assert.strictEqual(fs.existsSync(diskPath), false, 'Arquivo no disco deve ter sido excluído');

    // Confirma que o banco de dados teve curriculo_url zerado
    const profileAfter = await candidateService.getProfileByUserId(1);
    assert.strictEqual(profileAfter.curriculoUrl, null, 'curriculoUrl no banco deve ser NULL');
  });

  // -------------------------------------------------------------
  // 6. VALIDAÇÃO DE PROTEÇÃO CONTRA PAYLOAD INVÁLIDO DE PDF
  // -------------------------------------------------------------
  await runAsyncTest('Cenário 6: Rejeição de upload com payload vazio ou inválido', async () => {
    let threw = false;
    try {
      await candidateService.uploadResume(1, { base64: '' });
    } catch (err) {
      threw = true;
      assert(err.message.includes('não fornecido') || err.message.includes('base64'), 'Mensagem de erro deve ser informativa');
    }
    assert.strictEqual(threw, true, 'Deve lançar erro ao receber base64 vazio');
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
  console.error('Erro na execução dos testes:', e);
  process.exit(1);
});
