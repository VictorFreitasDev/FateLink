import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Application, ApplicationStatus, UserRole } from '../types';
import { api } from '../services/api';

interface ApplicationsScreenProps {
  role: UserRole;
  currentUserId?: number;
  onStartChat: (name: string, roleInfo: string) => void;
}

const STAGE_ORDER: ApplicationStatus[] = ['enviada', 'em_analise', 'entrevista', 'proposta', 'contratado'];

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: string }> = {
  enviada: { label: 'Enviada', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)', icon: 'paper-plane-outline' },
  em_analise: { label: 'Em Análise', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', icon: 'search-outline' },
  entrevista: { label: 'Entrevista', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.12)', icon: 'calendar-outline' },
  proposta: { label: 'Proposta', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', icon: 'gift-outline' },
  contratado: { label: 'Contratado!', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.15)', icon: 'trophy-outline' },
  recusada: { label: 'Não Selecionado', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.10)', icon: 'close-circle-outline' },
  desistente: { label: 'Cancelada', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.10)', icon: 'remove-circle-outline' },
};

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  role,
  currentUserId,
  onStartChat,
}) => {
  const isAluno = role === 'aluno';
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('todas');

  const loadData = async () => {
    if (!currentUserId) return;
    try {
      if (isAluno) {
        const data = await api.getStudentApplications(currentUserId);
        setApplications(data);
      } else {
        const data = await api.getCompanyApplications(currentUserId);
        setApplications(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar candidaturas:', e);
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

  const handleUpdateStatus = async (appId: number, newStatus: ApplicationStatus) => {
    const success = await api.updateApplicationStatus(appId, newStatus, 'Alteração via painel', currentUserId);
    if (success) {
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
      const msg = `Etapa atualizada para: ${STATUS_CONFIG[newStatus].label}`;
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Status Atualizado', msg);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'todas') return true;
    return app.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isAluno ? 'Minhas Candidaturas FATEC' : 'Gestão de Candidatos por Vaga'}
        </Text>
        <Text style={styles.subtitle}>
          {isAluno
            ? 'Acompanhe em tempo real as etapas de cada processo seletivo.'
            : 'Avalie e mova candidatos pelas etapas do funil de recrutamento.'}
        </Text>
      </View>

      {/* Filtro por Etapa */}
      <View style={styles.filterRow}>
        {['todas', 'enviada', 'em_analise', 'entrevista', 'proposta', 'contratado'].map((st) => (
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
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando candidaturas do banco...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
              <Ionicons name="document-text-outline" size={54} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhuma candidatura encontrada</Text>
              <Text style={styles.emptySub}>
                {isAluno
                  ? 'Você ainda não enviou candidaturas ou não há registros com este filtro.'
                  : 'Nenhum estudante se candidatou com este filtro no momento.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.enviada;

            return (
              <View style={styles.card}>
                {/* Cabeçalho do Card */}
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {isAluno ? item.vaga?.cargo || 'Vaga de Tecnologia' : item.candidato?.nome || 'Estudante FATEC'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {isAluno ? item.vaga?.nomeFantasia || item.vaga?.empresa : item.candidato?.curso}
                    </Text>
                  </View>

                  {/* Badge de Status Atual */}
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Match Score Real & Explicações */}
                <View style={styles.matchRow}>
                  <View style={styles.matchScorePill}>
                    <Ionicons name="sparkles" size={13} color={Colors.primary} />
                    <Text style={styles.matchScorePillText}>{item.matchScoreMomento}% Match Real</Text>
                  </View>
                  <Text style={styles.dateText}>
                    Enviada em {new Date(item.criadoEm).toLocaleDateString()}
                  </Text>
                </View>

                {/* Justificativas do Algoritmo */}
                {item.matchJustificativas && item.matchJustificativas.length > 0 && (
                  <View style={styles.justificativasBox}>
                    <Text style={styles.justificativasTitle}>Diagnóstico de Compatibilidade:</Text>
                    {item.matchJustificativas.slice(0, 2).map((just, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <Ionicons name="checkmark-circle" size={13} color={Colors.like} style={{ marginTop: 2 }} />
                        <Text style={styles.bulletText}>{just}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Barra de Progresso das Etapas (Stepper Visual) */}
                {['enviada', 'em_analise', 'entrevista', 'proposta', 'contratado'].includes(item.status) && (
                  <View style={styles.stepperContainer}>
                    {STAGE_ORDER.map((stage, idx) => {
                      const currentIdx = STAGE_ORDER.indexOf(item.status);
                      const isPastOrCurrent = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <View key={stage} style={styles.stepItem}>
                          <View
                            style={[
                              styles.stepCircle,
                              isPastOrCurrent && styles.stepCircleActive,
                              isCurrent && styles.stepCircleCurrent,
                            ]}
                          >
                            <Text
                              style={[
                                styles.stepNumber,
                                isPastOrCurrent && styles.stepNumberActive,
                              ]}
                            >
                              {idx + 1}
                            </Text>
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
                )}

                {/* Ações Específicas por Papel */}
                <View style={styles.cardActions}>
                  {!isAluno ? (
                    /* Empresa: Ações para Mover Etapa */
                    <View style={styles.companyActions}>
                      <Text style={styles.actionLabel}>Mover para:</Text>
                      <View style={styles.actionButtonsGrid}>
                        {item.status !== 'em_analise' && (
                          <TouchableOpacity
                            style={[styles.stageBtn, { borderColor: '#D97706' }]}
                            onPress={() => handleUpdateStatus(item.id, 'em_analise')}
                          >
                            <Text style={[styles.stageBtnText, { color: '#D97706' }]}>Em Análise</Text>
                          </TouchableOpacity>
                        )}
                        {item.status !== 'entrevista' && (
                          <TouchableOpacity
                            style={[styles.stageBtn, { borderColor: '#7C3AED' }]}
                            onPress={() => handleUpdateStatus(item.id, 'entrevista')}
                          >
                            <Text style={[styles.stageBtnText, { color: '#7C3AED' }]}>Entrevista</Text>
                          </TouchableOpacity>
                        )}
                        {item.status !== 'proposta' && (
                          <TouchableOpacity
                            style={[styles.stageBtn, { borderColor: '#059669' }]}
                            onPress={() => handleUpdateStatus(item.id, 'proposta')}
                          >
                            <Text style={[styles.stageBtnText, { color: '#059669' }]}>Proposta</Text>
                          </TouchableOpacity>
                        )}
                        {item.status !== 'contratado' && (
                          <TouchableOpacity
                            style={[styles.stageBtn, { backgroundColor: '#16A34A', borderColor: '#16A34A' }]}
                            onPress={() => handleUpdateStatus(item.id, 'contratado')}
                          >
                            <Text style={[styles.stageBtnText, { color: '#FFFFFF' }]}>Contratar ✓</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ) : null}

                  {/* Botão de Mensagem / Chat */}
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => {
                      if (isAluno) {
                        onStartChat(item.vaga?.nomeFantasia || 'Recrutador', item.vaga?.cargo || 'Vaga');
                      } else {
                        onStartChat(item.candidato?.nome || 'Estudante FATEC', item.candidato?.curso || 'Aluno');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubbles-outline" size={16} color={Colors.primary} />
                    <Text style={styles.chatButtonText}>Abrir Conversa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
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
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  matchScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  matchScorePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  dateText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  justificativasBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  justificativasTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 3,
  },
  bulletText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
    lineHeight: 15,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  stepCircleActive: {
    backgroundColor: Colors.primaryLight,
  },
  stepCircleCurrent: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  stepNumberActive: {
    color: Colors.primary,
  },
  stepLabel: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
  },
  stepLabelCurrent: {
    fontWeight: '800',
    color: Colors.primary,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  companyActions: {
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    height: 38,
    borderRadius: 19,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
});

