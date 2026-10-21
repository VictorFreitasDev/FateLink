// ==========================================================
// FATELINK 2.0: MOTOR DE MATCH DETERMINÍSTICO E EXPLICÁVEL
// Algoritmo unificado de compatibilidade multidimensional (0-100)
// ==========================================================

/**
 * Dicionário canônico de sinônimos e equivalências técnicas (aliases)
 */
const SKILL_ALIASES = {
  'react': ['react', 'reactjs', 'react.js'],
  'react native': ['react native', 'react-native', 'expo', 'react mobile'],
  'node.js': ['node', 'nodejs', 'node.js', 'express', 'nestjs', 'backend js'],
  'typescript': ['typescript', 'ts'],
  'javascript': ['javascript', 'js', 'es6', 'ecmascript'],
  'python': ['python', 'py', 'django', 'flask', 'fastapi'],
  'postgresql': ['postgresql', 'postgres', 'psql'],
  'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'psql', 'sqlite', 'oracle', 'sql server', 'banco de dados'],
  'docker': ['docker', 'containers', 'docker-compose', 'kubernetes'],
  'git': ['git', 'github', 'gitlab', 'controle de versao'],
  'figma': ['figma', 'ui/ux', 'prototipagem', 'adobe xd', 'design de interfaces'],
  'csharp': ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
  'java': ['java', 'spring', 'springboot', 'spring boot', 'jee'],
  'html': ['html', 'html5'],
  'css': ['css', 'css3', 'sass', 'tailwind', 'tailwindcss', 'bootstrap'],
  'aws': ['aws', 'amazon web services', 'cloud', 'nuvem'],
  'linux': ['linux', 'bash', 'shell', 'unix'],
  'bi': ['bi', 'power bi', 'powerbi', 'business intelligence', 'tableau', 'analytics'],
  'scrum': ['scrum', 'agil', 'metodologias ageis', 'kanban', 'jira'],
};

/**
 * Mapa de afinidade de cursos FATEC com palavras-chave de áreas
 */
const COURSE_AFFINITY_MAP = {
  'analise e desenvolvimento de sistemas': ['tecnologia', 'software', 'ti', 'desenvolvimento', 'mobile', 'web', 'full stack', 'backend', 'frontend', 'engenharia de software', 'dados', 'sistemas', 'programacao', 'ads'],
  'sistemas para internet': ['tecnologia', 'software', 'ti', 'desenvolvimento', 'mobile', 'web', 'full stack', 'frontend', 'aplicativos', 'internet', 'e-commerce', 'redes', 'sistemas', 'spi', 'programacao'],
  'agronegocio': ['agronegocio', 'agro', 'agtech', 'gestao', 'cadeia de suprimentos', 'sustentabilidade', 'safra', 'logistica', 'cooperativa', 'commodities', 'campo', 'producao', 'agricultura'],
  'gestao empresarial': ['gestao', 'administracao', 'financas', 'recursos humanos', 'rh', 'negocios', 'comercial', 'operacoes', 'planejamento', 'marketing', 'vendas', 'consultoria'],
  'gestao empresarial presencial': ['gestao', 'administracao', 'financas', 'recursos humanos', 'rh', 'negocios', 'comercial', 'operacoes', 'planejamento', 'marketing', 'vendas', 'consultoria'],
  'gestao empresarial ead': ['gestao', 'administracao', 'financas', 'recursos humanos', 'rh', 'negocios', 'comercial', 'operacoes', 'planejamento', 'marketing', 'vendas', 'consultoria'],
  'desenvolvimento de software multiplataforma': ['tecnologia', 'software', 'ti', 'desenvolvimento', 'mobile', 'web', 'full stack', 'frontend', 'ui/ux', 'aplicativos', 'react', 'multiplataforma'],
  'gestao da tecnologia da informacao': ['ti', 'tecnologia', 'gestao', 'governanca', 'seguranca', 'infraestrutura', 'suporte', 'projetos', 'redes'],
  'banco de dados': ['dados', 'banco de dados', 'bi', 'big data', 'sql', 'inteligencia artificial', 'analytics', 'dba', 'data'],
  'ciencia de dados': ['dados', 'data science', 'analytics', 'ia', 'inteligencia artificial', 'machine learning', 'python', 'bi'],
  'seguranca da informacao': ['seguranca', 'cybersecurity', 'redes', 'infraestrutura', 'conformidade', 'devops', 'cloud', 'segurança'],
  'logistica': ['logistica', 'supply chain', 'comercio exterior', 'operacoes', 'transporte', 'estoque', 'distribuicao'],
};

