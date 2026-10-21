import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  UserRole,
  Opportunity,
  Candidate,
  Application,
  ApplicationStatus,
  ApplicationHistory,
  InterviewSchedule,
  Conversation,
  ChatMessage,
  NotificationItem,
  RecruiterDashboardData,
  MutualMatch,
  FeedDecisionResult,
  FeedFilterCriteria,
} from '../types';
import {
  mockOpportunities,
  mockCandidates,
  mockConversations,
  mockNotifications,
} from '../data/mockData';

// Fallback rico para demonstração offline (Vercel static deploy ou servidor local desligado)
const DEMO_USERS: Record<string, NonNullable<AuthResponse['user']>> = {
  'gabriel.santos@fatec.sp.gov.br': {
    id: 10,
    tipo: 'aluno',
    nome: 'Gabriel Santos',
    email: 'gabriel.santos@fatec.sp.gov.br',
    documento: '458.219.740-11',
    curso_ou_ramo: 'Sistemas para Internet',
    imagemUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
  },
  'victor.freitas@fatec.sp.gov.br': {
    id: 1,
    tipo: 'aluno',
    nome: 'Victor Freitas',
    email: 'victor.freitas@fatec.sp.gov.br',
    documento: '456.789.123-00',
    curso_ou_ramo: 'Análise e Desenvolvimento de Sistemas',
    imagemUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  'leticia.martins@fatec.sp.gov.br': {
    id: 11,
    tipo: 'aluno',
    nome: 'Letícia Ribeiro Martins',
    email: 'leticia.martins@fatec.sp.gov.br',
    documento: '394.812.560-88',
    curso_ou_ramo: 'Análise e Desenvolvimento de Sistemas',
    imagemUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  },
  'contato@softpar.com.br': {
    id: 8,
    tipo: 'empresa',
    nome: 'Softpar Tecnologia',
    email: 'contato@softpar.com.br',
    documento: '04.281.930/0001-44',
    curso_ou_ramo: 'Automação Comercial & Software de Gestão',
    imagemUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
  },
  'rh@totvsriopreto.com.br': {
    id: 7,
    tipo: 'empresa',
    nome: 'TOTVS Rio Preto',
    email: 'rh@totvsriopreto.com.br',
    documento: '53.113.791/0002-03',
    curso_ou_ramo: 'Sistemas de Gestão ERP, Cloud & IA',
    imagemUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
  },
  'recrutamento@ibm.com.br': {
    id: 4,
    tipo: 'empresa',
    nome: 'IBM Brasil',
    email: 'recrutamento@ibm.com.br',
    documento: '34.567.890/0001-12',
    curso_ou_ramo: 'Tecnologia da Informação & Cloud',
    imagemUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  },
};

const sampleFallbackMatches: MutualMatch[] = [
  {
    id: 'match-1',
    vagaId: 1,
    empresaId: 8,
    empresaNome: 'Softpar Tecnologia',
    cargo: 'Estágio em Desenvolvimento Backend (Node.js & PostgreSQL)',
    localizacao: 'Jales - SP',
    modalidade: 'Híbrido',
    bolsa: 'R$ 2.100,00',
    descricao: 'Oportunidade para estudantes da FATEC Jales atuarem no desenvolvimento e manutenção de microsserviços em Node.js e banco de dados PostgreSQL.',
    empresaImagem: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    alunoId: 10,
    alunoNome: 'Gabriel Santos',
    curso: 'Sistemas para Internet',
    semestre: '5º Semestre',
    unidadeFatec: 'Fatec Jales - Prof. José Camargo',
    matchScore: 97,
    statusConexao: 'Ativo',
    badgeLabel: 'Elo Estabelecido',
    matchData: 'Hoje',
  },
  {
    id: 'match-2',
    vagaId: 2,
    empresaId: 7,
    empresaNome: 'TOTVS Rio Preto',
    cargo: 'Estágio em Engenharia de Dados & BI',
    localizacao: 'São José do Rio Preto - SP',
    modalidade: 'Remoto',
    bolsa: 'R$ 2.300,00',
    descricao: 'Apoio na construção de pipelines ETL, modelagem dimensional e dashboards em Power BI.',
    empresaImagem: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    alunoId: 1,
    alunoNome: 'Victor Freitas',
    curso: 'Análise e Desenvolvimento de Sistemas',
    semestre: '4º Semestre',
    unidadeFatec: 'Fatec Jales - Prof. José Camargo',
    matchScore: 94,
    statusConexao: 'Ativo',
    badgeLabel: 'Elo Estabelecido',
    matchData: 'Ontem',
  },
];

const sampleFallbackApplications: Application[] = [
  {
    id: 1,
    alunoId: 10,
    vagaId: 1,
    status: 'em_analise',
    mensagemApresentacao: 'Olá! Sou estudante de Sistemas para Internet na Fatec Jales e tenho grande interesse nesta oportunidade de backend.',
    matchScoreMomento: 95,
    criadoEm: new Date(Date.now() - 86400000 * 2).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000).toISOString(),
    empresaNome: 'Softpar Tecnologia',
    vaga: mockOpportunities[0],
  },
  {
    id: 2,
    alunoId: 10,
    vagaId: 2,
    status: 'entrevista',
    mensagemApresentacao: 'Tenho conhecimentos avançados em SQL e interesse em atuar com análise e engenharia de dados.',
    matchScoreMomento: 92,
    criadoEm: new Date(Date.now() - 86400000 * 4).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000 * 2).toISOString(),
    empresaNome: 'TOTVS Rio Preto',
    vaga: mockOpportunities[1],
  },
];

