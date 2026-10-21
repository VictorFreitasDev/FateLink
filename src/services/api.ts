import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  UserRole,
  Opportunity,
  Candidate,
  Application,
  ApplicationStatus,
  Conversation,
  ChatMessage,
  NotificationItem,
  RecruiterDashboardData,
  MutualMatch,
} from '../types';

const PORT = 3000;
const CURRENT_MACHINE_IP = '192.168.103.196';

// Detecção dinâmica de IP para Web, Expo Go em celular físico e emuladores
function getDetectedHost(): string {
  // 1. Se estiver no navegador Web, usa o hostname exato do navegador (localhost ou IP da máquina)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // 2. Se estiver no Expo Go / celular físico, extrai o IP do servidor Metro
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }
  } catch (e) {}

  return CURRENT_MACHINE_IP;
}

const detectedHost = getDetectedHost();

// Lista inteligente de URLs candidatas sem duplicatas
const CANDIDATE_URLS: string[] = Array.from(new Set([
  `http://${detectedHost}:${PORT}`,
  `http://${CURRENT_MACHINE_IP}:${PORT}`,
  `http://localhost:${PORT}`,
  `http://10.0.2.2:${PORT}`,
]));

let workingBaseUrl = CANDIDATE_URLS[0];

async function requestWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
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
  // Login
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
      console.warn('Erro de conexão ao servidor local:', err.message);
      return {
        success: false,
        error: `Não foi possível conectar ao servidor em ${workingBaseUrl}. Certifique-se de que o backend está ativo.`,
      };
    }
  },

  // Cadastro de Usuário no PostgreSQL fatelinkBD
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
      console.warn('Erro ao conectar ao servidor local:', err.message);
      return {
        success: false,
        error: `Falha na conexão com o banco fatelinkBD (${workingBaseUrl}). Verifique se o servidor está ativo.`,
      };
    }
  },

  // Buscar Oportunidades do Banco (com cálculo de match contextual para o aluno se fornecido)
  async getOpportunities(alunoId?: number): Promise<Opportunity[]> {
    try {
      const endpoint = alunoId ? `/api/opportunities?alunoId=${alunoId}` : '/api/opportunities';
      const response = await requestWithFallback(endpoint);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
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
      return null;
    } catch (e) {
      console.warn('Erro ao salvar oportunidade:', e);
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

  // Buscar Oportunidades de uma Empresa Específica (com contagem de inscritos)
  async getCompanyOpportunities(empresaId: number): Promise<Opportunity[]> {
    try {
      const response = await requestWithFallback(`/api/opportunities?empresaId=${empresaId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      console.warn('Erro ao buscar vagas da empresa:', e);
      return [];
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
      return [];
    } catch (e) {
      console.warn('Erro ao buscar candidatos da vaga:', e);
      return [];
    }
  },

  // Buscar Matchs Mútuos (Aluno <-> Empresa)
  async getMatches(userId: number): Promise<{ role: UserRole; matches: MutualMatch[] }> {
    try {
      const response = await requestWithFallback(`/api/matches/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return { role: 'aluno', matches: [] };
    } catch (e) {
      console.warn('Erro ao buscar matches mútuos:', e);
      return { role: 'aluno', matches: [] };
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
      console.warn('Erro ao atualizar foto de perfil:', e);
      return { success: false, error: e.message || 'Erro de conexão ao atualizar foto.' };
    }
  },

  // Buscar Candidatos do Banco
  async getCandidates(): Promise<Candidate[]> {
    try {
      const response = await requestWithFallback('/api/candidates');
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
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
      return null;
    } catch (e) {
      console.warn('Erro ao salvar candidato:', e);
      return null;
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
      return { success: false, error: e.message || 'Falha de comunicação com o servidor.' };
    }
  },

  // Listar candidaturas do estudante
  async getStudentApplications(alunoId: number): Promise<Application[]> {
    try {
      const response = await requestWithFallback(`/api/applications/student/${alunoId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  // Listar candidaturas recebidas pela empresa
  async getCompanyApplications(empresaId: number): Promise<Application[]> {
    try {
      const response = await requestWithFallback(`/api/applications/company/${empresaId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
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

  // ==========================================================
  // FATELINK 2.0: CHAT E MENSAGENS PERSISTIDAS
  // ==========================================================

  async getConversations(userId: number): Promise<Conversation[]> {
    try {
      const response = await requestWithFallback(`/api/conversations/user/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async startConversation(alunoId: number, empresaId: number, vagaId?: number | string): Promise<any> {
    try {
      const response = await requestWithFallback('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId, empresaId, vagaId }),
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async getMessages(conversaId: number | string, currentUserId?: number): Promise<ChatMessage[]> {
    try {
      const query = currentUserId ? `?currentUserId=${currentUserId}` : '';
      const response = await requestWithFallback(`/api/conversations/${conversaId}/messages${query}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async sendMessage(conversaId: number | string, remetenteId: number, conteudo: string): Promise<ChatMessage | null> {
    try {
      const response = await requestWithFallback(`/api/conversations/${conversaId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remetenteId, conteudo }),
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      return null;
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
      return null;
    } catch (e) {
      return null;
    }
  },

  async getNotifications(userId: number): Promise<NotificationItem[]> {
    try {
      const response = await requestWithFallback(`/api/notifications/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async markNotificationRead(notifId: string): Promise<boolean> {
    try {
      const response = await requestWithFallback(`/api/notifications/${notifId}/read`, {
        method: 'PATCH',
      });
      return response.ok;
    } catch (e) {
      return false;
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
      return { saved: false };
    } catch (e) {
      return { saved: false };
    }
  },

  async getSavedJobs(userId: number): Promise<Opportunity[]> {
    try {
      const response = await requestWithFallback(`/api/saved-jobs/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      return [];
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
  ): Promise<{ success: boolean; isMutualMatch?: boolean; matchInfo?: any }> {
    try {
      const response = await requestWithFallback('/api/feed/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, tipoUsuario, targetId, targetTipo, decisao }),
      });
      if (response.ok) {
        return await response.json();
      }
      return { success: false };
    } catch (e) {
      return { success: false };
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
      return false;
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
      return false;
    }
  },
};
