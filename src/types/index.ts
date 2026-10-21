export type UserRole = 'aluno' | 'empresa';

export interface User {
  id: number;
  tipo: UserRole;
  nome: string;
  email: string;
  documento: string;
  curso_ou_ramo?: string;
  imagemUrl?: string;
  criadoEm?: string;
}

export interface MatchBreakdown {
  competencias: number;     // 0 a 35
  formacao: number;         // 0 a 20
  experiencia: number;      // 0 a 15
  disponibilidade: number;  // 0 a 15
  localizacao: number;      // 0 a 15
}

export interface MatchEvaluationResult {
  score: number;
  nivel: 'excelente' | 'alto' | 'moderado' | 'baixo';
  breakdown: MatchBreakdown;
  matchedSkills: string[];
  missingMandatorySkills: string[];
  missingDesirableSkills: string[];
  strengths: string[];
  improvements: string[];
  explanations: string[];
  isBlocked: boolean;
  blockReasons: string[];
}

export interface Opportunity {
  id: string;
  dbId?: number;
  empresaId?: number;
  empresa: string;
  nomeFantasia: string;
  cargo: string;
  area: string;
  cursoRelacionado: string;
  localizacao: string;
  modalidade: 'Remoto' | 'Híbrido' | 'Presencial';
  tipo: 'Estágio' | 'Trainee' | 'Júnior';
  bolsa: string;
  descricao: string;
  requisitos: string[];
  beneficios: string[];
  imagemUrl: string;
  matchScore: number;
  matchExplanations?: string[];
  matchBreakdown?: MatchBreakdown;
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  improvements?: string[];
  isBlocked?: boolean;
  blockReasons?: string[];
  matchLevel?: 'excelente' | 'alto' | 'moderado' | 'baixo';
  status?: 'ativa' | 'pausada' | 'encerrada';
  visualizacoes?: number;
  inscritosCount?: number;
  criadoEm?: string;
}

export interface MutualMatch {
  id: string;
  vagaId?: number;
  empresaId?: number;
  empresaNome?: string;
  cargo?: string;
  localizacao?: string;
  modalidade?: string;
  bolsa?: string;
  requisitos?: string[];
  descricao?: string;
  empresaImagem?: string;
  vagaImagem?: string;
  alunoId?: number;
  candidatoId?: number;
  alunoNome?: string;
  curso?: string;
  semestre?: string;
  unidadeFatec?: string;
  competencias?: string[];
  disponibilidade?: string;
  sobre?: string;
  github?: string;
  linkedin?: string;
  alunoImagem?: string;
  vagaCargo?: string;
  matchScore: number;
  statusConexao: string;
  badgeLabel: string;
  matchData: string;
}

export interface CandidateProject {
  id?: string;
  titulo: string;
  descricao: string;
  tecnologias?: string[];
  imagemUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
}

export interface CandidateExperience {
  id?: string;
  cargo: string;
  empresa: string;
  periodo: string;
  descricao: string;
}

export interface Candidate {
  id: string;
  dbId?: number;
  usuarioId?: number;
  nome: string;
  idade: number;
  curso: string;
  semestre: string;
  unidadeFatec: string;
  previsaoFormacao?: string;
  localizacao?: string;
  modalidadeDesejada?: 'Remoto' | 'Híbrido' | 'Presencial' | 'Qualquer';
  portfolio?: string;
  sobre: string;
  competencias: string[];
  disponibilidade: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  imagemUrl: string;
  github?: string;
  linkedin?: string;
  matchScore: number;
  matchExplanations?: string[];
  matchBreakdown?: MatchBreakdown;
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  improvements?: string[];
  isBlocked?: boolean;
  blockReasons?: string[];
  matchLevel?: 'excelente' | 'alto' | 'moderado' | 'baixo';
  projetos?: CandidateProject[];
  experiencias?: CandidateExperience[];
  certificacoes?: string[];
  curriculoUrl?: string;
  criadoEm?: string;
}

export type ApplicationStatus =
  | 'enviada'
  | 'nova'
  | 'em_analise'
  | 'selecionado'
  | 'entrevista'
  | 'proposta'
  | 'contratado'
  | 'recusada'
  | 'recusado'
  | 'encerrado'
  | 'desistente';

