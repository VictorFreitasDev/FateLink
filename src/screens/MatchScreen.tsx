import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole, MutualMatch } from '../types';
import { api } from '../services/api';

interface MatchScreenProps {
  role: UserRole;
  currentUserId?: number;
  onStartChat: (name: string, roleInfo: string, targetUserId?: number, vagaId?: number) => void;
  onNavigateToFeed?: () => void;
}

export const MatchScreen: React.FC<MatchScreenProps> = ({
  role,
  currentUserId,
  onStartChat,
  onNavigateToFeed,
}) => {
  const isAluno = role === 'aluno';
  const [matches, setMatches] = useState<MutualMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MutualMatch | null>(null);

  const loadMatches = async () => {
    if (!currentUserId) return;
    try {
      const res = await api.getMatches(currentUserId);
      if (res && res.matches) {
        setMatches(res.matches);
      }
    } catch (e) {
      console.warn('Erro ao carregar matches mútuos:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [currentUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando conexões e matches mútuos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header da Aba Conexões & Elos */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="git-network" size={24} color={Colors.primary} />
            <Text style={styles.title}>Elos & Conexões Estabelecidas</Text>
          </View>
          <Text style={styles.subtitle}>
            {isAluno
              ? 'Empresas parceiras e oportunidades com afinidade mútua confirmada no seu perfil FATEC.'
              : 'Estudantes FATEC com afinidade bilateral confirmada nas suas oportunidades.'}
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>
              {matches.length} {matches.length === 1 ? 'elo ativo' : 'elos ativos'}
            </Text>
          </View>
        </View>
      </View>

      {/* Conteúdo Principal */}
      <ScrollView
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
        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="git-network-outline" size={44} color={Colors.placeholder} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum Elo Estabelecido Ainda</Text>
            <Text style={styles.emptySubtitle}>
              {isAluno
                ? 'Explore as oportunidades no Feed e toque em Conectar naquelas que combinam com seu momento acadêmico. Quando houver afinidade recíproca com a empresa, o elo será ativado instantaneamente aqui!'
                : 'Explore os talentos da FATEC no Feed e estabeleça conexões. Quando o estudante confirmar a afinidade, o elo profissional será ativado com canal direto de diálogo.'}
            </Text>
            {onNavigateToFeed && (
              <TouchableOpacity
                style={styles.exploreFeedBtn}
                onPress={onNavigateToFeed}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.exploreFeedBtnText}>
                  {isAluno ? 'Explorar Vagas no Feed' : 'Explorar Talentos no Feed'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.matchesList}>
            {matches.map((item) => {
              const displayName = isAluno ? item.empresaNome : item.alunoNome;
              const displayImage = isAluno ? item.empresaImagem : item.alunoImagem;
              const subTitle = isAluno ? item.cargo : `${item.curso} • ${item.semestre}`;
              const locationInfo = isAluno ? `${item.localizacao} • ${item.modalidade}` : item.unidadeFatec;

              return (
                <View key={item.id} style={styles.matchCard}>
                  {/* Linha Superior: Imagem, Nomes e Badge de Status */}
                  <View style={styles.cardTopRow}>
                    <Image
                      source={{ uri: displayImage }}
                      style={styles.avatar}
                      resizeMode="cover"
                    />

                    <View style={styles.cardHeaderInfo}>
                      <View style={styles.statusRow}>
                        <View style={styles.badgePill}>
                          <Text style={styles.badgePillText}>{item.badgeLabel}</Text>
                        </View>
                        <View style={styles.matchScorePill}>
                          <Text style={styles.matchScoreText}>{item.matchScore}% Match</Text>
                        </View>
                      </View>

                      <Text style={styles.mainName} numberOfLines={1}>{displayName}</Text>
                      <Text style={styles.subTitleText} numberOfLines={1}>{subTitle}</Text>
                      <Text style={styles.locationText} numberOfLines={1}>📍 {locationInfo}</Text>
                    </View>
                  </View>

                  {/* Informações Complementares */}
                  {isAluno && item.bolsa && (
                    <View style={styles.bolsaRow}>
                      <Ionicons name="cash-outline" size={14} color="#10B981" />
                      <Text style={styles.bolsaText}>Bolsa-Auxílio: {item.bolsa}</Text>
                    </View>
                  )}

                  {!isAluno && item.vagaCargo && (
                    <View style={styles.vagaReferenciaRow}>
                      <Ionicons name="briefcase-outline" size={14} color={Colors.primary} />
                      <Text style={styles.vagaReferenciaText}>Vaga: {item.vagaCargo}</Text>
                    </View>
                  )}

                  {/* Tags de Requisitos / Competências */}
                  {item.competencias && item.competencias.length > 0 && (
                    <View style={styles.tagsRow}>
                      {item.competencias.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={styles.tagPill}>
                          <Text style={styles.tagPillText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Ações do Match: Conversar e Ver Detalhes */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => setSelectedMatch(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.detailsBtnText}>Detalhes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => {
                        const targetId = isAluno ? item.empresaId : item.alunoId;
                        onStartChat(displayName || 'Contato', subTitle || 'Match', targetId, item.vagaId);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                      <Text style={styles.chatBtnText}>Iniciar Conversa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal de Detalhes da Conexão / Vaga */}
      <Modal
        visible={!!selectedMatch}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMatch(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {isAluno ? 'Detalhes da Oportunidade' : 'Perfil do Estudante FATEC'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedMatch && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <View style={styles.modalHero}>
                  <Image
                    source={{ uri: isAluno ? selectedMatch.vagaImagem || selectedMatch.empresaImagem : selectedMatch.alunoImagem }}
                    style={styles.modalHeroImg}
                  />
                  <Text style={styles.modalMainTitle}>
                    {isAluno ? selectedMatch.cargo : selectedMatch.alunoNome}
                  </Text>
                  <Text style={styles.modalSubTitle}>
                    {isAluno ? selectedMatch.empresaNome : selectedMatch.curso}
                  </Text>
                  <View style={styles.modalBadgeRow}>
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{selectedMatch.badgeLabel}</Text>
                    </View>
                    <View style={styles.matchScorePill}>
                      <Text style={styles.matchScoreText}>{selectedMatch.matchScore}% Match</Text>
                    </View>
                  </View>
                </View>

                {/* Descrição / Sobre */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>
                    {isAluno ? 'Sobre a Vaga' : 'Apresentação'}
                  </Text>
                  <Text style={styles.modalSectionText}>
                    {isAluno
                      ? selectedMatch.descricao || 'Oportunidade para atuar com equipes qualificadas no desenvolvimento de soluções tecnológicas inovadoras.'
                      : selectedMatch.sobre || 'Estudante da FATEC dedicado e focado em aprendizado contínuo.'}
                  </Text>
                </View>

                {/* Requisitos / Competências */}
                {(isAluno ? selectedMatch.requisitos : selectedMatch.competencias) && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      {isAluno ? 'Requisitos Desejados' : 'Competências Técnicas'}
                    </Text>
                    <View style={styles.tagsRow}>
                      {(isAluno ? selectedMatch.requisitos : selectedMatch.competencias)?.map((tag, i) => (
                        <View key={i} style={styles.modalTagPill}>
                          <Text style={styles.modalTagText}>• {tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Botão de Iniciar Chat dentro do Modal */}
                <TouchableOpacity
                  style={styles.modalChatBtn}
                  onPress={() => {
                    const matchItem = selectedMatch;
                    setSelectedMatch(null);
                    const targetId = isAluno ? matchItem.empresaId : matchItem.alunoId;
                    onStartChat(
                      isAluno ? matchItem.empresaNome || 'Empresa' : matchItem.alunoNome || 'Estudante',
                      isAluno ? matchItem.cargo || 'Vaga' : matchItem.curso || 'FATEC',
                      targetId,
                      matchItem.vagaId
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                  <Text style={styles.modalChatBtnText}>Abrir Chat com {isAluno ? selectedMatch.empresaNome : selectedMatch.alunoNome}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerInner: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 20,
  },
  exploreFeedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  exploreFeedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  matchesList: {
    gap: 14,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  badgePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  matchScorePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  matchScoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  mainName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subTitleText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  locationText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bolsaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bolsaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  vagaReferenciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  vagaReferenciaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 4,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chatBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  chatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal de Detalhes
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
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
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  modalHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeroImg: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
  },
  modalMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  modalBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  modalSectionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalTagPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTagText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  modalChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  modalChatBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
