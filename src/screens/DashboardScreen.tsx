import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import {
  RecruiterDashboardData,
  Opportunity,
  Application,
  ApplicationStatus,
  Candidate,
  ApplicationHistory,
} from '../types';
import { api } from '../services/api';
import { ModalDetails } from '../components/ModalDetails';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DashboardScreenProps {
  empresaId?: number;
  onNavigateToApplications: () => void;
  onNavigateToPublish: () => void;
  onStartChat?: (name: string, roleInfo: string, targetUserId?: number, vagaId?: number) => void;
}

// 7 Etapas Oficiais do Pipeline de Recrutamento Kanban
export const KANBAN_STAGES: {
  key: string;
  statuses: ApplicationStatus[];
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    key: 'nova',
    statuses: ['enviada', 'nova'],
    label: 'Nova Candidatura',
    shortLabel: 'Novas',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: 'paper-plane-outline',
    description: 'Candidaturas recém-submetidas aguardando triagem',
  },
  {
    key: 'em_analise',
    statuses: ['em_analise'],
    label: 'Em Análise',
    shortLabel: 'Análise',
    color: '#D97706',
    bg: '#FFFBEB',
    icon: 'search-outline',
    description: 'Currículo e portfólio em avaliação pela equipe',
  },
  {
    key: 'selecionado',
    statuses: ['selecionado'],
    label: 'Selecionado',
    shortLabel: 'Selecionados',
    color: '#6366F1',
    bg: '#EEF2FF',
    icon: 'checkmark-circle-outline',
    description: 'Aprovado na triagem inicial para testes ou dinâmicas',
  },
  {
    key: 'entrevista',
    statuses: ['entrevista'],
    label: 'Entrevista',
    shortLabel: 'Entrevistas',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: 'calendar-outline',
    description: 'Entrevista técnica ou comportamental agendada',
  },
  {
    key: 'proposta',
    statuses: ['proposta'],
    label: 'Proposta',
    shortLabel: 'Propostas',
    color: '#0D9488',
    bg: '#F0FDFA',
    icon: 'gift-outline',
    description: 'Oferta formal de estágio/emprego apresentada',
  },
  {
    key: 'contratado',
    statuses: ['contratado'],
    label: 'Contratado',
    shortLabel: 'Contratados',
    color: '#16A34A',
    bg: '#F0FDF4',
    icon: 'trophy-outline',
    description: 'Candidato formalmente admitido pela empresa',
  },
  {
    key: 'recusada',
    statuses: ['recusada', 'recusado', 'encerrado', 'desistente'],
    label: 'Recusado / Encerrado',
    shortLabel: 'Recusados',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: 'close-circle-outline',
    description: 'Processo encerrado ou não aprovado',
  },
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  empresaId,
  onNavigateToApplications,
  onNavigateToPublish,
  onStartChat,
}) => {
  // Aba ativa do painel corporativo: 'kanban' | 'vagas' | 'metricas'
  const [activeTab, setActiveTab] = useState<'kanban' | 'vagas' | 'metricas'>('kanban');

  // Dados do backend
  const [dashboardData, setDashboardData] = useState<RecruiterDashboardData | null>(null);
  const [companyOpps, setCompanyOpps] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros de busca no Kanban e Candidatos
  const [searchName, setSearchName] = useState('');
  const [filterVagaId, setFilterVagaId] = useState<string>('todas');
  const [filterStage, setFilterStage] = useState<string>('todas');
  const [filterSkill, setFilterSkill] = useState('');

  // Mobile: coluna Kanban selecionada no modo compacto
  const [mobileActiveStageKey, setMobileActiveStageKey] = useState<string>('nova');

  // Modais de Ação
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Modal de Histórico de Candidatura
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [candidateHistory, setCandidateHistory] = useState<ApplicationHistory[]>([]);
  const [activeAppForHistory, setActiveAppForHistory] = useState<Application | null>(null);

  // Modal para Mover Etapa
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [appToMove, setAppToMove] = useState<Application | null>(null);
  const [movingStage, setMovingStage] = useState(false);

  // Modal de Edição de Vaga
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [editCargo, setEditCargo] = useState('');
  const [editBolsa, setEditBolsa] = useState('');
  const [editModalidade, setEditModalidade] = useState<'Remoto' | 'Híbrido' | 'Presencial'>('Híbrido');
  const [editLocal, setEditLocal] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editReqs, setEditReqs] = useState('');
  const [editBeneficios, setEditBeneficios] = useState('');
  const [editStatus, setEditStatus] = useState<'ativa' | 'pausada' | 'encerrada'>('ativa');
  const [editImagemUrl, setEditImagemUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Carregar dados reais do PostgreSQL via Express
  const loadDashboardData = async () => {
    if (!empresaId) return;
    try {
      const [dashRes, oppsRes, appsRes] = await Promise.all([
        api.getRecruiterDashboard(empresaId),
        api.getCompanyOpportunities(empresaId),
        api.getCompanyApplications(empresaId),
      ]);

      setDashboardData(dashRes);
      setCompanyOpps(oppsRes);
      setApplications(appsRes);
    } catch (e) {
      console.warn('Erro ao carregar dashboard da empresa:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [empresaId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Helper para alertas multiplataforma
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ==========================================================
  // GESTÃO DE VAGAS: EDITAR, ENCERRAR, REABRIR, EXCLUIR
  // ==========================================================
  const handleOpenEdit = (opp: Opportunity) => {
    setEditingOpp(opp);
    setEditCargo(opp.cargo);
    setEditBolsa(opp.bolsa);
    setEditModalidade(opp.modalidade || 'Híbrido');
    setEditLocal(opp.localizacao);
    setEditDesc(opp.descricao);
    setEditReqs(opp.requisitos ? opp.requisitos.join(', ') : '');
    setEditBeneficios(opp.beneficios ? opp.beneficios.join(', ') : '');
    setEditStatus((opp.status as any) || 'ativa');
    setEditImagemUrl(opp.imagemUrl || '');
  };

  const handleSaveEdit = async () => {
    if (!editingOpp) return;
    if (!editCargo.trim() || !editBolsa.trim() || !editDesc.trim()) {
      showAlert('Campos Obrigatórios', 'Preencha cargo, bolsa e descrição da vaga.');
      return;
    }

    setSavingEdit(true);
    try {
      const payload: Partial<Opportunity> = {
        cargo: editCargo.trim(),
        bolsa: editBolsa.trim(),
        modalidade: editModalidade,
        localizacao: editLocal.trim(),
        descricao: editDesc.trim(),
        requisitos: editReqs.split(',').map((r) => r.trim()).filter(Boolean),
        beneficios: editBeneficios.split(',').map((b) => b.trim()).filter(Boolean),
        status: editStatus,
        imagemUrl: editImagemUrl.trim() || editingOpp.imagemUrl,
      };

      const updated = await api.updateOpportunity(editingOpp.id, payload);
      if (updated) {
        setCompanyOpps((prev) =>
          prev.map((o) => (o.id === editingOpp.id ? { ...o, ...updated } : o))
        );
        setEditingOpp(null);
        showAlert('Sucesso! 🚀', `Vaga "${updated.cargo}" atualizada com sucesso!`);
        loadDashboardData();
      } else {
        showAlert('Erro', 'Não foi possível salvar as alterações da vaga.');
      }
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro inesperado ao salvar vaga.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Encerrar Vaga
  const handleCloseOpportunity = async (opp: Opportunity) => {
    const confirm = () => {
      api.closeOpportunity(opp.id).then((ok) => {
        if (ok) {
          showAlert('Vaga Encerrada', `A vaga "${opp.cargo}" foi encerrada.`);
          loadDashboardData();
        } else {
          showAlert('Erro', 'Falha ao encerrar vaga.');
        }
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Deseja encerrar a vaga "${opp.cargo}"? Novos estudantes não poderão se candidatar.`)) {
        confirm();
      }
    } else {
      Alert.alert('Encerrar Vaga', `Deseja encerrar a vaga "${opp.cargo}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerrar', style: 'destructive', onPress: confirm },
      ]);
    }
  };

  // Reabrir Vaga
  const handleReopenOpportunity = async (opp: Opportunity) => {
    const ok = await api.reopenOpportunity(opp.id);
    if (ok) {
      showAlert('Vaga Reaberta! 🚀', `A vaga "${opp.cargo}" está ativa novamente para alunos FATEC.`);
      loadDashboardData();
    } else {
      showAlert('Erro', 'Não foi possível reabrir a vaga.');
    }
  };

  // Excluir Vaga
  const handleDeleteOpportunity = async (opp: Opportunity) => {
    const doDelete = async () => {
      const res = await api.deleteOpportunity(opp.id, empresaId);
      if (res.success) {
        showAlert('Vaga Excluída', `A oportunidade "${opp.cargo}" foi removida com sucesso.`);
        loadDashboardData();
      } else {
        showAlert('Erro ao Excluir', res.error || 'Não foi possível excluir a vaga.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Tem certeza que deseja EXCLUIR permanentemente a vaga "${opp.cargo}" e suas candidaturas associadas?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Confirmar Exclusão',
        `Tem certeza que deseja excluir permanentemente a vaga "${opp.cargo}"? Todas as candidaturas associadas serão removidas.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  // ==========================================================
  // PIPELINE KANBAN: MOVIMENTAÇÃO DE CANDIDATOS ENTRE ETAPAS
  // ==========================================================
  const handleMoveCandidate = async (appId: number, targetStatus: ApplicationStatus, customMotivo?: string) => {
    setMovingStage(true);
    try {
      const motivo = customMotivo || `Movido para a etapa: ${targetStatus.toUpperCase()}`;
      const ok = await api.updateApplicationStatus(appId, targetStatus, motivo, empresaId);
      if (ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: targetStatus, atualizadoEm: new Date().toISOString() } : a))
        );
        setMoveModalVisible(false);
        setAppToMove(null);
        // Atualiza indicadores do dashboard
        loadDashboardData();
      } else {
        showAlert('Erro', 'Não foi possível atualizar a etapa do candidato.');
      }
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro ao mover candidato.');
    } finally {
      setMovingStage(false);
    }
  };

  // Abrir Histórico da Candidatura
  const handleOpenHistory = async (app: Application) => {
    setActiveAppForHistory(app);
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const history = await api.getApplicationHistory(app.id);
      setCandidateHistory(history);
    } catch (e) {
      console.warn('Erro ao carregar histórico:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Abrir Perfil Completo do Candidato via ModalDetails
  const handleOpenCandidateProfile = (cand?: Candidate) => {
    if (!cand) return;
    setSelectedCandidate(cand);
    setIsDetailsVisible(true);
  };

  // ==========================================================
  // FILTRAGEM DE CANDIDATURAS
  // ==========================================================
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Filtro por Nome
      if (searchName.trim()) {
        const query = searchName.toLowerCase();
        const candName = (app.candidato?.nome || app.alunoNome || '').toLowerCase();
        if (!candName.includes(query)) return false;
      }

      // Filtro por Vaga Específica
      if (filterVagaId !== 'todas') {
        const cleanVagaId = parseInt(filterVagaId.replace('opp-', ''), 10);
        if (app.vagaId !== cleanVagaId) return false;
      }

      // Filtro por Etapa
      if (filterStage !== 'todas') {
        const stageConfig = KANBAN_STAGES.find((s) => s.key === filterStage);
        if (stageConfig && !stageConfig.statuses.includes(app.status)) return false;
      }

      // Filtro por Competência
      if (filterSkill.trim()) {
        const skillQuery = filterSkill.toLowerCase().trim();
        const candSkills = (app.candidato?.competencias || []).map((s) => s.toLowerCase());
        const hasSkill = candSkills.some((s) => s.includes(skillQuery));
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [applications, searchName, filterVagaId, filterStage, filterSkill]);

  // Agrupamento por Coluna Kanban
  const kanbanColumns = useMemo(() => {
    const map: Record<string, Application[]> = {};
    KANBAN_STAGES.forEach((stage) => {
      map[stage.key] = filteredApplications.filter((app) => stage.statuses.includes(app.status));
    });
    return map;
  }, [filteredApplications]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando painel de recrutamento real...</Text>
      </View>
    );
  }

  const indicadores = dashboardData?.indicadores || {
    vagasAtivas: dashboardData?.vagasAtivasCount || 0,
    vagasEncerradas: dashboardData?.vagasEncerradasCount || 0,
    totalCandidaturas: dashboardData?.totalCandidaturas || 0,
    novosCandidatos: dashboardData?.novosCandidatosCount || 0,
    matches: dashboardData?.matchesCount || 0,
    entrevistas: dashboardData?.entrevistasCount || 0,
    contratacoes: dashboardData?.contratacoesCount || 0,
  };

  const isWide = Platform.OS === 'web' && SCREEN_WIDTH >= 900;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
    >
      {/* ========================================================== */}
      {/* 1. CABEÇALHO DO PAINEL EMPRESARIAL */}
      {/* ========================================================== */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeTopRow}>
            <Text style={styles.badgeTop}>FATElink 2.0 • CENTRAL DE RECRUTAMENTO</Text>
          </View>
          <Text style={styles.title}>Painel Corporativo & Recrutamento</Text>
          <Text style={styles.subtitle}>
            Pipeline Kanban em tempo real, gestão de vagas ativas e banco de talentos FATEC.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.publishVagaBtn}
            onPress={onNavigateToPublish}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.publishVagaBtnText}>Publicar Nova Vaga</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ========================================================== */}
      {/* 2. INDICADORES REAIS DO DASHBOARD (7 KPIS OBRIGATÓRIOS) */}
      {/* ========================================================== */}
      <View style={styles.kpiContainer}>
        <Text style={styles.kpiSectionTitle}>Indicadores Globais de Recrutamento</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiScrollContent}
        >
          {/* 1. Vagas Ativas */}
          <View style={[styles.kpiCard, { borderColor: '#BBF7D0' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="briefcase" size={20} color="#16A34A" />
            </View>
            <Text style={styles.kpiValue}>{indicadores.vagasAtivas}</Text>
            <Text style={styles.kpiLabel}>Vagas Ativas</Text>
          </View>

          {/* 2. Vagas Encerradas */}
          <View style={[styles.kpiCard, { borderColor: '#FECACA' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="archive" size={20} color="#DC2626" />
            </View>
            <Text style={styles.kpiValue}>{indicadores.vagasEncerradas}</Text>
            <Text style={styles.kpiLabel}>Encerradas</Text>
          </View>

          {/* 3. Total de Candidaturas */}
          <View style={[styles.kpiCard, { borderColor: '#BFDBFE' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people" size={20} color="#2563EB" />
            </View>
            <Text style={styles.kpiValue}>{indicadores.totalCandidaturas}</Text>
            <Text style={styles.kpiLabel}>Candidaturas</Text>
          </View>

          {/* 4. Novos Candidatos */}
          <View style={[styles.kpiCard, { borderColor: '#FED7AA' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="sparkles" size={20} color="#EA580C" />
            </View>
            <Text style={styles.kpiValue}>{indicadores.novosCandidatos}</Text>
            <Text style={styles.kpiLabel}>Novos Talentos</Text>
          </View>

          {/* 5. Matches Mútuos */}
          <View style={[styles.kpiCard, { borderColor: '#DDD6FE' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="heart" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.kpiValue}>{indicadores.matches}</Text>
            <Text style={styles.kpiLabel}>Matches Mútuos</Text>
          </View>

          {/* 6. Entrevistas */}
          <View style={[styles.kpiCard, { borderColor: '#C7D2FE' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="calendar" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.kpiValue}>{indicadores.entrevistas}</Text>
            <Text style={styles.kpiLabel}>Entrevistas</Text>
          </View>

          {/* 7. Contratações */}
          <View style={[styles.kpiCard, { borderColor: '#A7F3D0' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="trophy" size={20} color="#059669" />
            </View>
            <Text style={styles.kpiValue}>{indicadores.contratacoes}</Text>
            <Text style={styles.kpiLabel}>Contratações</Text>
          </View>

          {/* Métrica Adicional: Conversão & Visualizações */}
          <View style={[styles.kpiCard, { borderColor: '#E2E8F0' }]}>
            <View style={[styles.kpiIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="trending-up" size={20} color="#475569" />
            </View>
            <Text style={styles.kpiValue}>{dashboardData?.taxaConversao || 0}%</Text>
            <Text style={styles.kpiLabel}>Taxa Conversão</Text>
          </View>
        </ScrollView>
      </View>

      {/* ========================================================== */}
      {/* 3. NAVEGAÇÃO ENTRE ABAS DO DASHBOARD */}
      {/* ========================================================== */}
      <View style={styles.tabNavContainer}>
        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'kanban' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('kanban')}
        >
          <Ionicons
            name="layers-outline"
            size={18}
            color={activeTab === 'kanban' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'kanban' && styles.tabNavTextActive]}>
            Pipeline Kanban ({filteredApplications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'vagas' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('vagas')}
        >
          <Ionicons
            name="briefcase-outline"
            size={18}
            color={activeTab === 'vagas' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'vagas' && styles.tabNavTextActive]}>
            Minhas Vagas ({companyOpps.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'metricas' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('metricas')}
        >
          <Ionicons
            name="bar-chart-outline"
            size={18}
            color={activeTab === 'metricas' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.tabNavText, activeTab === 'metricas' && styles.tabNavTextActive]}>
            Funil & Desempenho
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================== */}
      {/* ABA 1: PIPELINE DE RECRUTAMENTO KANBAN */}
      {/* ========================================================== */}
      {activeTab === 'kanban' && (
        <View style={styles.tabContentBlock}>
          {/* BARRA DE FILTROS INTEGRADOS (Nome, Vaga, Etapa, Competências) */}
          <View style={styles.filterSectionCard}>
            <View style={styles.filterSectionHeader}>
              <View style={styles.filterHeaderTitleRow}>
                <Ionicons name="filter" size={18} color={Colors.primary} />
                <Text style={styles.filterSectionTitle}>Filtros do Pipeline</Text>
              </View>
              {(searchName !== '' || filterVagaId !== 'todas' || filterStage !== 'todas' || filterSkill !== '') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchName('');
                    setFilterVagaId('todas');
                    setFilterStage('todas');
                    setFilterSkill('');
                  }}
                  style={styles.clearFiltersBtn}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                  <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterFieldsRow}>
              {/* Busca por Nome */}
              <View style={styles.searchFieldBox}>
                <Ionicons name="search-outline" size={16} color={Colors.placeholder} />
                <TextInput
                  style={styles.filterInput}
                  placeholder="Buscar candidato por nome..."
                  value={searchName}
                  onChangeText={setSearchName}
                  placeholderTextColor={Colors.placeholder}
                />
              </View>

              {/* Busca por Competência / Tecnologia */}
              <View style={styles.searchFieldBox}>
                <Ionicons name="code-slash-outline" size={16} color={Colors.placeholder} />
                <TextInput
                  style={styles.filterInput}
                  placeholder="Competência (ex: React, Node, Python)..."
                  value={filterSkill}
                  onChangeText={setFilterSkill}
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </View>

            {/* Seletores de Vaga e Etapa em Chips */}
            <View style={styles.filterSelectorsRow}>
              {/* Seletor de Vaga */}
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={styles.selectorLabel}>Vaga Específica:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, filterVagaId === 'todas' && styles.filterChipActive]}
                    onPress={() => setFilterVagaId('todas')}
                  >
                    <Text style={[styles.filterChipText, filterVagaId === 'todas' && styles.filterChipTextActive]}>
                      Todas as Vagas
                    </Text>
                  </TouchableOpacity>
                  {companyOpps.map((opp) => (
                    <TouchableOpacity
                      key={opp.id}
                      style={[styles.filterChip, filterVagaId === String(opp.id) && styles.filterChipActive]}
                      onPress={() => setFilterVagaId(String(opp.id))}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filterVagaId === String(opp.id) && styles.filterChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {opp.cargo}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Seletor de Etapa */}
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={styles.selectorLabel}>Etapa do Funil:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  <TouchableOpacity
                    style={[styles.filterChip, filterStage === 'todas' && styles.filterChipActive]}
                    onPress={() => setFilterStage('todas')}
                  >
                    <Text style={[styles.filterChipText, filterStage === 'todas' && styles.filterChipTextActive]}>
                      Todas as Etapas
                    </Text>
                  </TouchableOpacity>
                  {KANBAN_STAGES.map((st) => (
                    <TouchableOpacity
                      key={st.key}
                      style={[styles.filterChip, filterStage === st.key && styles.filterChipActive]}
                      onPress={() => setFilterStage(st.key)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filterStage === st.key && styles.filterChipTextActive,
                        ]}
                      >
                        {st.shortLabel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* MODO MOBILE: Seletor de Colunas Kanban Compacto */}
          {!isWide && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileStageTabs}
            >
              {KANBAN_STAGES.map((stage) => {
                const count = (kanbanColumns[stage.key] || []).length;
                const isSelected = mobileActiveStageKey === stage.key;

                return (
                  <TouchableOpacity
                    key={stage.key}
                    style={[
                      styles.mobileStageTabBtn,
                      isSelected && { backgroundColor: stage.color, borderColor: stage.color },
                    ]}
                    onPress={() => setMobileActiveStageKey(stage.key)}
                  >
                    <Ionicons
                      name={stage.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : stage.color}
                    />
                    <Text
                      style={[
                        styles.mobileStageTabText,
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {stage.shortLabel} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* RENDERIZAÇÃO DO KANBAN BOARD */}
          {isWide ? (
            /* VISÃO WEB: Scroll horizontal com 7 swimlanes paralelas */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.kanbanBoardWeb}
            >
              {KANBAN_STAGES.map((stage) => {
                const stageApps = kanbanColumns[stage.key] || [];

                return (
                  <View key={stage.key} style={styles.kanbanColumn}>
                    {/* Header da Coluna */}
                    <View style={[styles.kanbanColHeader, { borderTopColor: stage.color }]}>
                      <View style={styles.kanbanColTitleRow}>
                        <View style={[styles.colBadgeDot, { backgroundColor: stage.color }]} />
                        <Text style={styles.kanbanColTitle}>{stage.label}</Text>
                        <View style={[styles.kanbanCountBadge, { backgroundColor: stage.bg }]}>
                          <Text style={[styles.kanbanCountText, { color: stage.color }]}>
                            {stageApps.length}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.kanbanColDesc}>{stage.description}</Text>
                    </View>

                    {/* Cards dos Candidatos da Coluna */}
                    <ScrollView
                      style={styles.kanbanColScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {stageApps.length === 0 ? (
                        <View style={styles.emptyColBox}>
                          <Ionicons name="folder-open-outline" size={24} color={Colors.placeholder} />
                          <Text style={styles.emptyColText}>Nenhum candidato nesta etapa</Text>
                        </View>
                      ) : (
                        stageApps.map((app) => renderCandidateCard(app, stage.key))
                      )}
                    </ScrollView>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            /* VISÃO MOBILE: Apresentação compacta da coluna selecionada */
            <View style={styles.mobileColumnContainer}>
              {(() => {
                const currentStage = KANBAN_STAGES.find((s) => s.key === mobileActiveStageKey) || KANBAN_STAGES[0];
                const stageApps = kanbanColumns[currentStage.key] || [];

                return (
                  <View>
                    <View style={[styles.mobileColBanner, { borderLeftColor: currentStage.color }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mobileColBannerTitle}>{currentStage.label}</Text>
                        <Text style={styles.mobileColBannerSub}>{currentStage.description}</Text>
                      </View>
                      <View style={[styles.kanbanCountBadge, { backgroundColor: currentStage.bg }]}>
                        <Text style={[styles.kanbanCountText, { color: currentStage.color }]}>
                          {stageApps.length} {stageApps.length === 1 ? 'candidato' : 'candidatos'}
                        </Text>
                      </View>
                    </View>

                    {stageApps.length === 0 ? (
                      <View style={styles.emptyColBoxMobile}>
                        <Ionicons name="people-outline" size={36} color={Colors.placeholder} />
                        <Text style={styles.emptyColTextMobile}>Nenhum candidato na etapa "{currentStage.label}"</Text>
                        <Text style={styles.emptyColSubMobile}>Altere os filtros acima ou mova candidatos de outras etapas.</Text>
                      </View>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {stageApps.map((app) => renderCandidateCard(app, currentStage.key))}
                      </View>
                    )}
                  </View>
                );
              })()}
            </View>
          )}
        </View>
      )}

      {/* ========================================================== */}
      {/* ABA 2: GESTÃO COMPLETA DE VAGAS */}
      {/* ========================================================== */}
      {activeTab === 'vagas' && (
        <View style={styles.tabContentBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Gestão de Oportunidades ({companyOpps.length})</Text>
              <Text style={styles.sectionSub}>
                Crie, edite, encerre ou reabra suas vagas. Acompanhe visualizações e inscritos reais.
              </Text>
            </View>
            <TouchableOpacity onPress={onNavigateToPublish} style={styles.addPrimaryBtn}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addPrimaryBtnText}>Criar Vaga</Text>
            </TouchableOpacity>
          </View>

          {companyOpps.length === 0 ? (
            <View style={styles.emptyOppsBox}>
              <Ionicons name="briefcase-outline" size={44} color={Colors.placeholder} />
              <Text style={styles.emptyOppsTitle}>Nenhuma vaga publicada ainda</Text>
              <Text style={styles.emptyOppsSub}>
                Cadastre vagas de estágio ou júnior para atrair talentos das 73 unidades FATEC de SP.
              </Text>
              <TouchableOpacity style={styles.emptyPublishBtn} onPress={onNavigateToPublish}>
                <Text style={styles.emptyPublishBtnText}>Publicar Primeira Vaga</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.oppsGrid}>
              {companyOpps.map((opp) => {
                const inscritos = opp.inscritosCount || 0;
                const views = opp.visualizacoes || 0;
                const isEncerrada = opp.status === 'encerrada';
                const isPausada = opp.status === 'pausada';

                const statusColor = isEncerrada ? '#DC2626' : isPausada ? '#D97706' : '#16A34A';
                const statusBg = isEncerrada ? '#FEF2F2' : isPausada ? '#FFFBEB' : '#F0FDF4';

                return (
                  <View key={opp.id} style={styles.oppCardPro}>
                    {/* Topo do Card de Vaga */}
                    <View style={styles.oppCardTop}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.oppBadgeStatusRow}>
                          <View style={[styles.statusBadgePill, { backgroundColor: statusBg }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                              {opp.status?.toUpperCase() || 'ATIVA'}
                            </Text>
                          </View>
                          <Text style={styles.oppAreaBadge}>{opp.area}</Text>
                        </View>
                        <Text style={styles.oppCargoPro}>{opp.cargo}</Text>
                        <Text style={styles.oppMetaLine}>
                          📍 {opp.localizacao} • {opp.modalidade} • 💰 {opp.bolsa}
                        </Text>
                      </View>
                    </View>

                    {/* Desempenho e Métricas da Vaga */}
                    <View style={styles.oppMetricsRow}>
                      <View style={styles.oppMetricItem}>
                        <Ionicons name="eye-outline" size={15} color="#2563EB" />
                        <Text style={styles.oppMetricVal}>{views}</Text>
                        <Text style={styles.oppMetricLabel}>Views</Text>
                      </View>
                      <View style={styles.oppMetricItem}>
                        <Ionicons name="people-outline" size={15} color="#7C3AED" />
                        <Text style={styles.oppMetricVal}>{inscritos}</Text>
                        <Text style={styles.oppMetricLabel}>Inscritos</Text>
                      </View>
                      <View style={styles.oppMetricItem}>
                        <Ionicons name="trophy-outline" size={15} color="#059669" />
                        <Text style={styles.oppMetricVal}>
                          {applications.filter((a) => a.vagaId === (opp.dbId || opp.id) && a.status === 'contratado').length}
                        </Text>
                        <Text style={styles.oppMetricLabel}>Contratados</Text>
                      </View>
                    </View>

                    {/* Botões de Ação na Vaga */}
                    <View style={styles.oppCardActions}>
                      <TouchableOpacity
                        style={styles.oppActionBtn}
                        onPress={() => {
                          setFilterVagaId(String(opp.id));
                          setActiveTab('kanban');
                        }}
                      >
                        <Ionicons name="layers-outline" size={15} color={Colors.primary} />
                        <Text style={styles.oppActionBtnText}>Ver no Kanban ({inscritos})</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.oppActionBtn}
                        onPress={() => handleOpenEdit(opp)}
                      >
                        <Ionicons name="create-outline" size={15} color="#475569" />
                        <Text style={[styles.oppActionBtnText, { color: '#475569' }]}>Editar</Text>
                      </TouchableOpacity>

                      {isEncerrada ? (
                        <TouchableOpacity
                          style={[styles.oppActionBtn, { borderColor: '#BBF7D0' }]}
                          onPress={() => handleReopenOpportunity(opp)}
                        >
                          <Ionicons name="play-outline" size={15} color="#16A34A" />
                          <Text style={[styles.oppActionBtnText, { color: '#16A34A' }]}>Reabrir</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.oppActionBtn, { borderColor: '#FED7AA' }]}
                          onPress={() => handleCloseOpportunity(opp)}
                        >
                          <Ionicons name="stop-outline" size={15} color="#D97706" />
                          <Text style={[styles.oppActionBtnText, { color: '#D97706' }]}>Encerrar</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.oppActionBtn, { borderColor: '#FECACA' }]}
                        onPress={() => handleDeleteOpportunity(opp)}
                      >
                        <Ionicons name="trash-outline" size={15} color="#DC2626" />
                        <Text style={[styles.oppActionBtnText, { color: '#DC2626' }]}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ========================================================== */}
      {/* ABA 3: FUNIL & DESEMPENHO ANALÍTICO */}
      {/* ========================================================== */}
      {activeTab === 'metricas' && (
        <View style={styles.tabContentBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Desempenho e Funil de Recrutamento</Text>
              <Text style={styles.sectionSub}>Taxa de conversão por etapa baseada nas candidaturas reais.</Text>
            </View>
          </View>

          {/* Gráfico do Funil de Conversão */}
          <View style={styles.funnelContainer}>
            {KANBAN_STAGES.map((stage) => {
              const count = (kanbanColumns[stage.key] || []).length;
              const total = applications.length;
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <View key={stage.key} style={styles.funnelRow}>
                  <View style={styles.funnelLabelCol}>
                    <Ionicons name={stage.icon} size={16} color={stage.color} />
                    <Text style={styles.funnelStageLabel}>{stage.label}</Text>
                  </View>

                  <View style={styles.funnelTrack}>
                    <View
                      style={[
                        styles.funnelFill,
                        {
                          backgroundColor: stage.color,
                          width: `${Math.max(percent, count > 0 ? 6 : 0)}%`,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.funnelCountCol}>
                    <Text style={styles.funnelCountVal}>{count}</Text>
                    <Text style={styles.funnelCountPct}>({percent}%)</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Resumo Estatístico em Box */}
          <View style={styles.statsSummaryBox}>
            <View style={styles.statsSummaryHeader}>
              <Ionicons name="stats-chart" size={18} color={Colors.primary} />
              <Text style={styles.statsSummaryTitle}>Eficiência Geral do Processo</Text>
            </View>

            <View style={styles.statsSummaryGrid}>
              <View style={styles.statsSummaryItem}>
                <Text style={styles.statsSummaryValue}>{dashboardData?.taxaConversao || 0}%</Text>
                <Text style={styles.statsSummaryLabel}>Taxa de Contratação</Text>
                <Text style={styles.statsSummarySub}>Candidatos que viraram contratação</Text>
              </View>

              <View style={styles.statsSummaryItem}>
                <Text style={styles.statsSummaryValue}>
                  {companyOpps.length > 0 ? (applications.length / companyOpps.length).toFixed(1) : 0}
                </Text>
                <Text style={styles.statsSummaryLabel}>Média por Vaga</Text>
                <Text style={styles.statsSummarySub}>Inscritos por oportunidade ativa</Text>
              </View>

              <View style={styles.statsSummaryItem}>
                <Text style={styles.statsSummaryValue}>{dashboardData?.totalVisualizacoes || 0}</Text>
                <Text style={styles.statsSummaryLabel}>Visualizações Totais</Text>
                <Text style={styles.statsSummarySub}>Alcance na comunidade estudantil</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================== */}
      {/* MODAL 1: HISTÓRICO COMPLETO DA CANDIDATURA (AUDITORIA REAL) */}
      {/* ========================================================== */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Histórico da Candidatura</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {activeAppForHistory?.candidato?.nome || 'Estudante'} • {activeAppForHistory?.vaga?.cargo || 'Vaga'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              {loadingHistory ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={{ marginTop: 10, fontSize: 13, color: Colors.textSecondary }}>
                    Carregando histórico auditado...
                  </Text>
                </View>
              ) : candidateHistory.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Ionicons name="time-outline" size={36} color={Colors.placeholder} />
                  <Text style={{ marginTop: 8, fontSize: 14, color: Colors.textSecondary, fontWeight: '600' }}>
                    Nenhum registro de alteração anterior.
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.placeholder, textAlign: 'center', marginTop: 4 }}>
                    Apenas a submissão inicial pelo estudante está registrada.
                  </Text>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {candidateHistory.map((item, idx) => (
                    <View key={item.id || idx} style={styles.timelineItem}>
                      <View style={styles.timelineLeftCol}>
                        <View style={styles.timelineDot} />
                        {idx < candidateHistory.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContentBox}>
                        <View style={styles.timelineTitleRow}>
                          <Text style={styles.timelineNewStatus}>
                            Etapa: {item.statusNovo.toUpperCase()}
                          </Text>
                          <Text style={styles.timelineDate}>
                            {new Date(item.criadoEm).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        {item.statusAnterior && (
                          <Text style={styles.timelinePrevStatus}>
                            Anterior: {item.statusAnterior.toUpperCase()}
                          </Text>
                        )}
                        {item.motivo && <Text style={styles.timelineMotivo}>"{item.motivo}"</Text>}
                        {item.alteradoPorNome && (
                          <Text style={styles.timelineUser}>Registrado por: {item.alteradoPorNome}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 2: SELETOR DE ETAPA DO PIPELINE */}
      {/* ========================================================== */}
      <Modal
        visible={moveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.moveModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Mover Candidato no Funil</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {appToMove?.candidato?.nome || 'Estudante'} • {appToMove?.vaga?.cargo || 'Vaga'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMoveModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 12 }}>
                Selecione a nova etapa para atualizar o processo seletivo do estudante:
              </Text>

              <View style={{ gap: 10 }}>
                {KANBAN_STAGES.map((stage) => {
                  const isCurrent = stage.statuses.includes(appToMove?.status as any);

                  return (
                    <TouchableOpacity
                      key={stage.key}
                      style={[
                        styles.stageChoiceBtn,
                        isCurrent && { borderColor: stage.color, backgroundColor: stage.bg },
                      ]}
                      disabled={isCurrent || movingStage}
                      onPress={() => {
                        if (appToMove) {
                          const targetStatus = stage.statuses[0];
                          handleMoveCandidate(appToMove.id, targetStatus);
                        }
                      }}
                    >
                      <View style={[styles.kpiIconCircle, { backgroundColor: stage.bg, width: 36, height: 36 }]}>
                        <Ionicons name={stage.icon} size={18} color={stage.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.stageChoiceTitle, { color: stage.color }]}>
                          {stage.label} {isCurrent && '(Etapa Atual)'}
                        </Text>
                        <Text style={styles.stageChoiceSub}>{stage.description}</Text>
                      </View>
                      {isCurrent ? (
                        <Ionicons name="checkmark-circle" size={20} color={stage.color} />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={Colors.placeholder} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 3: EDIÇÃO DE VAGA */}
      {/* ========================================================== */}
      <Modal
        visible={!!editingOpp}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingOpp(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>Editar Oportunidade</Text>
                <Text style={styles.modalHeaderSub}>Atualize requisitos, bolsa e status no PostgreSQL.</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOpp(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Título / Cargo *</Text>
              <TextInput
                style={styles.modalInput}
                value={editCargo}
                onChangeText={setEditCargo}
                placeholder="Ex: Estagiário de Desenvolvimento Full-Stack"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.inputLabel}>Bolsa-Auxílio / Remuneração *</Text>
              <TextInput
                style={styles.modalInput}
                value={editBolsa}
                onChangeText={setEditBolsa}
                placeholder="Ex: R$ 2.200,00"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.inputLabel}>Modalidade de Trabalho</Text>
              <View style={styles.modalityRow}>
                {(['Híbrido', 'Remoto', 'Presencial'] as const).map((mod) => (
                  <TouchableOpacity
                    key={mod}
                    style={[styles.modalityOption, editModalidade === mod && styles.modalityOptionActive]}
                    onPress={() => setEditModalidade(mod)}
                  >
                    <Text style={[styles.modalityText, editModalidade === mod && styles.modalityTextActive]}>
                      {mod}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Status da Oportunidade</Text>
              <View style={styles.modalityRow}>
                {(['ativa', 'pausada', 'encerrada'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.modalityOption, editStatus === st && styles.modalityOptionActive]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[styles.modalityText, editStatus === st && styles.modalityTextActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Localização</Text>
              <TextInput
                style={styles.modalInput}
                value={editLocal}
                onChangeText={setEditLocal}
                placeholder="Ex: São Paulo - SP ou Jales - SP"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.inputLabel}>Descrição das Atividades *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Descreva as responsabilidades, projetos e aprendizado..."
                placeholderTextColor={Colors.placeholder}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Requisitos Técnicos (separados por vírgula)</Text>
              <TextInput
                style={styles.modalInput}
                value={editReqs}
                onChangeText={setEditReqs}
                placeholder="Ex: React Native, TypeScript, Node.js, PostgreSQL"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.inputLabel}>Benefícios Oferecidos</Text>
              <TextInput
                style={styles.modalInput}
                value={editBeneficios}
                onChangeText={setEditBeneficios}
                placeholder="Ex: Vale Transporte, Vale Refeição, Seguro de Vida"
                placeholderTextColor={Colors.placeholder}
              />

              <TouchableOpacity
                style={[styles.saveBtn, savingEdit && { opacity: 0.7 }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Salvar Alterações</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 4: PERFIL COMPLETO DO CANDIDATO (MODALDETAILS) */}
      {/* ========================================================== */}
      <ModalDetails
        visible={isDetailsVisible}
        onClose={() => setIsDetailsVisible(false)}
        candidate={selectedCandidate}
        actionLabel="Iniciar Conversa"
        onAction={() => {
          setIsDetailsVisible(false);
          if (selectedCandidate && onStartChat) {
            onStartChat(
              selectedCandidate.nome,
              selectedCandidate.curso,
              selectedCandidate.usuarioId || selectedCandidate.dbId
            );
          }
        }}
      />
    </ScrollView>
  );

  // ==========================================================
  // HELPER: RENDERIZAR CARD PROFISSIONAL DE CANDIDATO NO KANBAN
  // ==========================================================
  function renderCandidateCard(app: Application, stageKey: string) {
    const cand = app.candidato;
    const vagaTitle = app.vaga?.cargo || 'Oportunidade';
    const matchScore = app.matchScoreMomento || cand?.matchScore || 85;

    // Achar índice da etapa atual para botões de avançar/voltar rápido
    const stageIdx = KANBAN_STAGES.findIndex((s) => s.key === stageKey);
    const prevStage = stageIdx > 0 ? KANBAN_STAGES[stageIdx - 1] : null;
    const nextStage = stageIdx < KANBAN_STAGES.length - 1 ? KANBAN_STAGES[stageIdx + 1] : null;

    const matchColor = matchScore >= 80 ? '#16A34A' : matchScore >= 60 ? '#D97706' : '#DC2626';

    return (
      <View key={app.id} style={styles.candidateCard}>
        {/* Topo: Avatar, Nome, Curso, e Score de Match */}
        <View style={styles.cardHeaderRow}>
          <Image
            source={{
              uri:
                cand?.imagemUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
            }}
            style={styles.candAvatar}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.candNameRow}>
              <Text style={styles.candName} numberOfLines={1}>
                {cand?.nome || app.alunoNome || 'Estudante FATEC'}
              </Text>
              <View style={[styles.matchScoreBadge, { borderColor: matchColor }]}>
                <Ionicons name="sparkles" size={11} color={matchColor} />
                <Text style={[styles.matchScoreText, { color: matchColor }]}>{matchScore}%</Text>
              </View>
            </View>
            <Text style={styles.candCourse} numberOfLines={1}>
              {cand?.curso || 'Tecnologia'} • {cand?.semestre || 'Semestre'}
            </Text>
            <Text style={styles.candFatec} numberOfLines={1}>
              📍 {cand?.unidadeFatec || 'Fatec'}
            </Text>
          </View>
        </View>

        {/* Vaga Aplicada Badge */}
        <View style={styles.cardVagaPill}>
          <Ionicons name="briefcase-outline" size={13} color={Colors.primary} />
          <Text style={styles.cardVagaText} numberOfLines={1}>
            Vaga: {vagaTitle}
          </Text>
        </View>

        {/* Competências em Destaque */}
        {cand?.competencias && cand.competencias.length > 0 && (
          <View style={styles.cardSkillsRow}>
            {cand.competencias.slice(0, 3).map((skill, idx) => (
              <View key={idx} style={styles.cardSkillBadge}>
                <Text style={styles.cardSkillText}>{skill}</Text>
              </View>
            ))}
            {cand.competencias.length > 3 && (
              <Text style={styles.cardSkillMore}>+{cand.competencias.length - 3}</Text>
            )}
          </View>
        )}

        {/* Mensagem de Apresentação (se houver) */}
        {app.mensagemApresentacao ? (
          <Text style={styles.cardMsgSnippet} numberOfLines={2}>
            "{app.mensagemApresentacao}"
          </Text>
        ) : null}

        {/* Data de Aplicação */}
        <Text style={styles.cardDateText}>
          Inscrito em: {new Date(app.criadoEm).toLocaleDateString('pt-BR')}
        </Text>

        {/* Ações do Card */}
        <View style={styles.cardActionsRow}>
          {/* Botão Ver Perfil Completo */}
          <TouchableOpacity
            style={styles.cardMiniActionBtn}
            onPress={() => handleOpenCandidateProfile(cand)}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={14} color={Colors.primary} />
            <Text style={styles.cardMiniActionText}>Perfil</Text>
          </TouchableOpacity>

          {/* Botão Histórico */}
          <TouchableOpacity
            style={styles.cardMiniActionBtn}
            onPress={() => handleOpenHistory(app)}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={14} color="#6366F1" />
            <Text style={[styles.cardMiniActionText, { color: '#6366F1' }]}>Histórico</Text>
          </TouchableOpacity>

          {/* Botão Chat */}
          {onStartChat && (
            <TouchableOpacity
              style={styles.cardMiniActionBtn}
              onPress={() =>
                onStartChat(
                  cand?.nome || 'Estudante',
                  cand?.curso || 'Aluno FATEC',
                  cand?.usuarioId || app.alunoId,
                  app.vagaId
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color="#059669" />
              <Text style={[styles.cardMiniActionText, { color: '#059669' }]}>Chat</Text>
            </TouchableOpacity>
          )}

          {/* Botão Mover Etapa */}
          <TouchableOpacity
            style={[styles.cardMiniActionBtn, { backgroundColor: Colors.primaryLight }]}
            onPress={() => {
              setAppToMove(app);
              setMoveModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={14} color={Colors.primaryDark} />
            <Text style={[styles.cardMiniActionText, { color: Colors.primaryDark, fontWeight: '700' }]}>
              Mover
            </Text>
          </TouchableOpacity>
        </View>

        {/* Atalhos Rápidos para Avançar ou Voltar Etapa */}
        <View style={styles.cardQuickNavRow}>
          {prevStage ? (
            <TouchableOpacity
              style={styles.quickNavBtn}
              onPress={() => handleMoveCandidate(app.id, prevStage.statuses[0])}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={13} color={Colors.textSecondary} />
              <Text style={styles.quickNavText} numberOfLines={1}>
                {prevStage.shortLabel}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {nextStage && (
            <TouchableOpacity
              style={[styles.quickNavBtn, styles.quickNavBtnNext]}
              onPress={() => handleMoveCandidate(app.id, nextStage.statuses[0])}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickNavText, styles.quickNavTextNext]} numberOfLines={1}>
                {nextStage.shortLabel}
              </Text>
              <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // 1. Cabeçalho
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeTopRow: {
    marginBottom: 4,
  },
  badgeTop: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  publishVagaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  publishVagaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // 2. Indicadores Reais (KPIs)
  kpiContainer: {
    marginBottom: 20,
  },
  kpiSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiScrollContent: {
    gap: 10,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // 3. Navegação entre Abas
  tabNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tabNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabNavBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabNavTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  tabContentBlock: {
    width: '100%',
  },

  // Filtros Integrados
  filterSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '700',
  },
  filterFieldsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  searchFieldBox: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  filterSelectorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },

  // Mobile: Seletor de Colunas
  mobileStageTabs: {
    gap: 8,
    paddingBottom: 12,
  },
  mobileStageTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mobileStageTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  mobileColumnContainer: {
    marginTop: 6,
  },
  mobileColBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileColBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  mobileColBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyColBoxMobile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyColTextMobile: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptyColSubMobile: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  // Web: Kanban Board com 7 Swimlanes
  kanbanBoardWeb: {
    gap: 14,
    paddingBottom: 16,
  },
  kanbanColumn: {
    width: 310,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    maxHeight: 700,
  },
  kanbanColHeader: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  kanbanColTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kanbanColTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  kanbanCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  kanbanCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  kanbanColDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  kanbanColScroll: {
    padding: 10,
  },
  emptyColBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyColText: {
    fontSize: 12,
    color: Colors.placeholder,
    marginTop: 6,
    textAlign: 'center',
  },

  // Card do Candidato no Kanban
  candidateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  candAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  candNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  candName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  matchScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: '800',
  },
  candCourse: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  candFatec: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cardVagaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  cardVagaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    flex: 1,
  },
  cardSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  cardSkillBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardSkillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  cardSkillMore: {
    fontSize: 10,
    color: Colors.placeholder,
    alignSelf: 'center',
  },
  cardMsgSnippet: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
    lineHeight: 15,
  },
  cardDateText: {
    fontSize: 10,
    color: Colors.placeholder,
    marginBottom: 10,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  cardMiniActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardMiniActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardQuickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  quickNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    maxWidth: '48%',
  },
  quickNavBtnNext: {
    backgroundColor: Colors.primary,
  },
  quickNavText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  quickNavTextNext: {
    color: '#FFFFFF',
  },

  // 4. Gestão de Vagas
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyOppsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyOppsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptyOppsSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 19,
    maxWidth: 400,
  },
  emptyPublishBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyPublishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  oppsGrid: {
    gap: 14,
  },
  oppCardPro: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  oppCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  oppBadgeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  oppAreaBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  oppCargoPro: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  oppMetaLine: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  oppMetricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-around',
  },
  oppMetricItem: {
    alignItems: 'center',
    gap: 2,
  },
  oppMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  oppMetricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  oppCardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  oppActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  oppActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // 5. Funil & Métricas Analíticas
  funnelContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  funnelLabelCol: {
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  funnelStageLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  funnelTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  funnelFill: {
    height: '100%',
    borderRadius: 6,
  },
  funnelCountCol: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  funnelCountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  funnelCountPct: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  statsSummaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statsSummaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  statsSummaryItem: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsSummaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  statsSummaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  statsSummarySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Modais Comuns
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalHeaderSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },

  // Modal Histórico
  historyModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeftCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 4,
  },
  timelineContentBox: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineNewStatus: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  timelineDate: {
    fontSize: 11,
    color: Colors.placeholder,
  },
  timelinePrevStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timelineMotivo: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  timelineUser: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Modal Mover Etapa
  moveModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  stageChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  stageChoiceTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  stageChoiceSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Modal Edição de Vaga
  editModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  modalityOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modalityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalityTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 10,
    marginTop: 24,
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
