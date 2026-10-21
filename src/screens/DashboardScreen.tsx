import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { RecruiterDashboardData, Opportunity, Application, ApplicationStatus } from '../types';
import { api } from '../services/api';

interface DashboardScreenProps {
  empresaId?: number;
  onNavigateToApplications: () => void;
  onNavigateToPublish: () => void;
  onStartChat?: (name: string, roleInfo: string) => void;
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  enviada: { label: 'Enviadas', color: '#2563EB' },
  em_analise: { label: 'Em Análise', color: '#D97706' },
  entrevista: { label: 'Entrevistas', color: '#7C3AED' },
  proposta: { label: 'Propostas', color: '#059669' },
  contratado: { label: 'Contratados', color: '#16A34A' },
  recusada: { label: 'Recusadas', color: '#DC2626' },
};

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  enviada: { label: 'Enviada', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.10)', icon: 'paper-plane-outline' },
  em_analise: { label: 'Em Análise', color: '#D97706', bg: 'rgba(217, 119, 6, 0.10)', icon: 'search-outline' },
  entrevista: { label: 'Entrevista', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.10)', icon: 'calendar-outline' },
  proposta: { label: 'Proposta', color: '#059669', bg: 'rgba(5, 150, 105, 0.10)', icon: 'gift-outline' },
  contratado: { label: 'Contratado!', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.15)', icon: 'trophy-outline' },
  recusada: { label: 'Recusada', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.10)', icon: 'close-circle-outline' },
  desistente: { label: 'Desistente', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.10)', icon: 'remove-circle-outline' },
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  empresaId,
  onNavigateToApplications,
  onNavigateToPublish,
  onStartChat,
}) => {
  const [data, setData] = useState<RecruiterDashboardData | null>(null);
  const [companyOpps, setCompanyOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estado para Edição de Vaga
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

  // Estado para Visualização de Candidatos Inscritos na Vaga
  const [viewingOpp, setViewingOpp] = useState<Opportunity | null>(null);
  const [oppCandidates, setOppCandidates] = useState<Application[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const loadDashboard = async () => {
    if (!empresaId) return;
    try {
      const [dashRes, oppsRes] = await Promise.all([
        api.getRecruiterDashboard(empresaId),
        api.getCompanyOpportunities(empresaId),
      ]);
      setData(dashRes);
      setCompanyOpps(oppsRes);
    } catch (e) {
      console.warn('Erro ao carregar dashboard da empresa:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [empresaId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // Abrir Modal de Edição com dados da vaga selecionada
  const handleOpenEdit = (opp: Opportunity) => {
    setEditingOpp(opp);
    setEditCargo(opp.cargo);
    setEditBolsa(opp.bolsa);
    setEditModalidade(opp.modalidade || 'Híbrido');
    setEditLocal(opp.localizacao);
    setEditDesc(opp.descricao);
    setEditReqs(opp.requisitos ? opp.requisitos.join(', ') : '');
    setEditBeneficios(opp.beneficios ? opp.beneficios.join(', ') : '');
    setEditStatus(opp.status || 'ativa');
    setEditImagemUrl(opp.imagemUrl || '');
  };

  // Salvar Edição de Vaga no PostgreSQL
  const handleSaveEdit = async () => {
    if (!editingOpp) return;
    if (!editCargo.trim() || !editBolsa.trim() || !editDesc.trim()) {
      const msg = 'Por favor, preencha o cargo, a bolsa e a descrição da vaga.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Campos Obrigatórios', msg);
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
        const msg = `Vaga "${updated.cargo}" atualizada com sucesso no banco de dados!`;
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sucesso! 🚀', msg);
      } else {
        const err = 'Não foi possível salvar as alterações da vaga.';
        Platform.OS === 'web' ? window.alert(err) : Alert.alert('Erro', err);
      }
    } catch (e: any) {
      console.warn('Erro ao atualizar vaga:', e);
      const err = e.message || 'Erro inesperado ao salvar vaga.';
      Platform.OS === 'web' ? window.alert(err) : Alert.alert('Erro', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Abrir Visualização de Candidatos da Vaga
  const handleViewApplicants = async (opp: Opportunity) => {
    setViewingOpp(opp);
    setLoadingCandidates(true);
    try {
      const cands = await api.getOpportunityCandidates(opp.id);
      setOppCandidates(cands);
    } catch (e) {
      console.warn('Erro ao buscar inscritos:', e);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Mover etapa do candidato
  const handleMoveCandidateStage = async (appId: number, newStage: ApplicationStatus) => {
    try {
      const ok = await api.updateApplicationStatus(appId, newStage, 'Atualização pelo painel da vaga', empresaId);
      if (ok) {
        setOppCandidates((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStage } : a))
        );
        loadDashboard();
      }
    } catch (e) {
      console.warn('Erro ao mover etapa:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando métricas reais de recrutamento...</Text>
      </View>
    );
  }

  const etapas = data?.candidatosPorEtapa || {
    enviada: 0,
    em_analise: 0,
    entrevista: 0,
    proposta: 0,
    contratado: 0,
    recusada: 0,
    desistente: 0,
  };

  const total = data?.totalCandidaturas || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
      {/* Header do Painel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badgeTop}>PAINEL CORPORATIVO REGIONAL FATEC</Text>
          <Text style={styles.title}>Dashboard de Recrutamento</Text>
          <Text style={styles.subtitle}>
            Acompanhe o funil de contratação, inscritos e gerencie suas vagas ativas.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.publishVagaBtn}
          onPress={onNavigateToPublish}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.publishVagaBtnText}>Nova Vaga</Text>
        </TouchableOpacity>
      </View>

      {/* Grid de Cards de Métricas Principais */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
            <Ionicons name="briefcase" size={20} color="#2563EB" />
          </View>
          <Text style={styles.metricVal}>{companyOpps.length || data?.vagasAtivasCount || 0}</Text>
          <Text style={styles.metricLab}>Minhas Vagas</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(124, 58, 237, 0.12)' }]}>
            <Ionicons name="people" size={20} color="#7C3AED" />
          </View>
          <Text style={styles.metricVal}>{data?.totalCandidaturas || 0}</Text>
          <Text style={styles.metricLab}>Candidaturas</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
            <Ionicons name="eye" size={20} color="#059669" />
          </View>
          <Text style={styles.metricVal}>{data?.totalVisualizacoes || 0}</Text>
          <Text style={styles.metricLab}>Visualizações</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
            <Ionicons name="trending-up" size={20} color="#D97706" />
          </View>
          <Text style={styles.metricVal}>{data?.taxaConversao || 0}%</Text>
          <Text style={styles.metricLab}>Conversão</Text>
        </View>
      </View>

      {/* ========================================================== */}
      {/* SEÇÃO PRINCIPAL: MINHAS VAGAS PUBLICADAS (EDIÇÃO & INSCRITOS) */}
      {/* ========================================================== */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Minhas Vagas Publicadas</Text>
            <Text style={styles.sectionSub}>Edite requisitos, remuneração e veja candidatos inscritos.</Text>
          </View>
          <TouchableOpacity onPress={onNavigateToPublish} style={styles.addMiniBtn}>
            <Ionicons name="add-circle" size={20} color={Colors.primary} />
            <Text style={styles.addMiniText}>Publicar</Text>
          </TouchableOpacity>
        </View>

        {companyOpps.length === 0 ? (
          <View style={styles.emptyOppsBox}>
            <Ionicons name="briefcase-outline" size={36} color={Colors.placeholder} />
            <Text style={styles.emptyOppsTitle}>Nenhuma vaga cadastrada ainda</Text>
            <Text style={styles.emptyOppsSub}>Publique oportunidades de estágio para talentos da FATEC.</Text>
            <TouchableOpacity style={styles.emptyPublishBtn} onPress={onNavigateToPublish}>
              <Text style={styles.emptyPublishBtnText}>Criar Primeira Vaga</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.oppsList}>
            {companyOpps.map((opp) => {
              const inscritos = opp.inscritosCount || 0;
              const statusColor =
                opp.status === 'pausada' ? '#D97706' : opp.status === 'encerrada' ? '#DC2626' : '#16A34A';

              return (
                <View key={opp.id} style={styles.oppItemCard}>
                  {/* Linha Superior: Cargo, Status & Bolsa */}
                  <View style={styles.oppHeaderRow}>
                    <View style={styles.oppTitleBlock}>
                      <View style={styles.oppStatusRow}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {opp.status?.toUpperCase() || 'ATIVA'}
                        </Text>
                        <Text style={styles.oppAreaText}>• {opp.area}</Text>
                      </View>
                      <Text style={styles.oppCargo} numberOfLines={1}>{opp.cargo}</Text>
                      <Text style={styles.oppMeta}>
                        📍 {opp.localizacao} • {opp.modalidade} • 💰 {opp.bolsa}
                      </Text>
                    </View>
                  </View>

                  {/* Contador de Inscritos em Destaque */}
                  <View style={styles.inscritosHighlightRow}>
                    <View style={styles.inscritosPill}>
                      <Ionicons name="people" size={16} color={Colors.primary} />
                      <Text style={styles.inscritosPillText}>
                        {inscritos} {inscritos === 1 ? 'estudante inscrito' : 'estudantes inscritos'}
                      </Text>
                    </View>
                  </View>

                  {/* Botões de Ação: Editar Vaga e Ver Inscritos */}
                  <View style={styles.oppActionsRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleOpenEdit(opp)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={16} color={Colors.primary} />
                      <Text style={styles.editBtnText}>Editar Vaga</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.viewApplicantsBtn, inscritos === 0 && styles.viewApplicantsBtnDisabled]}
                      onPress={() => handleViewApplicants(opp)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="list" size={16} color="#FFFFFF" />
                      <Text style={styles.viewApplicantsBtnText}>
                        Ver Inscritos ({inscritos})
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Funil de Contratação por Etapas (Gráfico de Barras Relativas) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Funil de Candidatos por Etapa</Text>
          <TouchableOpacity onPress={onNavigateToApplications}>
            <Text style={styles.sectionActionText}>Gerenciar Todos ➔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.funnelBars}>
          {Object.entries(STAGE_LABELS).map(([key, info]) => {
            const count = (etapas as any)[key] || 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <View key={key} style={styles.barItem}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>{info.label}</Text>
                  <Text style={styles.barCount}>
                    {count} ({percentage}%)
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: info.color,
                        width: `${Math.max(percentage, count > 0 ? 5 : 0)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* ========================================================== */}
      {/* MODAL 1: EDITAR VAGA (PUT /api/opportunities/:id) */}
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
              <View style={styles.modalHeaderTitleBlock}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>Editar Vaga</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>Atualize as informações persistidas no banco de dados.</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOpp(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* Título do Cargo */}
              <Text style={styles.inputLabel}>Título / Cargo da Vaga *</Text>
              <TextInput
                style={styles.modalInput}
                value={editCargo}
                onChangeText={setEditCargo}
                placeholder="Ex: Estagiário de Desenvolvimento Backend"
                placeholderTextColor={Colors.placeholder}
              />

              {/* Remuneração / Bolsa */}
              <Text style={styles.inputLabel}>Bolsa-Auxílio / Remuneração *</Text>
              <TextInput
                style={styles.modalInput}
                value={editBolsa}
                onChangeText={setEditBolsa}
                placeholder="Ex: R$ 2.100,00"
                placeholderTextColor={Colors.placeholder}
              />

              {/* Modalidade */}
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

              {/* Status da Vaga */}
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

              {/* Localização */}
              <Text style={styles.inputLabel}>Localização</Text>
              <TextInput
                style={styles.modalInput}
                value={editLocal}
                onChangeText={setEditLocal}
                placeholder="Ex: Jales - SP"
                placeholderTextColor={Colors.placeholder}
              />

              {/* Descrição */}
              <Text style={styles.inputLabel}>Descrição das Atividades *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Descreva as responsabilidades e aprendizados..."
                placeholderTextColor={Colors.placeholder}
                multiline
                numberOfLines={4}
              />

              {/* Requisitos */}
              <Text style={styles.inputLabel}>Requisitos (separados por vírgula)</Text>
              <TextInput
                style={styles.modalInput}
                value={editReqs}
                onChangeText={setEditReqs}
                placeholder="Ex: Cursando ADS na Fatec Jales, Node.js, SQL"
                placeholderTextColor={Colors.placeholder}
              />

              {/* Benefícios */}
              <Text style={styles.inputLabel}>Benefícios (separados por vírgula)</Text>
              <TextInput
                style={styles.modalInput}
                value={editBeneficios}
                onChangeText={setEditBeneficios}
                placeholder="Ex: Vale Refeição R$ 650, Vale Transporte, Seguro de Vida"
                placeholderTextColor={Colors.placeholder}
              />

              {/* Imagem de Fundo / Capa */}
              <Text style={styles.inputLabel}>URL da Imagem de Destaque da Vaga</Text>
              <TextInput
                style={styles.modalInput}
                value={editImagemUrl}
                onChangeText={setEditImagemUrl}
                placeholder="https://exemplo.com/foto-empresa.jpg"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="none"
              />

              {/* Ações do Modal */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditingOpp(null)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Salvar Alterações</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 2: CANDIDATOS INSCRITOS NA VAGA */}
      {/* ========================================================== */}
      <Modal
        visible={!!viewingOpp}
        transparent
        animationType="slide"
        onRequestClose={() => setViewingOpp(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.applicantsModalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBlock}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  Inscritos: {viewingOpp?.cargo}
                </Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {oppCandidates.length} {oppCandidates.length === 1 ? 'estudante candidatado' : 'estudantes candidatados'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setViewingOpp(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingCandidates ? (
              <View style={styles.loadingCandidatesBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingCandidatesText}>Carregando inscritos...</Text>
              </View>
            ) : oppCandidates.length === 0 ? (
              <View style={styles.emptyApplicantsBox}>
                <Ionicons name="people-outline" size={44} color={Colors.placeholder} />
                <Text style={styles.emptyApplicantsTitle}>Nenhum candidato inscrito ainda</Text>
                <Text style={styles.emptyApplicantsSub}>
                  Assim que os alunos da FATEC visualizarem e se candidatarem, eles aparecerão ordenados por afinidade aqui.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.applicantsListScroll}
              >
                {oppCandidates.map((app) => {
                  const stageConf = STAGE_CONFIG[app.status] || STAGE_CONFIG.enviada;

                  return (
                    <View key={app.id} style={styles.applicantCard}>
                      {/* Top Row: Avatar, Informações e Badge de Match */}
                      <View style={styles.applicantTopRow}>
                        <Image
                          source={{ uri: app.candidato?.imagemUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }}
                          style={styles.applicantAvatar}
                        />
                        <View style={styles.applicantInfo}>
                          <Text style={styles.applicantName} numberOfLines={1}>{app.candidato?.nome}</Text>
                          <Text style={styles.applicantCourse} numberOfLines={1}>
                            {app.candidato?.curso} • {app.candidato?.semestre}
                          </Text>
                          <Text style={styles.applicantFatec} numberOfLines={1}>🏫 {app.candidato?.unidadeFatec}</Text>
                        </View>
                        <View style={styles.matchScoreBadge}>
                          <Text style={styles.matchScoreVal}>{app.matchScoreMomento}%</Text>
                          <Text style={styles.matchScoreLab}>Match</Text>
                        </View>
                      </View>

                      {/* Diagnóstico de Match / Justificativas */}
                      {app.matchJustificativas && app.matchJustificativas.length > 0 && (
                        <View style={styles.appJustificativasBox}>
                          <View style={styles.appJustificativasHeader}>
                            <Ionicons name="sparkles" size={13} color={Colors.primary} />
                            <Text style={styles.appJustificativasTitle}>Diagnóstico de Afinidade FATEC:</Text>
                          </View>
                          {app.matchJustificativas.map((just, idx) => (
                            <View key={idx} style={styles.appJustificativaItem}>
                              <Ionicons name="checkmark-circle" size={13} color="#10B981" style={{ marginTop: 2 }} />
                              <Text style={styles.appJustificativaText}>{just}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Apresentação do Estudante */}
                      {app.mensagemApresentacao && (
                        <View style={styles.appMessageBox}>
                          <Text style={styles.appMessageLabel}>Apresentação do Aluno:</Text>
                          <Text style={styles.appMessageText}>{app.mensagemApresentacao}</Text>
                        </View>
                      )}

                      {/* Tags de Competências */}
                      {app.candidato?.competencias && app.candidato.competencias.length > 0 && (
                        <View style={styles.appCompetenciasRow}>
                          {app.candidato.competencias.slice(0, 6).map((comp, idx) => (
                            <View key={idx} style={styles.compPill}>
                              <Text style={styles.compPillText}>{comp}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Links Profissionais */}
                      {(app.candidato?.github || app.candidato?.linkedin) && (
                        <View style={styles.appLinksRow}>
                          {app.candidato.github && (
                            <View style={styles.appLinkItem}>
                              <Ionicons name="logo-github" size={13} color={Colors.textPrimary} />
                              <Text style={styles.appLinkText} numberOfLines={1}>{app.candidato.github}</Text>
                            </View>
                          )}
                          {app.candidato.linkedin && (
                            <View style={styles.appLinkItem}>
                              <Ionicons name="logo-linkedin" size={13} color="#0A66C2" />
                              <Text style={styles.appLinkText} numberOfLines={1}>{app.candidato.linkedin}</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Gestão do Candidato & Transição de Etapa */}
                      <View style={styles.appManagementSection}>
                        {/* Linha 1: Status Atual e Conversar */}
                        <View style={styles.appStatusAndContactRow}>
                          <View style={[styles.currentStagePill, { backgroundColor: stageConf.bg }]}>
                            <Ionicons
                              name={stageConf.icon as any}
                              size={13}
                              color={stageConf.color}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.currentStageText, { color: stageConf.color }]}>
                              Etapa: {stageConf.label}
                            </Text>
                          </View>

                          {onStartChat && (
                            <TouchableOpacity
                              style={styles.chatCandidateBtn}
                              onPress={() => {
                                setViewingOpp(null);
                                onStartChat(app.candidato?.nome || 'Estudante', viewingOpp?.cargo || 'Vaga');
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="chatbubbles" size={14} color="#FFFFFF" />
                              <Text style={styles.chatCandidateBtnText}>Conversar</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Linha 2: Mover Etapa */}
                        <View style={styles.stageTransitionsBox}>
                          <Text style={styles.stageTransitionsTitle}>Mudar Etapa do Processo:</Text>
                          <View style={styles.stageButtonsWrap}>
                            {app.status !== 'em_analise' && (
                              <TouchableOpacity
                                style={[styles.stageActionChip, { borderColor: '#D97706' }]}
                                onPress={() => handleMoveCandidateStage(app.id, 'em_analise')}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="search-outline" size={12} color="#D97706" />
                                <Text style={[styles.stageActionChipText, { color: '#D97706' }]}>Em Análise</Text>
                              </TouchableOpacity>
                            )}

                            {app.status !== 'entrevista' && (
                              <TouchableOpacity
                                style={[styles.stageActionChip, { borderColor: '#7C3AED' }]}
                                onPress={() => handleMoveCandidateStage(app.id, 'entrevista')}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="calendar-outline" size={12} color="#7C3AED" />
                                <Text style={[styles.stageActionChipText, { color: '#7C3AED' }]}>Entrevista</Text>
                              </TouchableOpacity>
                            )}

                            {app.status !== 'proposta' && (
                              <TouchableOpacity
                                style={[styles.stageActionChip, { borderColor: '#059669' }]}
                                onPress={() => handleMoveCandidateStage(app.id, 'proposta')}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="gift-outline" size={12} color="#059669" />
                                <Text style={[styles.stageActionChipText, { color: '#059669' }]}>Proposta</Text>
                              </TouchableOpacity>
                            )}

                            {app.status !== 'contratado' && (
                              <TouchableOpacity
                                style={[styles.stageActionChip, { backgroundColor: '#16A34A', borderColor: '#16A34A' }]}
                                onPress={() => handleMoveCandidateStage(app.id, 'contratado')}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="trophy" size={12} color="#FFFFFF" />
                                <Text style={[styles.stageActionChipText, { color: '#FFFFFF' }]}>Contratar ✓</Text>
                              </TouchableOpacity>
                            )}

                            {app.status !== 'recusada' && (
                              <TouchableOpacity
                                style={[styles.stageActionChip, { borderColor: '#DC2626' }]}
                                onPress={() => handleMoveCandidateStage(app.id, 'recusada')}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="close-circle-outline" size={12} color="#DC2626" />
                                <Text style={[styles.stageActionChipText, { color: '#DC2626' }]}>Recusar</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeTop: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  publishVagaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  publishVagaBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    maxWidth: '49%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricLab: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 260,
  },
  sectionActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addMiniText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyOppsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyOppsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  emptyOppsSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyPublishBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyPublishBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  oppsList: {
    gap: 12,
  },
  oppItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  oppHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  oppTitleBlock: {
    flex: 1,
  },
  oppStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  oppAreaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  oppCargo: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  oppMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  inscritosHighlightRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inscritosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  inscritosPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  oppActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  viewApplicantsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewApplicantsBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  viewApplicantsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  funnelBars: {
    gap: 10,
  },
  barItem: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Estilos dos Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editModalContainer: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  applicantsModalContainer: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitleBlock: {
    flex: 1,
    marginRight: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
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
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  modalityOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Estilos de Inscritos Modernizados e Responsivos
  loadingCandidatesBox: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingCandidatesText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyApplicantsBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  emptyApplicantsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyApplicantsSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  applicantsListScroll: {
    padding: 16,
    gap: 14,
  },
  applicantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  applicantTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applicantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CBD5E1',
  },
  applicantInfo: {
    flex: 1,
    minWidth: 0,
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  applicantCourse: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  applicantFatec: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  matchScoreBadge: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexShrink: 0,
  },
  matchScoreVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  matchScoreLab: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
  },
  appJustificativasBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appJustificativasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  appJustificativasTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  appJustificativaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 3,
  },
  appJustificativaText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },
  appMessageBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appMessageLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appMessageText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  appCompetenciasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  compPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compPillText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  appLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  appLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appLinkText: {
    fontSize: 11,
    color: Colors.textSecondary,
    maxWidth: 180,
  },
  appManagementSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  appStatusAndContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentStagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  currentStageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatCandidateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  chatCandidateBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stageTransitionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stageTransitionsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  stageButtonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  stageActionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