/**
 * Cidades vizinhas/polo da região Noroeste Paulista (FATEC Jales e microrregiões)
 */
const REGIONAL_CITIES = [
  'jales',
  'fernandopolis',
  'votuporanga',
  'santa fe do sul',
  'urania',
  'palmeira d\'oeste',
  'sao jose do rio preto',
  'ilha solteira',
  'pereira barreto',
  'populina',
  'estrelad\'oeste',
  'estrela d\'oeste',
  'rubineia',
  'santa salete',
  'paranapua',
  'mesopolis',
  'turmalina',
];

/**
 * Normaliza strings para comparação fonética/textual (sem acentos, minúsculas, limpo)
 */
function normalizeStr(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Remove palavras qualificadoras de requisitos
 */
function cleanSkillName(str) {
  const norm = normalizeStr(str);
  return norm
    .replace(/\b(obrigatorio|indispensavel|essencial|exigido|mandatorio|necessario)\b/g, '')
    .replace(/\b(desejavel|diferencial|plus|bom ter|opcional)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se um texto contém uma palavra/termo como token isolado (evita 'java' dentro de 'javascript')
 */
function containsExactWord(text, word) {
  if (!text || !word) return false;
  if (text === word) return true;

  // Proteção estrita: 'java' nunca pode corresponder a 'javascript'
  if (word === 'java' && text.includes('javascript')) {
    const withoutJs = text.replace(/javascript/g, '').trim();
    if (!containsExactWord(withoutJs, 'java')) return false;
  }
  if (text === 'java' && word.includes('javascript')) return false;

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
  return regex.test(text);
}

/**
 * Verifica se duas competências são equivalentes utilizando o dicionário canônico
 */
function areSkillsEquivalent(skillA, skillB) {
  const normA = cleanSkillName(skillA);
  const normB = cleanSkillName(skillB);
  if (!normA || !normB) return false;

  // Proteção imediata Java vs JavaScript
  if ((normA === 'javascript' && normB === 'java') || (normA === 'java' && normB === 'javascript')) {
    return false;
  }

  // Correspondência exata direta
  if (normA === normB) return true;

  // Verificação de token isolado
  if (containsExactWord(normA, normB) || containsExactWord(normB, normA)) {
    return true;
  }

  // Verificação no dicionário de aliases
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    const aMatches = normA === canonical || aliases.some((al) => containsExactWord(normA, al) || normA === al);
    const bMatches = normB === canonical || aliases.some((al) => containsExactWord(normB, al) || normB === al);
    if (aMatches && bMatches) {
      // Dupla checagem para evitar confusão entre Java e JS através de aliases
      if (canonical === 'java' && (normA.includes('javascript') || normB.includes('javascript'))) {
        continue;
      }
      return true;
    }
  }

  return false;
}

/**
 * Identifica se um requisito de vaga é mandatório/obrigatório
 */
function isRequirementMandatory(reqText) {
  const norm = normalizeStr(reqText);
  return (
    norm.includes('obrigatorio') ||
    norm.includes('indispensavel') ||
    norm.includes('essencial') ||
    norm.includes('exigido') ||
    norm.includes('mandatorio') ||
    norm.includes('necessario')
  );
}

/**
 * Identifica se um requisito é apenas desejável/diferencial
 */
function isRequirementDesirable(reqText) {
  const norm = normalizeStr(reqText);
  return (
    norm.includes('desejavel') ||
    norm.includes('diferencial') ||
    norm.includes('plus') ||
    norm.includes('bom ter') ||
    norm.includes('opcional')
  );
}

/**
 * Calcula a compatibilidade profunda entre candidato e oportunidade (0 a 100)
 * @param {Object} candidate - Dados do candidato
 * @param {Object} opportunity - Dados da vaga
 * @returns {Object} Diagnóstico auditável completo
 */
function calculateMatch(candidate, opportunity) {
  // Tratamento de ausência total de dados
  if (!candidate && !opportunity) {
    return {
      score: 0,
      nivel: 'baixo',
      breakdown: { competencias: 0, formacao: 0, experiencia: 0, disponibilidade: 0, localizacao: 0 },
      matchedSkills: [],
      missingMandatorySkills: [],
      missingDesirableSkills: [],
      strengths: [],
      improvements: ['Nenhum dado fornecido para avaliação.'],
      explanations: ['Dados insuficientes para diagnóstico.'],
      isBlocked: false,
      blockReasons: [],
    };
  }

  const cand = candidate || {};
  const opp = opportunity || {};

  const explanations = [];
  const strengths = [];
  const improvements = [];
  const blockReasons = [];
  let isBlocked = false;

  const candSkills = (cand.competencias || []).filter(Boolean);
  const oppReqs = (opp.requisitos || []).filter(Boolean);

  // =========================================================================
  // 1. COMPETÊNCIAS TÉCNICAS (Peso Máximo: 35 pontos)
  //    - Obrigatórias: 25 pontos
  //    - Desejáveis / Diferenciais: 10 pontos
  // =========================================================================
  let competenciasScore = 0;
  const matchedSkills = [];
  const missingMandatorySkills = [];
  const missingDesirableSkills = [];

  if (oppReqs.length > 0) {
    const mandatoryReqs = oppReqs.filter(isRequirementMandatory);
    const desirableReqs = oppReqs.filter(isRequirementDesirable);
    const regularReqs = oppReqs.filter((r) => !isRequirementMandatory(r) && !isRequirementDesirable(r));

    // Se nenhum foi explicitamente marcado, o 1º requisito é o principal mandatório
    const effectiveMandatory = mandatoryReqs.length > 0 ? mandatoryReqs : (regularReqs.length > 0 ? [regularReqs[0]] : []);
    const effectiveDesirable = [
      ...desirableReqs,
      ...(mandatoryReqs.length > 0 ? regularReqs : regularReqs.slice(1)),
    ];

    let mandatoryMatchedCount = 0;
    effectiveMandatory.forEach((req) => {
      const match = candSkills.some((skill) => areSkillsEquivalent(skill, req));
      if (match) {
        mandatoryMatchedCount++;
        matchedSkills.push(req);
      } else {
        missingMandatorySkills.push(req);
      }
    });

    let desirableMatchedCount = 0;
    effectiveDesirable.forEach((req) => {
      const match = candSkills.some((skill) => areSkillsEquivalent(skill, req));
      if (match) {
        desirableMatchedCount++;
        matchedSkills.push(req);
      } else {
        missingDesirableSkills.push(req);
      }
    });

    // Avaliação de bloqueio eliminatório por competências obrigatórias
    if (effectiveMandatory.length > 0) {
      const ratioMandatory = mandatoryMatchedCount / effectiveMandatory.length;
      competenciasScore += Math.round(ratioMandatory * 25);

      if (mandatoryMatchedCount === effectiveMandatory.length) {
        strengths.push('Atende a 100% das competências obrigatórias da oportunidade.');
      } else {
        // Falta de qualquer requisito obrigatório aciona bloqueio eliminatório
        isBlocked = true;
        blockReasons.push(`Não atende a competência obrigatória: ${missingMandatorySkills[0]}`);
      }
    } else {
      competenciasScore += 18;
    }

    if (effectiveDesirable.length > 0) {
      const ratioDesirable = desirableMatchedCount / effectiveDesirable.length;
      competenciasScore += Math.round(ratioDesirable * 10);
      if (desirableMatchedCount > 0) {
        strengths.push(`Possui ${desirableMatchedCount} diferencial(is) técnico(s) desejado(s).`);
      }
    } else {
      competenciasScore += 7;
    }

    if (missingMandatorySkills.length > 0) {
      improvements.push(`Priorizar o aprendizado de: ${cleanSkillName(missingMandatorySkills[0])}.`);
    } else if (missingDesirableSkills.length > 0) {
      improvements.push(`Adicionar diferencial estudando: ${cleanSkillName(missingDesirableSkills[0])}.`);
    }
  } else {
    competenciasScore = candSkills.length > 0 ? 25 : 15;
    explanations.push('A oportunidade não especificou requisitos técnicos obrigatórios.');
  }

  // =========================================================================
  // 2. FORMAÇÃO ACADÊMICA & CURSO FATEC (Peso Máximo: 20 pontos)
  //    - Curso & Área: 15 pontos
  //    - Semestre vs Nível: 5 pontos
  // =========================================================================
  let formacaoScore = 0;
  const candCourseNorm = normalizeStr(cand.curso);
  const oppCourseNorm = normalizeStr(opp.cursoRelacionado || opp.curso_relacionado);
  const oppAreaNorm = normalizeStr(opp.area || opp.cargo);

  let courseAffinityFound = false;
  let partialAffinity = false;

  // Sinergias diretas da matriz curricular da FATEC Jales:
  const isComputing = (c) => c.includes('analise e desenv') || c.includes('sistemas para internet') || c.includes('dsm') || c.includes('software') || c.includes('ads') || c.includes('spi');
  const isGestao = (c) => c.includes('gestao empresarial');
  const isAgro = (c) => c.includes('agronegocio') || c.includes('agro');

  if (candCourseNorm) {
    if (oppCourseNorm && (candCourseNorm.includes(oppCourseNorm) || oppCourseNorm.includes(candCourseNorm))) {
      courseAffinityFound = true;
    } else if (isComputing(candCourseNorm) && isComputing(oppCourseNorm)) {
      courseAffinityFound = true;
    } else if (isGestao(candCourseNorm) && isGestao(oppCourseNorm)) {
      courseAffinityFound = true;
    } else if (isAgro(candCourseNorm) && (isAgro(oppCourseNorm) || oppAreaNorm.includes('agro') || oppAreaNorm.includes('agtech'))) {
      courseAffinityFound = true;
    } else {
      for (const [courseKey, keywords] of Object.entries(COURSE_AFFINITY_MAP)) {
        if (candCourseNorm.includes(courseKey) || courseKey.includes(candCourseNorm)) {
          const matchesArea = keywords.some((kw) => oppAreaNorm.includes(kw) || oppCourseNorm.includes(kw));
          if (matchesArea) {
            courseAffinityFound = true;
            break;
          } else if (keywords.some((kw) => oppAreaNorm.includes('ti') || oppAreaNorm.includes('software') || oppAreaNorm.includes('tecnologia'))) {
            partialAffinity = true;
          }
        }
      }
    }

    if (courseAffinityFound) {
      formacaoScore += 15;
      strengths.push(`Curso de ${cand.curso} possui correlação direta com as atividades da vaga.`);
    } else if (partialAffinity || oppAreaNorm.includes('tecnologia') || oppAreaNorm.includes('ti')) {
      formacaoScore += 11;
      strengths.push(`Formação tecnológica correlata à área de atuação.`);
    } else {
      formacaoScore += 3;
      improvements.push('Vaga voltada para área diferente da sua graduação principal.');
    }
  } else {
    formacaoScore += 8;
  }

  // 2.2 Semestre de Graduação vs Tipo de Vaga (até 5 pontos)
  const oppTipo = normalizeStr(opp.tipo);
  const candSemestreStr = String(cand.semestre || '');
  const semMatch = candSemestreStr.match(/\d+/);
  const semNum = semMatch ? parseInt(semMatch[0], 10) : 0;

  if (semNum > 0) {
    if (oppTipo.includes('estagio')) {
      if (semNum >= 2 && semNum <= 5) {
        formacaoScore += 5;
        strengths.push(`Semestre atual (${semNum}º) ideal para início e desenvolvimento de estágio.`);
      } else if (semNum >= 6) {
        formacaoScore += 4;
      } else {
        formacaoScore += 3;
      }
    } else if (oppTipo.includes('junior') || oppTipo.includes('trainee')) {
      if (semNum >= 5) {
        formacaoScore += 5;
        strengths.push(`Semestre avançado (${semNum}º) com prontidão para posição júnior/efetiva.`);
      } else if (semNum >= 3) {
        formacaoScore += 3;
      } else {
        formacaoScore += 1;
        improvements.push('Vagas júnior geralmente exigem estágio prévio ou semestres finais.');
      }
    } else {
      formacaoScore += 4;
    }
  } else {
    formacaoScore += 3;
  }

  // =========================================================================
  // 3. EXPERIÊNCIA PRÁTICA & PROJETOS (Peso Máximo: 15 pontos)
  //    - Projetos no Portfólio: 8 pontos
  //    - Experiências profissionais: 4 pontos
  //    - Certificações: 3 pontos
  // =========================================================================
  let experienciaScore = 0;
  const projetos = Array.isArray(cand.projetos) ? cand.projetos : [];
  const experiencias = Array.isArray(cand.experiencias) ? cand.experiencias : [];
  const certificacoes = Array.isArray(cand.certificacoes) ? cand.certificacoes : [];

  if (projetos.length >= 2 || cand.github) {
    experienciaScore += 8;
    strengths.push('Portfólio prático com projetos demonstráveis e código aberto.');
  } else if (projetos.length === 1) {
    experienciaScore += 5;
  } else {
    experienciaScore += 1;
    improvements.push('Cadastrar projetos acadêmicos ou pessoais no perfil para demonstrar prática.');
  }

  if (experiencias.length >= 1) {
    experienciaScore += 4;
    strengths.push('Possui histórico de experiências práticas anteriores.');
  } else {
    experienciaScore += 2;
  }

  if (certificacoes.length >= 1) {
    experienciaScore += 3;
    strengths.push('Formações complementares e certificações registradas.');
  } else {
    experienciaScore += 1;
  }

  // =========================================================================
  // 4. DISPONIBILIDADE & TURNO (Peso Máximo: 15 pontos)
  // =========================================================================
  let disponibilidadeScore = 0;
  const candDisp = normalizeStr(cand.disponibilidade);
  const oppDesc = normalizeStr(opp.descricao);

  if (candDisp === 'integral') {
    disponibilidadeScore = 15;
    strengths.push('Disponibilidade integral com flexibilidade máxima de jornada.');
  } else if (candDisp === 'tarde' || candDisp === 'manha') {
    disponibilidadeScore = 15;
    strengths.push(`Disponibilidade (${cand.disponibilidade}) compatível com o turno padrão de estágio.`);
  } else if (candDisp === 'noite') {
    if (oppDesc.includes('diurno') || oppDesc.includes('comercial') || oppDesc.includes('manha e tarde')) {
      disponibilidadeScore = 0;
      isBlocked = true;
      blockReasons.push('Disponibilidade apenas noturna é incompatível com o horário diurno exigido.');
      improvements.push('Verificar disponibilidade para conciliar o horário do estágio com os estudos.');
    } else {
      disponibilidadeScore = 10;
    }
  } else {
    disponibilidadeScore = 10;
  }

  // =========================================================================
  // 5. MODALIDADE & LOCALIZAÇÃO (Peso Máximo: 15 pontos)
  // =========================================================================
  let localizacaoScore = 0;
  const oppModalidade = normalizeStr(opp.modalidade);
  const oppLoc = normalizeStr(opp.localizacao);
  const candLoc = normalizeStr(cand.localizacao);
  const candUnidade = normalizeStr(cand.unidadeFatec || cand.unidade_fatec);

  if (oppModalidade === 'remoto') {
    localizacaoScore = 15;
    strengths.push('Vaga 100% Remota: sem restrições ou barreiras de deslocamento.');
  } else {
    const isOppRegional = REGIONAL_CITIES.some((city) => oppLoc.includes(city));
    const isCandRegional = REGIONAL_CITIES.some((city) => (candLoc && candLoc.includes(city)) || (candUnidade && candUnidade.includes(city)));
    const isLocalMatch = (oppLoc && candLoc && (oppLoc.includes(candLoc) || candLoc.includes(oppLoc))) ||
      (oppLoc && candUnidade && (oppLoc.includes(candUnidade) || candUnidade.includes(oppLoc))) ||
      (oppLoc.includes('jales') && (candUnidade.includes('jales') || candLoc.includes('jales')));

    if (oppModalidade === 'hibrido') {
      if (isLocalMatch || (isOppRegional && isCandRegional)) {
        localizacaoScore = 14;
        strengths.push('Modalidade híbrida conciliável com o campus e residência na região.');
      } else {
        localizacaoScore = 8;
        improvements.push('Confirmar viabilidade de transporte para a modalidade híbrida.');
      }
    } else {
      // Presencial
      if (isLocalMatch) {
        localizacaoScore = 15;
        strengths.push('Localização na mesma cidade do campus universitário.');
      } else if (isOppRegional && isCandRegional) {
        localizacaoScore = 12;
        strengths.push('Localização na mesma macrorregião polo da FATEC.');
      } else {
        localizacaoScore = 3;
        improvements.push('Vaga presencial localizada fora da região metropolitana habitual.');
      }
    }
  }

  // =========================================================================
  // 6. CONSOLIDAÇÃO DA PONTUAÇÃO (NORMALIZADA 0 A 100)
  // =========================================================================
  let rawScore = competenciasScore + formacaoScore + experienciaScore + disponibilidadeScore + localizacaoScore;

  if (isBlocked) {
    rawScore = Math.min(rawScore, 45);
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let nivel = 'baixo';
  if (finalScore >= 80) nivel = 'excelente';
  else if (finalScore >= 65) nivel = 'alto';
  else if (finalScore >= 45) nivel = 'moderado';

  if (strengths.length > 0) {
    explanations.push(strengths[0]);
  }
  if (strengths.length > 1) {
    explanations.push(strengths[1]);
  }
  if (blockReasons.length > 0) {
    explanations.push(`Atenção: ${blockReasons[0]}`);
  } else if (improvements.length > 0) {
    explanations.push(improvements[0]);
  }

  return {
    score: finalScore,
    nivel,
    breakdown: {
      competencias: competenciasScore,
      formacao: formacaoScore,
      experiencia: experienciaScore,
      disponibilidade: disponibilidadeScore,
      localizacao: localizacaoScore,
    },
    matchedSkills: Array.from(new Set(matchedSkills)),
    missingMandatorySkills: Array.from(new Set(missingMandatorySkills)),
    missingDesirableSkills: Array.from(new Set(missingDesirableSkills)),
    strengths: Array.from(new Set(strengths)),
    improvements: Array.from(new Set(improvements)),
    explanations: Array.from(new Set(explanations)),
    isBlocked,
    blockReasons,
  };
}

module.exports = {
  calculateMatch,
  evaluateMatch: calculateMatch,
  normalizeStr,
  cleanSkillName,
  areSkillsEquivalent,
  containsExactWord,
  SKILL_ALIASES,
  COURSE_AFFINITY_MAP,
};
