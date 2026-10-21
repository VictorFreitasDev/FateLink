import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import {
  Application,
  ApplicationStatus,
  UserRole,
  ApplicationHistory,
  InterviewSchedule,
  Opportunity,
} from '../types';
import { api } from '../services/api';
import { ModalDetails } from '../components/ModalDetails';

interface ApplicationsScreenProps {
  role: UserRole;
  currentUserId?: number;
  onStartChat: (name: string, roleInfo: string, targetUserId?: number, vagaId?: number) => void;
}

// 6 Etapas do Stepper Visual
const STAGE_ORDER: ApplicationStatus[] = [
  'enviada',
  'em_analise',
  'selecionado',
  'entrevista',
  'proposta',
  'contratado',
];

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  enviada: { label: 'Enviada', color: '#2563EB', bg: '#EFF6FF', icon: 'paper-plane-outline' },
  nova: { label: 'Nova', color: '#2563EB', bg: '#EFF6FF', icon: 'sparkles-outline' },
  em_analise: { label: 'Em Análise', color: '#D97706', bg: '#FFFBEB', icon: 'search-outline' },
  selecionado: { label: 'Selecionado', color: '#6366F1', bg: '#EEF2FF', icon: 'checkmark-circle-outline' },
  entrevista: { label: 'Entrevista', color: '#7C3AED', bg: '#F5F3FF', icon: 'calendar-outline' },
  proposta: { label: 'Proposta', color: '#0D9488', bg: '#F0FDFA', icon: 'gift-outline' },
  contratado: { label: 'Contratado!', color: '#16A34A', bg: '#F0FDF4', icon: 'trophy-outline' },
  recusada: { label: 'Não Selecionado', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
  recusado: { label: 'Não Selecionado', color: '#DC2626', bg: '#FEF2F2', icon: 'close-circle-outline' },
  encerrado: { label: 'Encerrado', color: '#64748B', bg: '#F1F5F9', icon: 'close-circle-outline' },
  desistente: { label: 'Desistência', color: '#64748B', bg: '#F1F5F9', icon: 'remove-circle-outline' },
};