const sampleFallbackCompanyApplications: Application[] = [
  {
    id: 101,
    alunoId: 1,
    vagaId: 1,
    status: 'em_analise',
    mensagemApresentacao: 'Olá! Cursando ADS na Fatec Jales, experiência com React Native, TypeScript e PostgreSQL.',
    matchScoreMomento: 98,
    criadoEm: new Date(Date.now() - 86400000).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000).toISOString(),
    alunoNome: 'Victor Freitas',
    alunoEmail: 'victor.freitas@fatec.sp.gov.br',
    empresaNome: 'Softpar Tecnologia',
    candidato: mockCandidates[0],
  },
  {
    id: 102,
    alunoId: 10,
    vagaId: 1,
    status: 'entrevista',
    mensagemApresentacao: 'Estudante de Sistemas para Internet na Fatec Jales, focado em APIs Node.js e banco de dados.',
    matchScoreMomento: 95,
    criadoEm: new Date(Date.now() - 86400000 * 2).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000).toISOString(),
    alunoNome: 'Gabriel Santos',
    alunoEmail: 'gabriel.santos@fatec.sp.gov.br',
    empresaNome: 'Softpar Tecnologia',
    candidato: mockCandidates[1] || mockCandidates[0],
  },
];

const sampleFallbackDashboard: RecruiterDashboardData = {
  vagasAtivasCount: 3,
  vagasEncerradasCount: 1,
  totalCandidaturas: 12,
  novosCandidatosCount: 4,
  matchesCount: 8,
  entrevistasCount: 3,
  contratacoesCount: 1,
  candidatosPorEtapa: {
    enviada: 4,
    em_analise: 3,
    entrevista: 3,
    proposta: 1,
    contratado: 1,
  },
  taxaConversao: 25,
  totalVisualizacoes: 148,
  indicadores: {
    vagasAtivas: 3,
    vagasEncerradas: 1,
    totalCandidaturas: 12,
    novosCandidatos: 4,
    matches: 8,
    entrevistas: 3,
    contratacoes: 1,
  },
};

function serializeParams(params: Record<string, any>): string {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 'Todas' && value !== 'Todos' && value !== 'Todos os Cursos' && value !== 'Todas as Áreas' && value !== 'Todas as Unidades' && value !== 'Todos os Semestres' && value !== 'Qualquer valor') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`);
        }
      } else {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
  }
  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

const PORT = process.env.EXPO_PUBLIC_API_PORT ? parseInt(process.env.EXPO_PUBLIC_API_PORT, 10) : 3000;

// Detecção dinâmica de host para Web, Expo Go em celular físico e emuladores
function getDetectedHost(): string | null {
  // 1. Se estiver no navegador Web, usa o hostname exato do navegador (localhost ou IP da máquina)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // 2. Se estiver no Expo Go / celular físico, extrai o IP dinâmico do servidor Metro
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (e) {}

  return null;
}

const detectedHost = getDetectedHost();

const isWebHttps = Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.protocol === 'https:';

// Monta lista inteligente de URLs candidatas baseadas no ambiente
const candidateList: string[] = [];

if (process.env.EXPO_PUBLIC_API_URL) {
  candidateList.push(process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, ''));
}

// Na Web, chamadas com caminho relativo ('') funcionam perfeitamente na Vercel (onde /api é servido como Serverless Function)
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  candidateList.push('');
}

// Se estiver em HTTPS na Web sem variável customizada, não inclui localhost:3000 ou http://host:3000 para não quebrar com Mixed Content
if (!isWebHttps || process.env.EXPO_PUBLIC_API_URL) {
  if (detectedHost) {
    candidateList.push(`http://${detectedHost}:${PORT}`);
  }

  candidateList.push(`http://localhost:${PORT}`);
  candidateList.push(`http://127.0.0.1:${PORT}`);
  if (Platform.OS === 'android') {
    candidateList.push(`http://10.0.2.2:${PORT}`);
  }
}

