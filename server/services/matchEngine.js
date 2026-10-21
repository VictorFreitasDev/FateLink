// ==========================================================
// FATELINK 2.0: MOTOR DE MATCH DETERMINÍSTICO E TRANSPARENTE
// Algoritmo de cálculo de compatibilidade baseado em pesos auditáveis
// ==========================================================

const COURSE_AFFINITY_MAP = {
  'análise e desenvolvimento de sistemas': ['tecnologia', 'software', 'ti', 'desenvolvimento', 'mobile', 'web', 'full stack', 'backend', 'frontend', 'engenharia de software', 'dados'],
  'desenvolvimento de software multiplataforma': ['tecnologia', 'software', 'ti', 'desenvolvimento', 'mobile', 'web', 'full stack', 'frontend', 'ui/ux', 'aplicativos'],
  'gestão da tecnologia da informação': ['ti', 'tecnologia', 'gestão', 'governança', 'segurança', 'infraestrutura', 'suporte', 'projetos'],
  'banco de dados': ['dados', 'banco de dados', 'bi', 'big data', 'sql', 'inteligência artificial', 'analytics', 'dba'],
  'ciência de dados': ['dados', 'data science', 'analytics', 'ia', 'inteligência artificial', 'machine learning', 'python', 'bi'],
  'segurança da informação': ['segurança', 'cybersecurity', 'redes', 'infraestrutura', 'conformidade', 'devops', 'cloud'],
  'logística': ['logística', 'supply chain', 'comércio exterior', 'operações', 'transporte', 'estoque', 'distribuição'],
  'gestão empresarial': ['gestão', 'administração', 'finanças', 'recursos humanos', 'rh', 'negócios', 'comercial', 'operações'],
};

/**
 * Normaliza strings para comparação (remove pontuação, espaços múltiplos e minúsculas)
 */
function normalizeStr(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Calcula a compatibilidade real entre um candidato e uma vaga
 * @param {Object} candidate - Dados do candidato
 * @param {Object} opportunity - Dados da oportunidade
 * @returns {Object} { score: number, explanations: string[], matchedSkills: string[], missingSkills: string[], breakdown: object }
 */
function calculateMatch(candidate, opportunity) {
  if (!candidate || !opportunity) {
    return {
      score: 50,
      explanations: ['Dados insuficientes para cálculo preciso.'],
      matchedSkills: [],
      missingSkills: [],
      breakdown: { skills: 0, course: 0, modality: 0, availability: 0, location: 0 },
    };
  }

  const explanations = [];
  const candSkills = (candidate.competencias || []).map(normalizeStr);
  const oppReqs = (opportunity.requisitos || []).map(normalizeStr);

  // 1. Competências Técnicas (Peso: 40 pontos)
  let skillsScore = 0;
  const matchedSkills = [];
  const missingSkills = [];

  if (oppReqs.length > 0) {
    oppReqs.forEach((req) => {
      // Verifica se alguma skill do candidato está contida no requisito ou vice-versa
      const hasMatch = candSkills.some((skill) => {
        if (!skill) return false;
        return (
          req.includes(skill) ||
          skill.includes(req) ||
          (skill === 'react' && req.includes('react')) ||
          (skill === 'js' && req.includes('javascript')) ||
          (skill === 'ts' && req.includes('typescript'))
        );
      });

      if (hasMatch) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });

    const ratio = matchedSkills.length / oppReqs.length;
    skillsScore = Math.round(ratio * 40);

    if (matchedSkills.length > 0) {
      explanations.push(`Você possui ${matchedSkills.length} de ${oppReqs.length} requisitos técnicos solicitados.`);
    }
    if (missingSkills.length > 0) {
      explanations.push(`Competência a desenvolver: ${missingSkills[0]}.`);
    }
  } else {
    skillsScore = 30; // sem requisitos explícitos
  }

  // 2. Curso e Área de Formação FATEC (Peso: 25 pontos)
  let courseScore = 10;
  const candCourseNorm = normalizeStr(candidate.curso);
  const oppAreaNorm = normalizeStr(opportunity.area || opportunity.cargo);
  const oppCourseNorm = normalizeStr(opportunity.cursoRelacionado || opportunity.curso_relacionado);

  let hasCourseMatch = false;
  for (const [courseKey, keywords] of Object.entries(COURSE_AFFINITY_MAP)) {
    if (candCourseNorm.includes(courseKey) || courseKey.includes(candCourseNorm)) {
      const matchesArea = keywords.some((kw) => oppAreaNorm.includes(kw) || oppCourseNorm.includes(kw));
      if (matchesArea) {
        hasCourseMatch = true;
        break;
      }
    }
  }

  if (hasCourseMatch || (oppCourseNorm && candCourseNorm.includes(oppCourseNorm))) {
    courseScore = 25;
    explanations.push(`Seu curso (${candidate.curso}) é altamente aderente à área da vaga.`);
  } else if (candCourseNorm && oppAreaNorm && (oppAreaNorm.includes('tecnologia') || oppAreaNorm.includes('ti'))) {
    courseScore = 20;
    explanations.push(`Formação na área de tecnologia e inovação reconhecida.`);
  } else {
    courseScore = 12;
  }

  // 3. Modalidade de Trabalho (Peso: 15 pontos)
  let modalityScore = 10;
  const oppModalidade = normalizeStr(opportunity.modalidade);
  if (oppModalidade === 'remoto') {
    modalityScore = 15;
    explanations.push(`Vaga 100% remota: máxima flexibilidade geográfica.`);
  } else if (oppModalidade === 'hibrido') {
    modalityScore = 14;
    explanations.push(`Modalidade híbrida conciliável com estudos presenciais.`);
  } else {
    modalityScore = 12;
  }

  // 4. Disponibilidade de Horário (Peso: 10 pontos)
  let availabilityScore = 8;
  const candDisp = normalizeStr(candidate.disponibilidade);
  if (candDisp === 'tarde' || candDisp === 'integral' || candDisp === 'manha') {
    availabilityScore = 10;
    explanations.push(`Sua disponibilidade (${candidate.disponibilidade}) atende o horário padrão do estágio.`);
  }

  // 5. Localização e Unidade FATEC (Peso: 10 pontos)
  let locationScore = 8;
  const candUnidade = normalizeStr(candidate.unidadeFatec || candidate.unidade_fatec);
  const oppLoc = normalizeStr(opportunity.localizacao);

  if (oppModalidade === 'remoto' || (oppLoc && candUnidade && oppLoc.includes('sao paulo'))) {
    locationScore = 10;
  } else {
    locationScore = 7;
  }

  const finalScore = Math.min(100, Math.max(35, skillsScore + courseScore + modalityScore + availabilityScore + locationScore));

  return {
    score: finalScore,
    explanations: explanations.slice(0, 4),
    matchedSkills: matchedSkills.slice(0, 6),
    missingSkills: missingSkills.slice(0, 4),
    breakdown: {
      skills: skillsScore,
      course: courseScore,
      modality: modalityScore,
      availability: availabilityScore,
      location: locationScore,
    },
  };
}

module.exports = {
  calculateMatch,
  normalizeStr,
};