// Dicas e Próximos Passos Baseados na Etapa
const NEXT_STEPS_TIPS: Record<string, { title: string; desc: string }> = {
  enviada: {
    title: 'Candidatura Submetida',
    desc: 'Seu perfil foi recebido pelo RH. A triagem inicial costuma levar de 1 a 3 dias úteis.',
  },
  nova: {
    title: 'Candidatura Submetida',
    desc: 'Seu perfil foi recebido pelo RH. A triagem inicial costuma levar de 1 a 3 dias úteis.',
  },
  em_analise: {
    title: 'Perfil em Avaliação Técnica',
    desc: 'O time de recrutamento está avaliando seu currículo e projetos no GitHub/Portfólio.',
  },
  selecionado: {
    title: 'Aprovado para a Próxima Fase!',
    desc: 'Parabéns! Você passou na triagem e em breve receberá opções de datas para entrevista.',
  },
  entrevista: {
    title: 'Fase de Entrevistas',
    desc: 'Confirme o melhor horário abaixo. Prepare-se para falar sobre seus projetos acadêmicos e código.',
  },
  proposta: {
    title: 'Proposta de Contratação!',
    desc: 'A empresa enviou uma oferta formal de contratação ou termo de compromisso de estágio FATEC.',
  },
  contratado: {
    title: 'Processo Concluído com Sucesso! 🏆',
    desc: 'Você foi contratado! O termo de estágio ou contrato será homologado junto à secretaria da sua unidade FATEC.',
  },
  recusada: {
    title: 'Processo Seletivo Encerrado',
    desc: 'Não desanime! Continue explorando novas oportunidades e aprimorando seus projetos no FateLink.',
  },
};

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  role,
  currentUserId,
  onStartChat,
}) => {
  const isAluno = role === 'aluno';
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewsMap, setInterviewsMap] = useState<Record<number, InterviewSchedule>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('todas');

  // Modal de Histórico de Auditoria
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedAppHistory, setSelectedAppHistory] = useState<ApplicationHistory[]>([]);
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  // Modal para Detalhes da Vaga
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isOppModalVisible, setIsOppModalVisible] = useState(false);

  // Modal para Propor Entrevista (Empresa)
  const [proposeModalVisible, setProposeModalVisible] = useState(false);
  const [appForInterview, setAppForInterview] = useState<Application | null>(null);
  const [interviewFormato, setInterviewFormato] = useState<'online' | 'presencial'>('online');
  const [interviewLocal, setInterviewLocal] = useState('Google Meet (link será enviado no chat)');
  const [horario1, setHorario1] = useState('');
  const [horario2, setHorario2] = useState('');
  const [interviewObs, setInterviewObs] = useState('');
  const [submittingInterview, setSubmittingInterview] = useState(false);

  // Estado para Confirmação de Horário de Entrevista (Aluno)
  const [confirmingSlot, setConfirmingSlot] = useState(false);

  const loadData = async () => {
    if (!currentUserId) return;
    try {
      let apps: Application[] = [];
      if (isAluno) {
        apps = await api.getStudentApplications(currentUserId);
      } else {
        apps = await api.getCompanyApplications(currentUserId);
      }
      setApplications(apps);

      // Carrega entrevistas associadas para candidaturas em 'entrevista' ou 'selecionado'
      const iMap: Record<number, InterviewSchedule> = {};
      await Promise.all(
        apps.map(async (app) => {
          try {
            const intv = await api.getInterviewByCandidatura(app.id);
            if (intv) {
              iMap[app.id] = intv;
            }
          } catch (e) {}
        })
      );
      setInterviewsMap(iMap);
    } catch (e) {
      console.warn('Erro ao carregar candidaturas e entrevistas:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Abrir Histórico Auditado
  const handleOpenHistory = async (app: Application) => {
    setActiveApp(app);
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const history = await api.getApplicationHistory(app.id);
      setSelectedAppHistory(history);
    } catch (e) {
      console.warn('Erro ao carregar histórico da candidatura:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Abrir Oportunidade Completa
  const handleViewOpportunity = (vaga?: Opportunity) => {
    if (!vaga) return;
    setSelectedOpp(vaga);
    setIsOppModalVisible(true);
  };

  // Desistir da Candidatura (Estudante)
  const handleWithdraw = async (app: Application) => {
    const doWithdraw = async () => {
      const ok = await api.updateApplicationStatus(
        app.id,
        'desistente',
        'Desistência voluntária informada pelo estudante',
        currentUserId
      );
      if (ok) {
        showAlert('Candidatura Cancelada', 'Você cancelou sua participação neste processo seletivo.');
        loadData();
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza de que deseja desistir desta candidatura?')) {
        doWithdraw();
      }
    } else {
      Alert.alert('Cancelar Candidatura', 'Tem certeza de que deseja desistir deste processo seletivo?', [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Confirmar Desistência', style: 'destructive', onPress: doWithdraw },
      ]);
    }
  };

  // Aluno Confirma Horário de Entrevista
  const handleConfirmInterviewSlot = async (interviewId: number, slot: string) => {
    if (!currentUserId || confirmingSlot) return;
    setConfirmingSlot(true);
    try {
      const res = await api.confirmInterview(interviewId, currentUserId, slot);
      if (res.success) {
        showAlert('Entrevista Confirmada! 🎉', `Seu horário foi agendado com sucesso para: ${slot}`);
        loadData();
      } else {
        showAlert('Erro', res.error || 'Não foi possível confirmar o horário.');
      }
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro ao confirmar entrevista.');
    } finally {
      setConfirmingSlot(false);
    }
  };

  // Empresa Propor Horários de Entrevista
  const handleOpenProposeModal = (app: Application) => {
    setAppForInterview(app);
    setHorario1('');
    setHorario2('');
    setInterviewObs('');
    setProposeModalVisible(true);
  };

  const handleSendInterviewProposal = async () => {
    if (!appForInterview || !currentUserId) return;
    const slots = [horario1.trim(), horario2.trim()].filter(Boolean);
    if (slots.length === 0) {
      showAlert('Campos Obrigatórios', 'Informe ao menos 1 opção de data e horário para a entrevista.');
      return;
    }

    setSubmittingInterview(true);
    try {
      const res = await api.proposeInterview({
        candidaturaId: appForInterview.id,
        empresaId: currentUserId,
        formato: interviewFormato,
        linkOuLocal: interviewLocal.trim(),
        horariosPropostos: slots,
        observacoes: interviewObs.trim(),
      });

      if (res.success) {
        showAlert('Convite Enviado! 🎯', 'O estudante foi notificado com as opções de horário propostas.');
        setProposeModalVisible(false);
        loadData();
      } else {
        showAlert('Erro', res.error || 'Não foi possível agendar entrevista.');
      }
    } catch (e: any) {
      showAlert('Erro', e.message || 'Erro ao agendar entrevista.');
    } finally {
      setSubmittingInterview(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'todas') return true;
    return app.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header Superior */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.badgeTop}>FATElink 2.0 • CARREIRAS E SELEÇÃO</Text>
          <Text style={styles.title}>
            {isAluno ? 'Meus Processos Seletivos' : 'Acompanhamento de Candidaturas'}
          </Text>
          <Text style={styles.subtitle}>
            {isAluno
              ? 'Acompanhe a linha do tempo, confirme entrevistas e converse com empresas parceiras.'
              : 'Gerencie etapas, agende entrevistas e converse diretamente com talentos FATEC.'}
          </Text>
        </View>
      </View>

      {/* Filtro por Etapa */}
      <View style={styles.filterRow}>
        <View style={styles.filterRowInner}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['todas', 'enviada', 'em_analise', 'selecionado', 'entrevista', 'proposta', 'contratado'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, activeFilter === st && styles.filterChipActive]}
                onPress={() => setActiveFilter(st)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, activeFilter === st && styles.filterChipTextActive]}>
                  {st === 'todas' ? 'Todas' : STATUS_CONFIG[st as ApplicationStatus]?.label || st}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando candidaturas reais do banco...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS !== 'web'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={54} color={Colors.placeholder} />
              <Text style={styles.emptyTitle}>Nenhuma candidatura encontrada</Text>
              <Text style={styles.emptySub}>
                {isAluno
                  ? 'Você ainda não se candidatou a vagas ou não há registros com este filtro.'
                  : 'Nenhum estudante se candidatou com o filtro selecionado no momento.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.enviada;
            const nextTip = NEXT_STEPS_TIPS[item.status] || NEXT_STEPS_TIPS.enviada;
            const interview = interviewsMap[item.id];

            return (
              <View style={styles.appCard}>
                {/* Cabeçalho do Card */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vagaTitle} numberOfLines={1}>
                      {isAluno ? item.vaga?.cargo || 'Oportunidade FATEC' : item.candidato?.nome || 'Estudante FATEC'}
                    </Text>
                    <Text style={styles.companyName}>
                      {isAluno
                        ? item.vaga?.nomeFantasia || item.vaga?.empresa || 'Empresa Parceira'
                        : `${item.candidato?.curso || 'Tecnologia'} • ${item.candidato?.semestre || ''}`}
                    </Text>
                    {isAluno && item.vaga && (
                      <Text style={styles.vagaMeta}>
                        📍 {item.vaga.localizacao} • {item.vaga.modalidade} • 💰 {item.vaga.bolsa}
                      </Text>
                    )}
                  </View>

                  {/* Badge de Status Atual */}
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.color }]}>
                    <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Match Score & Data de Submissão */}
                <View style={styles.metricsRow}>
                  <View style={styles.matchScorePill}>
                    <Ionicons name="sparkles" size={12} color={Colors.primary} />
                    <Text style={styles.matchScoreText}>{item.matchScoreMomento}% Match Real</Text>
                  </View>
                  <Text style={styles.dateSubText}>
                    Candidatura em: {new Date(item.criadoEm).toLocaleDateString('pt-BR')}
                  </Text>
                </View>

                {/* ========================================================== */}
                {/* 3. LINHA DO TEMPO VISUAL (STEPPER DE 6 ETAPAS) */}
                {/* ========================================================== */}
                {!['recusada', 'recusado', 'encerrado', 'desistente'].includes(item.status) && (
                  <View style={styles.timelineStepperBox}>
                    <Text style={styles.stepperTitle}>Progresso da Candidatura</Text>
                    <View style={styles.stepperRow}>
                      {STAGE_ORDER.map((stage, idx) => {
                        const currentIdx = STAGE_ORDER.indexOf(item.status);
                        const isDone = currentIdx > idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <View key={stage} style={styles.stepCol}>
                            <View style={styles.stepCircleRow}>
                              {idx > 0 && (
                                <View
                                  style={[
                                    styles.stepConnector,
                                    isDone || isCurrent ? styles.stepConnectorDone : null,
                                  ]}
                                />
                              )}
                              <View
                                style={[
                                  styles.stepCircle,
                                  isDone && styles.stepCircleDone,
                                  isCurrent && styles.stepCircleCurrent,
                                ]}
                              >
                                {isDone ? (
                                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                ) : (
                                  <Text
                                    style={[
                                      styles.stepNumText,
                                      isCurrent && styles.stepNumTextCurrent,
                                    ]}
                                  >
                                    {idx + 1}
                                  </Text>
                                )}
                              </View>
                              {idx < STAGE_ORDER.length - 1 && (
                                <View
                                  style={[
                                    styles.stepConnector,
                                    isDone ? styles.stepConnectorDone : null,
                                  ]}
                                />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.stepLabel,
                                isCurrent && styles.stepLabelCurrent,
                              ]}
                              numberOfLines={1}
                            >
                              {STATUS_CONFIG[stage].label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Próximas Etapas e Orientações */}
                <View style={styles.nextStepBox}>
                  <View style={styles.nextStepHeader}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.nextStepTitle}>{nextTip.title}</Text>
                  </View>
                  <Text style={styles.nextStepDesc}>{nextTip.desc}</Text>
                </View>

                {/* ========================================================== */}
                {/* 5. AGENDAMENTO DE ENTREVISTA INTEGRADO */}
                {/* ========================================================== */}
                {interview && (
                  <View style={styles.interviewBox}>
                    <View style={styles.interviewHeader}>
                      <Ionicons name="calendar" size={18} color="#7C3AED" />
                      <Text style={styles.interviewTitle}>
                        {interview.status === 'confirmada' ? 'Entrevista Agendada ✓' : 'Convite de Entrevista Pendente'}
                      </Text>
                    </View>

                    <Text style={styles.interviewMeta}>
                      Formato: <Text style={{ fontWeight: '700' }}>{interview.formato.toUpperCase()}</Text> • Local/Link:{' '}
                      <Text style={{ fontWeight: '700' }}>{interview.linkOuLocal || 'A combinar'}</Text>
                    </Text>

                    {interview.observacoes ? (
                      <Text style={styles.interviewObs}>"{interview.observacoes}"</Text>
                    ) : null}

                    {interview.status === 'confirmada' ? (
                      <View style={styles.confirmedSlotBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                        <Text style={styles.confirmedSlotText}>
                          Horário Confirmado: {interview.horarioConfirmado}
                        </Text>
                      </View>
                    ) : isAluno ? (
                      /* Aluno escolhe um dos horários oferecidos */
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.selectSlotLabel}>Selecione seu horário preferido:</Text>
                        <View style={styles.slotsGrid}>
                          {interview.horariosPropostos.map((slot, sIdx) => (
                            <TouchableOpacity
                              key={sIdx}
                              style={styles.slotBtn}
                              onPress={() => handleConfirmInterviewSlot(interview.id, slot)}
                              disabled={confirmingSlot}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="time-outline" size={14} color="#7C3AED" />
                              <Text style={styles.slotBtnText}>{slot}</Text>
                              <Ionicons name="checkmark-circle-outline" size={14} color="#7C3AED" />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.waitingSlotText}>
                        Aguardando o estudante confirmar um dos {interview.horariosPropostos.length} horários oferecidos.
                      </Text>
                    )}
                  </View>
                )}

                {/* Botão para Empresa Propor Entrevista (se ainda não houver) */}
                {!isAluno && !interview && ['selecionado', 'entrevista'].includes(item.status) && (
                  <TouchableOpacity
                    style={styles.proposeInterviewBtn}
                    onPress={() => handleOpenProposeModal(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.proposeInterviewBtnText}>Agendar / Oferecer Horários de Entrevista</Text>
                  </TouchableOpacity>
                )}

                {/* ========================================================== */}
                {/* AÇÕES DISPONÍVEIS NA CANDIDATURA */}
                {/* ========================================================== */}
                <View style={styles.actionsRow}>
                  {/* Botão de Chat */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      if (isAluno) {
                        onStartChat(
                          item.vaga?.nomeFantasia || 'Recrutador',
                          item.vaga?.cargo || 'Vaga',
                          item.vaga?.empresaId,
                          item.vagaId
                        );
                      } else {
                        onStartChat(
                          item.candidato?.nome || 'Estudante FATEC',
                          item.candidato?.curso || 'Aluno',
                          item.candidato?.usuarioId || item.alunoId,
                          item.vagaId
                        );
                      }
                    }}
                  >
                    <Ionicons name="chatbubbles-outline" size={15} color={Colors.primary} />
                    <Text style={styles.actionBtnText}>Conversar</Text>
                  </TouchableOpacity>

                  {/* Botão Ver Vaga */}
                  {isAluno && item.vaga && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleViewOpportunity(item.vaga)}
                    >
                      <Ionicons name="briefcase-outline" size={15} color="#475569" />
                      <Text style={[styles.actionBtnText, { color: '#475569' }]}>Ver Vaga</Text>
                    </TouchableOpacity>
                  )}

                  {/* Botão Histórico Auditado */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenHistory(item)}
                  >
                    <Ionicons name="time-outline" size={15} color="#6366F1" />
                    <Text style={[styles.actionBtnText, { color: '#6366F1' }]}>Histórico</Text>
                  </TouchableOpacity>

                  {/* Cancelar / Desistir (Estudante) */}
                  {isAluno && !['contratado', 'desistente', 'recusada'].includes(item.status) && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#FECACA' }]}
                      onPress={() => handleWithdraw(item)}
                    >
                      <Ionicons name="close-circle-outline" size={15} color="#DC2626" />
                      <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Desistir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ========================================================== */}
      {/* MODAL 1: HISTÓRICO AUDITADO DA CANDIDATURA */}
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
                <Text style={styles.modalHeaderTitle}>Histórico de Auditoria</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {activeApp?.vaga?.cargo || 'Oportunidade'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              {loadingHistory ? (
                <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 30 }} />
              ) : selectedAppHistory.length === 0 ? (
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
                    Nenhuma transição adicional registrada até o momento.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 14 }}>
                  {selectedAppHistory.map((h, i) => (
                    <View key={h.id || i} style={styles.auditRow}>
                      <View style={styles.auditDot} />
                      <View style={styles.auditContent}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.auditStatus}>Etapa: {h.statusNovo.toUpperCase()}</Text>
                          <Text style={styles.auditDate}>
                            {new Date(h.criadoEm).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        {h.statusAnterior && (
                          <Text style={styles.auditPrev}>Anterior: {h.statusAnterior.toUpperCase()}</Text>
                        )}
                        {h.motivo && <Text style={styles.auditMotivo}>"{h.motivo}"</Text>}
                        {h.alteradoPorNome && (
                          <Text style={styles.auditUser}>Registrado por: {h.alteradoPorNome}</Text>
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
      {/* MODAL 2: EMPRESA PROPOR HORÁRIOS DE ENTREVISTA */}
      {/* ========================================================== */}
      <Modal
        visible={proposeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProposeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.proposeModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Agendar Entrevista</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  Candidato: {appForInterview?.candidato?.nome || 'Estudante'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setProposeModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Formato da Entrevista</Text>
              <View style={styles.formatRow}>
                {(['online', 'presencial'] as const).map((fmt) => (
                  <TouchableOpacity
                    key={fmt}
                    style={[styles.formatBtn, interviewFormato === fmt && styles.formatBtnActive]}
                    onPress={() => setInterviewFormato(fmt)}
                  >
                    <Text style={[styles.formatBtnText, interviewFormato === fmt && styles.formatBtnTextActive]}>
                      {fmt === 'online' ? '🌐 Online (Remota)' : '🏢 Presencial'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Link da Videochamada ou Endereço Presencial</Text>
              <TextInput
                style={styles.fieldInput}
                value={interviewLocal}
                onChangeText={setInterviewLocal}
                placeholder="Ex: Google Meet, Teams ou Av. Tiradentes, 615 - São Paulo"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.fieldLabel}>Opção de Horário 1 *</Text>
              <TextInput
                style={styles.fieldInput}
                value={horario1}
                onChangeText={setHorario1}
                placeholder="Ex: 28/10 às 14:00"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.fieldLabel}>Opção de Horário 2 (Opcional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={horario2}
                onChangeText={setHorario2}
                placeholder="Ex: 29/10 às 10:30"
                placeholderTextColor={Colors.placeholder}
              />

              <Text style={styles.fieldLabel}>Orientações ou Observações para o Candidato</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 70, textAlignVertical: 'top' }]}
                value={interviewObs}
                onChangeText={setInterviewObs}
                placeholder="Ex: Teremos um bate-papo técnico sobre seus projetos com React Native."
                placeholderTextColor={Colors.placeholder}
                multiline
              />

              <TouchableOpacity
                style={[styles.submitInterviewBtn, submittingInterview && { opacity: 0.7 }]}
                onPress={handleSendInterviewProposal}
                disabled={submittingInterview}
              >
                {submittingInterview ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={17} color="#FFFFFF" />
                    <Text style={styles.submitInterviewBtnText}>Enviar Convite de Entrevista</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Detalhes da Vaga */}
      <ModalDetails
        visible={isOppModalVisible}
        onClose={() => setIsOppModalVisible(false)}
        opportunity={selectedOpp}
        actionLabel="Fechar"
        onAction={() => setIsOppModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerInner: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  badgeTop: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  filterRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterRowInner: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
    lineHeight: 19,
  },
  appCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  vagaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  vagaMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  matchScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchScoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  dateSubText: {
    fontSize: 11,
    color: Colors.placeholder,
  },

  // Stepper Visual
  timelineStepperBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#CBD5E1',
  },
  stepConnectorDone: {
    backgroundColor: Colors.primary,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: Colors.primary,
  },
  stepCircleCurrent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepNumTextCurrent: {
    color: Colors.primary,
  },
  stepLabel: {
    fontSize: 9,
    color: Colors.placeholder,
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // Próximos Passos
  nextStepBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  nextStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nextStepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
  },
  nextStepDesc: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
  },

  // Entrevista Box
  interviewBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  interviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  interviewTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6D28D9',
  },
  interviewMeta: {
    fontSize: 12,
    color: '#5B21B6',
    lineHeight: 17,
  },
  interviewObs: {
    fontSize: 12,
    color: '#4C1D95',
    fontStyle: 'italic',
    marginTop: 4,
  },
  confirmedSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  confirmedSlotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
  },
  selectSlotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
    marginBottom: 6,
  },
  slotsGrid: {
    gap: 6,
  },
  slotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  slotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B21B6',
    flex: 1,
    marginLeft: 8,
  },
  waitingSlotText: {
    fontSize: 12,
    color: '#6D28D9',
    marginTop: 6,
    fontStyle: 'italic',
  },
  proposeInterviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 9,
    borderRadius: 8,
    marginBottom: 12,
  },
  proposeInterviewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Ações do Card
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
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
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  historyModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  proposeModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
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
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalHeaderSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  auditRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  auditDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  auditContent: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditStatus: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  auditDate: {
    fontSize: 11,
    color: Colors.placeholder,
  },
  auditPrev: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  auditMotivo: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 4,
  },
  auditUser: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },

  // Form de Entrevista
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  formatBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  formatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  formatBtnTextActive: {
    color: '#FFFFFF',
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  submitInterviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    height: 48,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  submitInterviewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