const CANDIDATE_URLS: string[] = Array.from(new Set(candidateList));

let workingBaseUrl = CANDIDATE_URLS.length > 0 ? CANDIDATE_URLS[0] : '';

export function getBaseUrl(): string {
  return workingBaseUrl || 'https://fatelink-demo.local';
}

async function requestWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
  if (CANDIDATE_URLS.length === 0) {
    throw new Error('Nenhum servidor backend configurado ou acessível neste ambiente.');
  }

  const urlsToTry = [workingBaseUrl, ...CANDIDATE_URLS.filter((u) => u !== workingBaseUrl)];
  let lastError: any = null;

  for (const baseUrl of urlsToTry) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout por tentativa

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (workingBaseUrl !== baseUrl) {
        workingBaseUrl = baseUrl;
        console.log(`[FateLink API] Conexão backend estabelecida em: ${baseUrl}`);
      }
      return response;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Não foi possível conectar ao servidor backend em ${CANDIDATE_URLS.join(' ou ')}.`);
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: {
    id: number;
    tipo: UserRole;
    nome: string;
    email: string;
    documento: string;
    curso_ou_ramo: string;
    imagemUrl?: string;
  };
}

export const api = {
  // Login com fallback gracioso para contas demonstrativas (essencial para Vercel)
  async login(credential: string, password: string): Promise<AuthResponse> {
    try {
      const response = await requestWithFallback('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Erro ao efetuar login.' };
      }
      return data;
    } catch (err: any) {
      console.warn('[FateLink API] Backend indisponível, ativando fallback em Modo Demonstração:', err?.message);
      const cleanCred = (credential || '').trim().toLowerCase();

      if (DEMO_USERS[cleanCred]) {
        return {
          success: true,
          message: 'Conectado em Modo Demonstração (servidor local offline).',
          user: DEMO_USERS[cleanCred],
        };
      }

      // Se for formato de e-mail fatec ou estudante
      const isStudent = cleanCred.includes('fatec') || cleanCred.includes('aluno') || !cleanCred.includes('@');
      if (isStudent) {
        return {
          success: true,
          message: 'Conectado em Modo Demonstração (Aluno Fatec).',
          user: {
            id: 10,
            tipo: 'aluno',
            nome: 'Gabriel Santos',
            email: cleanCred.includes('@') ? cleanCred : 'gabriel.santos@fatec.sp.gov.br',
            documento: '458.219.740-11',
            curso_ou_ramo: 'Sistemas para Internet',
            imagemUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
          },
        };
      }

      // Caso contrário, empresa parceira
      return {
        success: true,
        message: 'Conectado em Modo Demonstração (Empresa Parceira).',
        user: {
          id: 8,
          tipo: 'empresa',
          nome: 'Softpar Tecnologia',
          email: cleanCred,
          documento: '04.281.930/0001-44',
          curso_ou_ramo: 'Automação Comercial & Software de Gestão',
          imagemUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
        },
      };
    }
  },

  // Cadastro de Usuário no PostgreSQL fatelinkBD com fallback demonstrativo
  async register(payload: {
    tipo: UserRole;
    nome: string;
    email: string;
    documento: string;
    senha: string;
    curso_ou_ramo?: string;
  }): Promise<AuthResponse> {
    try {
      const response = await requestWithFallback('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Erro ao cadastrar usuário.' };
      }
      return data;
    } catch (err: any) {
      console.warn('[FateLink API] Backend indisponível, simulando cadastro em Modo Demonstração:', err?.message);
      return {
        success: true,
        message: 'Cadastro concluído com sucesso em Modo Demonstração.',
        user: {
          id: Math.floor(Math.random() * 9000) + 2000,
          tipo: payload.tipo,
          nome: payload.nome,
          email: payload.email,
          documento: payload.documento,
          curso_ou_ramo: payload.curso_ou_ramo || (payload.tipo === 'aluno' ? 'Análise e Desenvolvimento de Sistemas' : 'Tecnologia da Informação'),
        },
      };
    }
  },

  // Buscar Oportunidades do Banco (com filtros e fallback inteligente)
  async getOpportunities(alunoId?: number, filters?: FeedFilterCriteria): Promise<Opportunity[]> {
    try {
      const queryParams: Record<string, any> = { alunoId, ...filters };
      const endpoint = `/api/opportunities${serializeParams(queryParams)}`;
      const response = await requestWithFallback(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return mockOpportunities;
    } catch (e) {
      return mockOpportunities;
    }
  },

  // Publicar Oportunidade no Banco
  async createOpportunity(opp: Partial<Opportunity>): Promise<Opportunity | null> {
    try {
      const response = await requestWithFallback('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opp),
      });
      if (response.ok) {
        return await response.json();
      }
      const err = await response.json().catch(() => ({}));
      console.warn('[FateLink API] Erro ao cadastrar oportunidade:', err.error || response.statusText);
      return null;
    } catch (e: any) {
      console.warn('[FateLink API] Falha de conexão ao salvar oportunidade:', e.message);
      return null;
    }
  },

  // Atualizar status da vaga (ativa, pausada, encerrada)
  async updateOpportunityStatus(oppId: string | number, status: 'ativa' | 'pausada' | 'encerrada'): Promise<boolean> {
    try {
      const response = await requestWithFallback(`/api/opportunities/${oppId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  // Encerrar vaga
  async closeOpportunity(oppId: string | number): Promise<boolean> {
    return this.updateOpportunityStatus(oppId, 'encerrada');
  },

  // Reabrir vaga
  async reopenOpportunity(oppId: string | number): Promise<boolean> {
    return this.updateOpportunityStatus(oppId, 'ativa');
  },

  // Excluir vaga do banco de dados
  async deleteOpportunity(oppId: string | number, empresaId?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const query = empresaId ? `?empresaId=${empresaId}` : '';
      const response = await requestWithFallback(`/api/opportunities/${oppId}${query}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        return { success: true };
      }
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || 'Erro ao excluir vaga.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro de conexão ao excluir vaga.' };
    }
  },

  // Registrar visualização da vaga
  async recordOpportunityView(oppId: string | number): Promise<void> {
    try {
      await requestWithFallback(`/api/opportunities/${oppId}/view`, {
        method: 'POST',
      });
    } catch (e) {}
  },

  // Buscar Oportunidades de uma Empresa Específica (com contagem de inscritos)
  async getCompanyOpportunities(empresaId: number): Promise<Opportunity[]> {
    try {
      const response = await requestWithFallback(`/api/opportunities?empresaId=${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return mockOpportunities.slice(0, 4);
    } catch (e) {
      return mockOpportunities.slice(0, 4);
    }
  },

  // Editar Vaga / Oportunidade
  async updateOpportunity(oppId: string | number, payload: Partial<Opportunity>): Promise<Opportunity | null> {
    try {
      const response = await requestWithFallback(`/api/opportunities/${oppId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.warn('Erro ao editar oportunidade:', e);
      return null;
    }
  },

  // Listar Candidatos inscritos em uma Vaga específica
  async getOpportunityCandidates(oppId: string | number): Promise<Application[]> {
    try {
      const response = await requestWithFallback(`/api/opportunities/${oppId}/candidates`);
      if (response.ok) {
        return await response.json();
      }
      return sampleFallbackCompanyApplications;
    } catch (e) {
      return sampleFallbackCompanyApplications;
    }
  },

  // Buscar Matchs Mútuos (Aluno <-> Empresa)
  async getMatches(userId: number): Promise<{ role: UserRole; matches: MutualMatch[] }> {
    try {
      const response = await requestWithFallback(`/api/matches/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.matches) && data.matches.length > 0) return data;
      }
      return { role: 'aluno', matches: sampleFallbackMatches };
    } catch (e) {
      return { role: 'aluno', matches: sampleFallbackMatches };
    }
  },

  // Atualizar Foto de Perfil do Usuário
  async updateProfileImage(userId: number, imagemUrl: string): Promise<{ success: boolean; imagemUrl?: string; error?: string }> {
    try {
      const response = await requestWithFallback(`/api/users/${userId}/profile-image`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagemUrl }),
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, imagemUrl: data.user?.imagemUrl || imagemUrl };
      }
      return { success: false, error: data.error || 'Erro ao atualizar foto de perfil.' };
    } catch (e: any) {
      return { success: true, imagemUrl };
    }
  },

  // Buscar perfil completo do candidato pelo userId
  async getCandidateProfile(userId: number): Promise<Candidate | null> {
    try {
      const response = await requestWithFallback(`/api/candidates/profile/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      const found = mockCandidates.find(c => c.usuarioId === userId || c.id === `cand-${userId}`);
      return found || mockCandidates[0];
    } catch (e) {
      const found = mockCandidates.find(c => c.usuarioId === userId || c.id === `cand-${userId}`);
      return found || mockCandidates[0];
    }
  },

  // Atualizar perfil completo do candidato
  async updateCandidateProfile(userId: number, payload: Partial<Candidate>): Promise<Candidate | null> {
    try {
      const response = await requestWithFallback(`/api/candidates/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.warn('Erro ao atualizar perfil do estudante:', e);
      return null;
    }
  },

  // Upload real de currículo em PDF
  async uploadResume(userId: number, fileName: string, fileBase64: string): Promise<{ success: boolean; curriculoUrl?: string; candidato?: Candidate; error?: string }> {
    try {
      const response = await requestWithFallback(`/api/candidates/profile/${userId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileBase64 }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return data;
      }
      return { success: false, error: data.error || 'Erro ao enviar currículo.' };
    } catch (e: any) {
      console.warn('Erro ao fazer upload do currículo:', e);
      return { success: false, error: e.message || 'Erro de conexão no upload do currículo.' };
    }
  },

  // Remover currículo em PDF
  async deleteResume(userId: number): Promise<{ success: boolean; candidato?: Candidate; error?: string }> {
    try {
      const response = await requestWithFallback(`/api/candidates/profile/${userId}/resume`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return data;
      }
      return { success: false, error: data.error || 'Erro ao remover currículo.' };
    } catch (e: any) {
      console.warn('Erro ao remover currículo:', e);
      return { success: false, error: e.message || 'Erro de conexão ao remover currículo.' };
    }
  },

  // Obter URL absoluta para download/visualização do currículo
  getResumeUrl(relativeUrl?: string | null): string | null {
    if (!relativeUrl) return null;
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    const base = getBaseUrl();
    return `${base}${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
  },

  // Buscar Candidatos do Banco (com filtros e motor de recomendação)
  async getCandidates(filters?: FeedFilterCriteria): Promise<Candidate[]> {
    try {
      const endpoint = `/api/candidates${serializeParams(filters || {})}`;
      const response = await requestWithFallback(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return mockCandidates;
    } catch (e) {
      return mockCandidates;
    }
  },

  // Publicar Candidato no Banco
  async createCandidate(cand: Partial<Candidate>): Promise<Candidate | null> {
    try {
      const response = await requestWithFallback('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cand),
      });
      if (response.ok) {
        return await response.json();
      }
      return { id: `cand-${Date.now()}`, ...cand } as Candidate;
    } catch (e: any) {
      return { id: `cand-${Date.now()}`, ...cand } as Candidate;
    }
  },

  // ==========================================================
  // FATELINK 2.0: CANDIDATURAS REAIS
  // ==========================================================

  // Candidatar-se a uma vaga
  async createApplication(
    alunoId: number,
    vagaId: number | string,
    mensagemApresentacao?: string
  ): Promise<{ success: boolean; application?: Application; error?: string }> {
    try {
      const response = await requestWithFallback('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId, vagaId, mensagemApresentacao }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Erro ao enviar candidatura.' };
      }
      return { success: true, application: data.application };
    } catch (e: any) {
      return {
        success: true,
        application: {
          id: Math.floor(Math.random() * 9000) + 100,
          aluno_id: alunoId,
          vaga_id: typeof vagaId === 'number' ? vagaId : 1,
          status: 'candidatura_enviada',
          mensagem_apresentacao: mensagemApresentacao || '',
          criado_em: new Date().toISOString(),
        } as any,
      };
    }
  },

  // Listar candidaturas do estudante
  async getStudentApplications(alunoId: number): Promise<Application[]> {
    try {
      const response = await requestWithFallback(`/api/applications/student/${alunoId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return sampleFallbackApplications;
    } catch (e) {
      return sampleFallbackApplications;
    }
  },

  // Listar candidaturas recebidas pela empresa
  async getCompanyApplications(empresaId: number): Promise<Application[]> {
    try {
      const response = await requestWithFallback(`/api/applications/company/${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return sampleFallbackCompanyApplications;
    } catch (e) {
      return sampleFallbackCompanyApplications;
    }
  },

  // Atualizar etapa da candidatura (Enviada -> Em análise -> Entrevista -> Proposta -> Contratado)
  async updateApplicationStatus(
    candidaturaId: number,
    status: ApplicationStatus,
    motivo?: string,
    alteradoPor?: number
  ): Promise<boolean> {
    try {
      const response = await requestWithFallback(`/api/applications/${candidaturaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, motivo, alteradoPor }),
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  // Obter histórico de alterações da candidatura
  async getApplicationHistory(candidaturaId: number): Promise<ApplicationHistory[]> {
    try {
      const response = await requestWithFallback(`/api/applications/${candidaturaId}/history`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // ==========================================================
  // FATELINK 2.0: AGENDAMENTO DE ENTREVISTAS REAL (ETAPA 8)
  // ==========================================================

  // Empresa propõe horários de entrevista
  async proposeInterview(payload: {
    candidaturaId: number;
    empresaId: number;
    formato: 'online' | 'presencial';
    linkOuLocal?: string;
    horariosPropostos: string[];
    observacoes?: string;
  }): Promise<{ success: boolean; interview?: InterviewSchedule; error?: string }> {
    try {
      const response = await requestWithFallback('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, interview: data.interview };
      }
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error || 'Erro ao agendar entrevista.' };
    } catch (e: any) {
      return {
        success: true,
        interview: {
          id: Math.floor(Math.random() * 9000) + 1,
          candidatura_id: payload.candidaturaId,
          empresa_id: payload.empresaId,
          formato: payload.formato,
          status: 'proposta',
          horarios_propostos: payload.horariosPropostos,
          mensagem: payload.observacoes,
          criado_em: new Date().toISOString(),
        } as any,
      };
    }
  },

  // Estudante confirma um dos horários oferecidos
  async confirmInterview(
    interviewId: number,
    alunoId: number,
    horarioEscolhido: string
  ): Promise<{ success: boolean; interview?: InterviewSchedule; error?: string }> {
    try {
      const response = await requestWithFallback(`/api/interviews/${interviewId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId, horarioEscolhido }),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, interview: data.interview };
      }
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error || 'Erro ao confirmar horário de entrevista.' };
    } catch (e: any) {
      return {
        success: true,
        interview: {
          id: interviewId,
          status: 'confirmada',
          horario_selecionado: horarioEscolhido,
        } as any,
      };
    }
  },

  // Buscar entrevistas do estudante
  async getStudentInterviews(alunoId: number): Promise<InterviewSchedule[]> {
    try {
      const response = await requestWithFallback(`/api/interviews/student/${alunoId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // Buscar entrevista vinculada a uma candidatura
  async getInterviewByCandidatura(candidaturaId: number): Promise<InterviewSchedule | null> {
    try {
      const response = await requestWithFallback(`/api/interviews/application/${candidaturaId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  // ==========================================================
  // FATELINK 2.0: CHAT E MENSAGENS PERSISTIDAS
  // ==========================================================

  async getConversations(userId: number): Promise<Conversation[]> {
    try {
      const response = await requestWithFallback(`/api/conversations/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return mockConversations;
    } catch (e) {
      return mockConversations;
    }
  },

  async startConversation(userAId: number, userBId: number, vagaId?: number | string): Promise<any> {
    try {
      const response = await requestWithFallback('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId: userAId, empresaId: userBId, vagaId }),
      });
      if (response.ok) {
        return await response.json();
      }
      return { id: `conv-${Date.now()}` };
    } catch (e: any) {
      return { id: `conv-${Date.now()}` };
    }
  },

  async getMessages(conversaId: number | string, currentUserId?: number): Promise<ChatMessage[]> {
    try {
      const cleanId = String(conversaId).replace('conv-', '');
      const query = currentUserId ? `?currentUserId=${currentUserId}` : '';
      const response = await requestWithFallback(`/api/conversations/${cleanId}/messages${query}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      const conv = mockConversations.find(c => c.id === conversaId || c.id === `conv-${conversaId}`);
      return conv?.messages || [];
    } catch (e) {
      const conv = mockConversations.find(c => c.id === conversaId || c.id === `conv-${conversaId}`);
      return conv?.messages || [];
    }
  },

  async sendMessage(conversaId: number | string, remetenteId: number, conteudo: string): Promise<ChatMessage | null> {
    try {
      const cleanId = String(conversaId).replace('conv-', '');
      const response = await requestWithFallback(`/api/conversations/${cleanId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remetenteId, conteudo }),
      });
      if (response.ok) {
        return await response.json();
      }
      return {
        id: `m-${Date.now()}`,
        sender: 'me',
        text: conteudo,
        time: 'Agora',
      };
    } catch (e: any) {
      return {
        id: `m-${Date.now()}`,
        sender: 'me',
        text: conteudo,
        time: 'Agora',
      };
    }
  },

  // ==========================================================
  // FATELINK 2.0: DASHBOARD, NOTIFICAÇÕES & FAVORITOS
  // ==========================================================

  async getRecruiterDashboard(empresaId: number): Promise<RecruiterDashboardData | null> {
    try {
      const response = await requestWithFallback(`/api/dashboard/recruiter/${empresaId}`);
      if (response.ok) {
        return await response.json();
      }
      return sampleFallbackDashboard;
    } catch (e) {
      return sampleFallbackDashboard;
    }
  },

  async getNotifications(userId: number): Promise<NotificationItem[]> {
    try {
      const response = await requestWithFallback(`/api/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return mockNotifications;
    } catch (e) {
      return mockNotifications;
    }
  },

  async markNotificationRead(notifId: string): Promise<boolean> {
    try {
      const response = await requestWithFallback(`/api/notifications/${notifId}/read`, {
        method: 'PATCH',
      });
      return response.ok;
    } catch (e) {
      return true;
    }
  },

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      const response = await requestWithFallback(`/api/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
      });
      return response.ok;
    } catch (e) {
      return true;
    }
  },

  async toggleSaveJob(userId: number, vagaId: number | string): Promise<{ saved: boolean }> {
    try {
      const response = await requestWithFallback('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, vagaId }),
      });
      if (response.ok) {
        return await response.json();
      }
      return { saved: true };
    } catch (e) {
      return { saved: true };
    }
  },

  async getSavedJobs(userId: number): Promise<Opportunity[]> {
    try {
      const response = await requestWithFallback(`/api/saved-jobs/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return mockOpportunities.slice(0, 2);
    } catch (e) {
      return mockOpportunities.slice(0, 2);
    }
  },

  // ==========================================================
  // FATELINK IMERSIVO: DECISÕES DE SWIPE (LIKE / PASS)
  // ==========================================================

  async sendFeedDecision(
    usuarioId: number,
    tipoUsuario: UserRole,
    targetId: number | string,
    targetTipo: 'vaga' | 'candidato',
    decisao: 'like' | 'pass'
  ): Promise<FeedDecisionResult> {
    try {
      const response = await requestWithFallback('/api/feed/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, tipoUsuario, targetId, targetTipo, decisao }),
      });
      if (response.ok) {
        return await response.json();
      }
      return {
        success: true,
        decisao,
        isMutualMatch: decisao === 'like' && Math.random() > 0.65,
      };
    } catch (e) {
      return {
        success: true,
        decisao,
        isMutualMatch: decisao === 'like' && Math.random() > 0.65,
      };
    }
  },

  async getFeedDecisions(
    usuarioId: number,
    targetTipo: 'vaga' | 'candidato'
  ): Promise<Array<{ target_id: number; decisao: 'like' | 'pass' }>> {
    try {
      const response = await requestWithFallback(`/api/feed/decisions/${usuarioId}?targetTipo=${targetTipo}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async undoFeedDecision(
    usuarioId: number,
    targetTipo: 'vaga' | 'candidato'
  ): Promise<boolean> {
    try {
      const response = await requestWithFallback('/api/feed/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, targetTipo }),
      });
      return response.ok;
    } catch (e) {
      return true;
    }
  },

  async resetFeed(
    usuarioId: number,
    targetTipo: 'vaga' | 'candidato'
  ): Promise<boolean> {
    try {
      const response = await requestWithFallback('/api/feed/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, targetTipo }),
      });
      return response.ok;
    } catch (e) {
      return true;
    }
  },
};
