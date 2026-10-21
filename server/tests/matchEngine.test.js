// ==========================================================
// FATELINK 2.0: SUITE DE TESTES DO MOTOR DE MATCH (ETAPA 5)
// ==========================================================

const assert = require('assert');
const { calculateMatch, areSkillsEquivalent, normalizeStr } = require('../services/matchEngine');

console.log('====================================================');
console.log('🧪 INICIANDO TESTES DO ALGORITMO DE MATCH FATELINK 2.0');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${testName}`);
    console.error(`   Detalhes: ${err.message}\n`);
  }
}

// -------------------------------------------------------------
// 1. COMPATIBILIDADE ALTA
// -------------------------------------------------------------
runTest('Cenário 1: Compatibilidade Alta (Mesmo curso, todas skills, semestre e turno ideais)', () => {
  const candidate = {
    nome: 'Lucas Silva',
    curso: 'Desenvolvimento de Software Multiplataforma',
    semestre: '5º Semestre',
    unidadeFatec: 'Fatec Jales',
    competencias: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
    disponibilidade: 'Integral',
    projetos: [{ titulo: 'App FATEC' }, { titulo: 'E-commerce' }],
    experiencias: [{ cargo: 'Estagiário' }],
    certificacoes: ['React Native Expert'],
  };

  const opportunity = {
    cargo: 'Desenvolvedor Mobile Júnior',
    cursoRelacionado: 'Desenvolvimento de Software Multiplataforma',
    area: 'Desenvolvimento Mobile',
    modalidade: 'Híbrido',
    localizacao: 'Jales - SP',
    tipo: 'Júnior',
    descricao: 'Desenvolvimento de aplicativos móveis utilizando React Native e TypeScript.',
    requisitos: ['React Native', 'TypeScript', 'Node.js'],
  };

  const result = calculateMatch(candidate, opportunity);

  assert(result.score >= 80, `Score esperado >= 80, obtido: ${result.score}`);
  assert.strictEqual(result.nivel, 'excelente', `Nível esperado 'excelente', obtido: ${result.nivel}`);
  assert.strictEqual(result.isBlocked, false, 'Não deve haver bloqueador');
  assert(result.matchedSkills.length >= 3, `Deve ter matchedSkills >= 3, obtido: ${result.matchedSkills.length}`);
  assert(result.strengths.length > 0, 'Deve conter pontos fortes');
  assert(result.breakdown.competencias >= 30, 'Pontuação de competências deve ser alta');
  assert(result.breakdown.formacao >= 18, 'Pontuação de formação deve ser alta');
});

// -------------------------------------------------------------
// 2. COMPATIBILIDADE BAIXA
// -------------------------------------------------------------
runTest('Cenário 2: Compatibilidade Baixa (Áreas não correlatas, zero requisitos técnicos)', () => {
  const candidate = {
    nome: 'Carlos Eduardo',
    curso: 'Logística',
    semestre: '1º Semestre',
    unidadeFatec: 'Fatec Santos',
    competencias: ['Word', 'Excel'],
    disponibilidade: 'Noite',
    projetos: [],
    experiencias: [],
  };

  const opportunity = {
    cargo: 'Engenheiro Cloud & DevOps Sênior',
    cursoRelacionado: 'Segurança da Informação',
    area: 'Infraestrutura Cloud',
    modalidade: 'Presencial',
    localizacao: 'Jales - SP',
    tipo: 'Júnior',
    descricao: 'Gerenciamento de infraestrutura cloud e clusters Kubernetes.',
    requisitos: ['AWS', 'Docker', 'Kubernetes', 'Linux', 'Terraform'],
  };

  const result = calculateMatch(candidate, opportunity);

  assert(result.score < 40, `Score esperado < 40 para incompatibilidade alta, obtido: ${result.score}`);
  assert.strictEqual(result.nivel, 'baixo', `Nível esperado 'baixo', obtido: ${result.nivel}`);
  assert.strictEqual(result.matchedSkills.length, 0, 'Nenhum requisito deve bater');
  assert(result.missingMandatorySkills.length > 0, 'Deve indicar requisitos ausentes');
  assert(result.improvements.length > 0, 'Deve sugerir melhorias');
});

// -------------------------------------------------------------
// 3. CRITÉRIOS OBRIGATÓRIOS NÃO ATENDIDOS (ELIMINATÓRIO)
// -------------------------------------------------------------
runTest('Cenário 3: Critério Obrigatório Não Atendido (Bloqueador com teto máximo de pontuação)', () => {
  const candidate = {
    nome: 'Beatriz Lima',
    curso: 'Análise e Desenvolvimento de Sistemas',
    semestre: '4º Semestre',
    unidadeFatec: 'Fatec Jales',
    competencias: ['HTML', 'CSS', 'JavaScript'],
    disponibilidade: 'Manhã',
  };

  const opportunity = {
    cargo: 'Desenvolvedor Backend Java',
    cursoRelacionado: 'Análise e Desenvolvimento de Sistemas',
    area: 'Desenvolvimento Backend',
    modalidade: 'Híbrido',
    localizacao: 'Jales - SP',
    tipo: 'Estágio',
    descricao: 'Desenvolvimento backend em microsserviços Java.',
    requisitos: [
      'Java (Obrigatório)',
      'Spring Boot (Obrigatório)',
      'Docker (Desejável)',
    ],
  };

  const result = calculateMatch(candidate, opportunity);

  assert.strictEqual(result.isBlocked, true, 'Deve marcar isBlocked como true quando falta requisito obrigatório');
  assert(result.blockReasons.length > 0, 'Deve explicar o motivo do bloqueio');
  assert(result.score <= 45, `Score deve ser limitado a no máximo 45 quando há bloqueio, obtido: ${result.score}`);
  assert(result.missingMandatorySkills.includes('Java (Obrigatório)'), 'Deve listar Java como obrigatório ausente');
});

// -------------------------------------------------------------
// 4. DADOS INCOMPLETOS
// -------------------------------------------------------------
runTest('Cenário 4: Dados Incompletos (Tratamento neutro sem erros de runtime ou NaN)', () => {
  const candidate = {
    nome: 'Aluno Novo Sem Cadastro Completo',
  };

  const opportunity = {
    cargo: 'Estágio Geral',
  };

  const result = calculateMatch(candidate, opportunity);

  assert(typeof result.score === 'number', 'Score deve ser um número');
  assert(!isNaN(result.score), 'Score não pode ser NaN');
  assert(result.score >= 0 && result.score <= 100, `Score deve estar entre 0 e 100, obtido: ${result.score}`);
  assert(result.explanations.length > 0, 'Deve fornecer explicações');
  assert(typeof result.breakdown === 'object', 'Breakdown deve ser um objeto');
  assert(!isNaN(result.breakdown.competencias), 'Breakdown competencias não pode ser NaN');
  assert(!isNaN(result.breakdown.formacao), 'Breakdown formacao não pode ser NaN');
});

// -------------------------------------------------------------
// 5. DISPONIBILIDADE INCOMPATÍVEL
// -------------------------------------------------------------
runTest('Cenário 5: Disponibilidade Incompatível (Aluno noturno exclusivo em vaga comercial diurna)', () => {
  const candidate = {
    nome: 'Marcos Vinicius',
    curso: 'Análise e Desenvolvimento de Sistemas',
    semestre: '3º Semestre',
    unidadeFatec: 'Fatec Jales',
    competencias: ['React Native', 'Node.js'],
    disponibilidade: 'Noite',
  };

  const opportunity = {
    cargo: 'Estagiário de TI Presencial Diurno',
    cursoRelacionado: 'Análise e Desenvolvimento de Sistemas',
    area: 'TI',
    modalidade: 'Presencial',
    localizacao: 'Jales - SP',
    tipo: 'Estágio',
    descricao: 'Estágio presencial em horário comercial diurno das 08:00 às 14:00.',
    requisitos: ['React Native', 'Node.js'],
  };

  const result = calculateMatch(candidate, opportunity);

  assert.strictEqual(result.isBlocked, true, 'Deve bloquear por turno incompatível');
  assert.strictEqual(result.breakdown.disponibilidade, 0, 'Pontuação de disponibilidade deve ser 0');
  assert(result.blockReasons.some((r) => r.toLowerCase().includes('noturna') || r.toLowerCase().includes('disponibilidade')), 'Deve justificar incompatibilidade de horário');
});

// -------------------------------------------------------------
// 6. PREFERÊNCIA EXCLUSIVA POR TRABALHO REMOTO VS PRESENCIAL DISTANTE
// -------------------------------------------------------------
runTest('Cenário 6: Vaga Presencial Distante (Incompatibilidade geográfica > 1000km)', () => {
  const candidate = {
    nome: 'Juliana Paes',
    curso: 'DSM',
    semestre: '4º Semestre',
    unidadeFatec: 'Fatec Jales',
    competencias: ['React', 'Node.js'],
    disponibilidade: 'Tarde',
  };

  const opportunity = {
    cargo: 'Estágio de Desenvolvimento',
    cursoRelacionado: 'DSM',
    area: 'Desenvolvimento',
    modalidade: 'Presencial',
    localizacao: 'Manaus - AM',
    tipo: 'Estágio',
    descricao: 'Atuação 100% presencial em nosso escritório em Manaus.',
    requisitos: ['React', 'Node.js'],
  };

  const result = calculateMatch(candidate, opportunity);

  assert(result.breakdown.localizacao <= 4, `Pontuação de localização deve ser baixa para cidade distante, obtido: ${result.breakdown.localizacao}`);
  assert(result.improvements.some((i) => i.toLowerCase().includes('presencial') || i.toLowerCase().includes('habitual')), 'Deve sugerir atenção à localização');
});

// -------------------------------------------------------------
// 7. COMPETÊNCIAS SEMELHANTES / EQUIVALENTES (ALIASES E NORMALIZAÇÃO)
// -------------------------------------------------------------
runTest('Cenário 7: Competências Semelhantes (Aliases: JS->JavaScript, TS->TypeScript, Postgres->PostgreSQL, Expo->React Native)', () => {
  // Teste direto das equivalências de alias
  assert.strictEqual(areSkillsEquivalent('JS', 'JavaScript'), true, 'JS deve equivaler a JavaScript');
  assert.strictEqual(areSkillsEquivalent('ts', 'TypeScript'), true, 'ts deve equivaler a TypeScript');
  assert.strictEqual(areSkillsEquivalent('postgres', 'PostgreSQL'), true, 'postgres deve equivaler a PostgreSQL');
  assert.strictEqual(areSkillsEquivalent('expo', 'React Native'), true, 'expo deve equivaler a React Native');
  assert.strictEqual(areSkillsEquivalent('docker-compose', 'Docker'), true, 'docker-compose deve equivaler a Docker');

  const candidate = {
    nome: 'Dev Full Stack',
    curso: 'DSM',
    semestre: '5º Semestre',
    unidadeFatec: 'Fatec Jales',
    competencias: ['JS', 'TS', 'Postgres', 'React Mobile', 'Containers'],
    disponibilidade: 'Integral',
  };

  const opportunity = {
    cargo: 'Desenvolvedor Full Stack',
    cursoRelacionado: 'DSM',
    area: 'TI',
    modalidade: 'Remoto',
    localizacao: 'São Paulo - SP',
    tipo: 'Estágio',
    descricao: 'Desenvolvimento full stack.',
    requisitos: ['JavaScript', 'TypeScript', 'PostgreSQL', 'React Native', 'Docker'],
  };

  const result = calculateMatch(candidate, opportunity);

  assert.strictEqual(result.matchedSkills.length, 5, `Todas as 5 competências com alias devem ser reconhecidas! Reconhecidas: ${result.matchedSkills.length}`);
  assert.strictEqual(result.missingMandatorySkills.length, 0, 'Nenhum requisito obrigatório deve faltar');
  assert(result.breakdown.competencias >= 32, `Pontuação de competências deve ser máxima, obtido: ${result.breakdown.competencias}`);
});

console.log('\n====================================================');
console.log(`📊 RESULTADO FINAL: ${passedTests}/${totalTests} TESTES APROVADOS!`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