export type InterviewStatus = 'pendente' | 'confirmada' | 'reagendamento_solicitado' | 'cancelada' | 'concluida';
export type InterviewFormat = 'online' | 'presencial';

export interface InterviewSchedule {
  id: number;
  candidaturaId: number;
  empresaId: number;
  alunoId: number;
  vagaId: number;
  status: InterviewStatus;
  formato: InterviewFormat;
  linkOuLocal?: string;
  horariosPropostos: string[];
  horarioConfirmado?: string;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm?: string;
  vagaCargo?: string;
  empresaNome?: string;
  empresaImagem?: string;
  alunoNome?: string;
  alunoEmail?: string;
  alunoCurso?: string;
  alunoSemestre?: string;
  alunoUnidade?: string;
  alunoImagem?: string;
}

export interface Application {
  id: number;
  alunoId: number;
  candidatoId?: number;
  vagaId: number;
  status: ApplicationStatus;
  mensagemApresentacao?: string;
  matchScoreMomento: number;
  matchJustificativas?: string[];
  criadoEm: string;
  atualizadoEm: string;
  // Joins
  vaga?: Opportunity;
  candidato?: Candidate;
  alunoNome?: string;
  alunoEmail?: string;
  empresaNome?: string;
  entrevista?: InterviewSchedule | null;
  historico?: ApplicationHistory[];
}

export interface ApplicationHistory {
  id: number;
  candidaturaId: number;
  statusAnterior?: string | null;
  statusNovo: ApplicationStatus;
  motivo?: string;
  alteradoPor?: number;
  alteradoPorNome?: string;
  criadoEm: string;
}

export interface ChatMessage {
  id: string;
  conversaId?: number;
  sender: 'me' | 'other';
  remetenteId?: number;
  text: string;
  time: string;
  lida?: boolean;
  status?: 'enviando' | 'entregue' | 'lida';
}

export interface Conversation {
  id: string;
  dbId?: number;
  contactName: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  vagaId?: number;
  vagaTitulo?: string;
  messages: ChatMessage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'match' | 'message' | 'proposal' | 'candidatura' | 'status' | 'entrevista' | 'sistema';
}

export interface RecruiterDashboardData {
  vagasAtivasCount: number;
  vagasEncerradasCount: number;
  totalCandidaturas: number;
  novosCandidatosCount: number;
  matchesCount: number;
  entrevistasCount: number;
  contratacoesCount: number;
  candidatosPorEtapa: Record<string, number>;
  totalVisualizacoes: number;
  taxaConversao: number;
  ultimasCandidaturas?: Application[];
  indicadores?: {
    vagasAtivas: number;
    vagasEncerradas: number;
    totalCandidaturas: number;
    novosCandidatos: number;
    matches: number;
    entrevistas: number;
    contratacoes: number;
  };
}

export type NavigationTab =
  | 'list'
  | 'dashboard'
  | 'applications'
  | 'match'
  | 'chat'
  | 'publish'
  | 'filter';

export type SortOption = 'relevancia' | 'recente' | 'maior_bolsa' | 'semestre';

export interface FeedFilterCriteria {
  // Comum e Estudantes (Vagas)
  curso?: string;
  area?: string;
  modalidade?: string;
  tipo?: string;
  localizacao?: string;
  faixa?: string;
  minBolsa?: number;
  competencias?: string[];
  minMatch?: number;
  sortBy?: SortOption;

  // Específico para Empresas (Candidatos)
  unidadeFatec?: string;
  semestre?: string;
  disponibilidade?: string;
}

export interface ChatTarget {
  name: string;
  roleInfo: string;
  targetUserId?: number;
  vagaId?: number;
}

export interface MutualMatchInfo {
  empresaNome: string;
  cargo: string;
  alunoNome?: string;
  empresaId?: number;
  alunoId?: number;
  vagaId?: number;
  alunoImagem?: string;
  empresaImagem?: string;
  matchScore?: number;
}

export interface FeedDecisionResult {
  success: boolean;
  decisao?: 'like' | 'pass';
  targetId?: number;
  isMutualMatch?: boolean;
  matchInfo?: MutualMatchInfo;
}

export type FeedItem = Opportunity | Candidate;

