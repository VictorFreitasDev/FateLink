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

export interface Opportunity {
  id: string;
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

export interface Candidate {
  id: string;
  usuarioId?: number;
  nome: string;
  idade: number;
  curso: string;
  semestre: string;
  unidadeFatec: string;
  sobre: string;
  competencias: string[];
  disponibilidade: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  imagemUrl: string;
  github?: string;
  linkedin?: string;
  matchScore: number;
  matchExplanations?: string[];
  projetos?: Array<{ titulo: string; descricao: string; link?: string }>;
  experiencias?: Array<{ cargo: string; empresa: string; periodo: string; descricao: string }>;
  certificacoes?: string[];
  curriculoUrl?: string;
  criadoEm?: string;
}

export type ApplicationStatus =
  | 'enviada'
  | 'em_analise'
  | 'entrevista'
  | 'proposta'
  | 'contratado'
  | 'recusada'
  | 'desistente';

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
}

export interface ApplicationHistory {
  id: number;
  candidaturaId: number;
  statusAnterior?: ApplicationStatus;
  statusNovo: ApplicationStatus;
  motivo?: string;
  alteradoPor?: number;
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
  type: 'match' | 'message' | 'proposal' | 'candidatura' | 'status' | 'sistema';
}

export interface RecruiterDashboardData {
  vagasAtivasCount: number;
  vagasEncerradasCount: number;
  totalCandidaturas: number;
  candidatosPorEtapa: Record<ApplicationStatus, number>;
  totalVisualizacoes: number;
  taxaConversao: number;
  ultimasCandidaturas: Application[];
}
