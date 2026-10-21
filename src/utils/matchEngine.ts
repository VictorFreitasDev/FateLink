// ==========================================================
// FATELINK 2.0: MOTOR DE MATCH CLIENT-SIDE (TYPESCRIPT)
// Permite cálculo instantâneo e exibição de justificativas
// ==========================================================

import { Candidate, Opportunity } from '../types';

export interface MatchEvaluation {
  score: number;
  explanations: string[];
  matchedSkills: string[];
  missingSkills: string[];
  breakdown: {
    skills: number;
    course: number;
    modality: number;
    availability: number;
    location: number;
  };
}

const COURSE_AFFINITY: Record<string, string[]> = {
  'análise e desenvolvimento de sistemas': ['tecnologia', 'software', 'ti', 'desenvolvimento', 'mobile', 'web', 'full stack', 'backend', 'frontend'],
  'desenvolvimento de software multiplataforma': ['tecnologia', 'software', 'ti', 'desenvolvimento', 'mobile', 'web', 'full stack', 'frontend', 'ui/ux'],
  'gestão da tecnologia da informação': ['ti', 'tecnologia', 'gestão', 'governança', 'segurança', 'suporte'],
  'banco de dados': ['dados', 'banco de dados', 'bi', 'big data', 'sql', 'inteligência artificial'],
  'ciência de dados': ['dados', 'data science', 'analytics', 'ia', 'inteligência artificial', 'python'],
  'logística': ['logística', 'supply chain', 'comércio exterior', 'operações'],
  'gestão empresarial': ['gestão', 'administração', 'finanças', 'rh', 'negócios'],
};

function normalize(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function evaluateMatch(candidate: Partial<Candidate>, opportunity: Partial<Opportunity>): MatchEvaluation {
  const explanations: string[] = [];
  const candSkills = (candidate.competencias || []).map(normalize);
  const oppReqs = (opportunity.requisitos || []).map(normalize);

  // 1. Competências (40 pontos)
  let skillsScore = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  if (oppReqs.length > 0) {
    oppReqs.forEach((req) => {
      const hasMatch = candSkills.some((skill) => {
        return req.includes(skill) || skill.includes(req) || (skill === 'react' && req.includes('react'));
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
      explanations.push(`Você atende ${matchedSkills.length} de ${oppReqs.length} requisitos técnicos.`);
    }
    if (missingSkills.length > 0) {
      explanations.push(`Competência desejável ausente: ${missingSkills[0]}.`);
    }
  } else {
    skillsScore = 30;
  }

  // 2. Curso e Área (25 pontos)
  let courseScore = 12;
  const candCourse = normalize(candidate.curso);
  const oppArea = normalize(opportunity.area || opportunity.cargo);

  let matchFound = false;
  for (const [key, keywords] of Object.entries(COURSE_AFFINITY)) {
    if (candCourse.includes(key) || key.includes(candCourse)) {
      if (keywords.some((kw) => oppArea.includes(kw))) {
        matchFound = true;
        break;
      }
    }
  }

  if (matchFound) {
    courseScore = 25;
    explanations.push(`Curso de ${candidate.curso} altamente compatível com a vaga.`);
  } else if (oppArea.includes('tecnologia') || oppArea.includes('ti')) {
    courseScore = 20;
    explanations.push(`Formação alinhada à área tecnológica da oportunidade.`);
  }

  // 3. Modalidade (15 pontos)
  let modalityScore = 10;
  const modality = normalize(opportunity.modalidade);
  if (modality === 'remoto') {
    modalityScore = 15;
    explanations.push(`Trabalho 100% Remoto (flexibilidade total).`);
  } else if (modality === 'hibrido') {
    modalityScore = 14;
    explanations.push(`Modelo Híbrido conciliável com a FATEC.`);
  } else {
    modalityScore = 12;
  }

  // 4. Disponibilidade (10 pontos)
  let availabilityScore = 8;
  const disp = normalize(candidate.disponibilidade);
  if (disp === 'tarde' || disp === 'integral' || disp === 'manha') {
    availabilityScore = 10;
    explanations.push(`Disponibilidade (${candidate.disponibilidade}) compatível.`);
  }

  // 5. Localização (10 pontos)
  const locationScore = modality === 'remoto' ? 10 : 8;

  const totalScore = Math.min(100, Math.max(35, skillsScore + courseScore + modalityScore + availabilityScore + locationScore));

  return {
    score: totalScore,
    explanations: explanations.slice(0, 4),
    matchedSkills,
    missingSkills,
    breakdown: {
      skills: skillsScore,
      course: courseScore,
      modality: modalityScore,
      availability: availabilityScore,
      location: locationScore,
    },
  };
}

