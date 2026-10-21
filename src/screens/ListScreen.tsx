import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Opportunity, Candidate, UserRole } from '../types';
import { ModalDetails } from '../components/ModalDetails';
import { api } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

interface ListScreenProps {
  role: UserRole;
  currentUserId?: number;
  opportunities: Opportunity[];
  candidates: Candidate[];
  searchQuery: string;
  onStartChat: (name: string, roleInfo: string) => void;
  onApplyToOpportunity?: (opp: Opportunity) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

export const ListScreen: React.FC<ListScreenProps> = ({
  role,
  currentUserId = 1,
  opportunities,
  candidates,
  searchQuery,
  onStartChat,
  onApplyToOpportunity,
  onRefresh,
  refreshing = false,
}) => {
  const isAluno = role === 'aluno';
  const targetTipo: 'vaga' | 'candidato' = isAluno ? 'vaga' : 'candidato';

  // Modo de Visualização: 'swipe' (Cards Imersivos Tinder/TikTok) ou 'list' (Diretório Completo)
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');

  // Dados e Estado do Feed
  const [feedItems, setFeedItems] = useState<any[]>(isAluno ? opportunities : candidates);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [evaluatedIds, setEvaluatedIds] = useState<Set<number>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [selectedCand, setSelectedCand] = useState<Candidate | null>(null);
  const [lastAction, setLastAction] = useState<{ id: number; decisao: 'like' | 'pass' } | null>(null);
  const [mutualMatchInfo, setMutualMatchInfo] = useState<any | null>(null);
  const [loadingDecisions, setLoadingDecisions] = useState(true);

  // Animações de Física (Tinder + ReactBits Stack)
  const pan = useRef(new Animated.ValueXY()).current;
  const isAnimating = useRef(false);

  // Busca dados diretamente do backend se necessário para manter 100% atualizado
  const loadFeedData = async () => {
    setLoadingFeed(true);
    try {
      if (isAluno) {
        const opps = await api.getOpportunities(currentUserId);
        if (opps && opps.length > 0) setFeedItems(opps);
      } else {
        const cands = await api.getCandidates();
        if (cands && cands.length > 0) setFeedItems(cands);
      }
    } catch (e) {
      console.warn('Erro ao carregar feed no ListScreen:', e);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Carregar decisões anteriores do PostgreSQL para não repetir cartões
  const loadDecisions = async () => {
    try {
      const decisions = await api.getFeedDecisions(currentUserId, targetTipo);
      const ids = new Set<number>(decisions.map((d) => d.target_id));
      setEvaluatedIds(ids);
    } catch (e) {
      console.warn('Erro ao carregar decisões anteriores:', e);
    } finally {
      setLoadingDecisions(false);
    }
  };

  useEffect(() => {
    loadDecisions();
    loadFeedData();
  }, [currentUserId, targetTipo, role]);

  // Sincroniza se os props do pai mudarem
  useEffect(() => {
    const propList = isAluno ? opportunities : candidates;
    if (propList && propList.length > 0) {
      setFeedItems(propList);
    }
  }, [opportunities, candidates, isAluno]);

  // Lista de itens filtrada por busca e excluindo itens já avaliados (para Modo Swipe)
  const activeItems = feedItems.filter((item: any) => {
    if (!item) return false;
    const numericId = item.dbId || parseInt(String(item.id).replace('opp-', '').replace('cand-', ''), 10);
    if (evaluatedIds.has(numericId)) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (isAluno) {
      const opp = item as Opportunity;
      return (
        opp.cargo?.toLowerCase().includes(q) ||
        opp.empresa?.toLowerCase().includes(q) ||
        opp.nomeFantasia?.toLowerCase().includes(q) ||
        opp.area?.toLowerCase().includes(q) ||
        (Array.isArray(opp.requisitos) && opp.requisitos.some((r) => r.toLowerCase().includes(q)))
      );
    } else {
      const cand = item as Candidate;
      return (
        cand.nome?.toLowerCase().includes(q) ||
        cand.curso?.toLowerCase().includes(q) ||
        cand.unidadeFatec?.toLowerCase().includes(q) ||
        (Array.isArray(cand.competencias) && cand.competencias.some((c) => c.toLowerCase().includes(q)))
      );
    }
  });

  // Lista completa de todos os itens (para Modo Lista Completa)
  const allListItems = feedItems.filter((item: any) => {
    if (!item) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (isAluno) {
      const opp = item as Opportunity;
      return (
        opp.cargo?.toLowerCase().includes(q) ||
        opp.empresa?.toLowerCase().includes(q) ||
        opp.nomeFantasia?.toLowerCase().includes(q) ||
        opp.area?.toLowerCase().includes(q) ||
        (Array.isArray(opp.requisitos) && opp.requisitos.some((r) => r.toLowerCase().includes(q)))
      );
    } else {
      const cand = item as Candidate;
      return (
        cand.nome?.toLowerCase().includes(q) ||
        cand.curso?.toLowerCase().includes(q) ||
        cand.unidadeFatec?.toLowerCase().includes(q) ||
        (Array.isArray(cand.competencias) && cand.competencias.some((c) => c.toLowerCase().includes(q)))
      );
    }
  });

  const defaultOppImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
  const defaultCandImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  const currentItem: any = activeItems[0] || null;
  const nextItem: any = activeItems[1] || null;

  const currentImageUrl = currentItem?.imagemUrl || (isAluno ? defaultOppImage : defaultCandImage);
  const nextImageUrl = nextItem?.imagemUrl || (isAluno ? defaultOppImage : defaultCandImage);

  // Interpolações de Física e Rotação
  const rotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-16deg', '0deg', '16deg'],
    extrapolate: 'clamp',
  });

  const animatedCardStyle = {
    zIndex: 10,
    elevation: 10,
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { rotate },
    ],
  };

  // Carimbo "TENHO INTERESSE" (Direita - Verde)
  const likeOpacity = pan.x.interpolate({
    inputRange: [15, SWIPE_THRESHOLD * 0.8],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Carimbo "PASSAR" (Esquerda - Vermelho)
  const passOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.8, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Próximo cartão ao fundo (Stack Effect ReactBits)
  const nextCardScale = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  // Gestor de Arraste (PanResponder)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (modalVisible || isAnimating.current) return false;
        return Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onPanResponderMove: (_, gesture) => {
        if (isAnimating.current || modalVisible) return;
        pan.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (isAnimating.current || modalVisible) return;

        if (gesture.dx > SWIPE_THRESHOLD || gesture.vx > 0.65) {
          executeDecision('like');
        } else if (gesture.dx < -SWIPE_THRESHOLD || gesture.vx < -0.65) {
          executeDecision('pass');
        } else {
          // Gesto insuficiente: Spring physics suave de retorno
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Suporte a teclado no Web / Desktop (Setas Esquerda e Direita)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalVisible || isAnimating.current || !currentItem) return;

      if (e.key === 'ArrowRight') {
        executeDecision('like');
      } else if (e.key === 'ArrowLeft') {
        executeDecision('pass');
      } else if (e.key === ' ' || e.key === 'Enter') {
        handleOpenDetails();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentItem, modalVisible]);

  // Executar Decisão com Animação Fluida e Persistência no PostgreSQL
  const executeDecision = (decisao: 'like' | 'pass') => {
    if (isAnimating.current || !currentItem) return;
    isAnimating.current = true;

    const targetX = decisao === 'like' ? SCREEN_WIDTH * 1.4 : -SCREEN_WIDTH * 1.4;
    const targetY = 30;

    const targetNumericId = currentItem.dbId || parseInt(String(currentItem.id).replace('opp-', '').replace('cand-', ''), 10);

    Animated.timing(pan, {
      toValue: { x: targetX, y: targetY },
      duration: 260,
      useNativeDriver: false,
    }).start(async () => {
      pan.setValue({ x: 0, y: 0 });
      isAnimating.current = false;

      // Gravar no PostgreSQL
      try {
        const res = await api.sendFeedDecision(
          currentUserId,
          role,
          targetNumericId,
          targetTipo,
          decisao
        );

        if (res.isMutualMatch) {
          setMutualMatchInfo(res.matchInfo || { empresaNome: 'Empresa', cargo: 'Vaga' });
        }
      } catch (err) {
        console.warn('Erro ao salvar decisão no banco:', err);
      }

      setLastAction({ id: targetNumericId, decisao });
      setEvaluatedIds((prev) => new Set(prev).add(targetNumericId));
    });
  };

  // Desfazer última decisão (Undo)
  const handleUndo = async () => {
    if (!lastAction || isAnimating.current) return;
    try {
      const ok = await api.undoFeedDecision(currentUserId, targetTipo);
      if (ok) {
        setEvaluatedIds((prev) => {
          const next = new Set(prev);
          next.delete(lastAction.id);
          return next;
        });
        setLastAction(null);
      }
    } catch (e) {
      console.warn('Erro ao desfazer:', e);
    }
  };

  // Resetar Feed para rever recomendações
  const handleResetFeed = async () => {
    try {
      await api.resetFeed(currentUserId, targetTipo);
      setEvaluatedIds(new Set());
      await loadFeedData();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.warn('Erro ao resetar feed:', e);
    }
  };

  // Abrir Detalhes
  const handleOpenDetails = () => {
    if (!currentItem) return;
    if (isAluno) {
      setSelectedOpp(currentItem as Opportunity);
      setSelectedCand(null);
    } else {
      setSelectedCand(currentItem as Candidate);
      setSelectedOpp(null);
    }
    setModalVisible(true);
  };

  // Renderizador de cada item no Modo Lista
  const renderListItem = ({ item }: { item: any }) => {
    const isVaga = isAluno;
    return (
      <View style={styles.listCard}>
        <View style={styles.listCardHeader}>
          <Image
            source={{ uri: item.imagemUrl || (isVaga ? defaultOppImage : defaultCandImage) }}
            style={styles.listCardThumb}
          />
          <View style={styles.listCardInfo}>
            <View style={styles.listCardBadgeRow}>
              <View style={styles.listMatchBadge}>
                <View style={styles.matchDot} />
                <Text style={styles.listMatchBadgeText}>{item.matchScore || 95}% Match</Text>
              </View>
              <Text style={styles.listCardModality}>
                {isVaga ? item.modalidade : item.unidadeFatec}
              </Text>
            </View>

            <Text style={styles.listCardTitle} numberOfLines={2}>
              {isVaga ? item.cargo : (item.idade ? `${item.nome}, ${item.idade} anos` : item.nome)}
            </Text>

            <Text style={styles.listCardSubtitle} numberOfLines={1}>
              {isVaga ? (item.nomeFantasia || item.empresa) : item.curso}
            </Text>
          </View>
        </View>

        {/* Linha de Metadados: Bolsa / Semestre & Local */}
        <View style={styles.listMetaRow}>
          <View style={styles.listMetaBadge}>
            <Ionicons name={isVaga ? 'cash-outline' : 'time-outline'} size={13} color="#10B981" />
            <Text style={styles.listMetaBadgeText}>
              {isVaga ? item.bolsa : `${item.semestre || 'Ativo'} • ${item.disponibilidade || 'Disponível'}`}
            </Text>
          </View>
          <View style={styles.listMetaBadgeSecondary}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.listMetaBadgeSecondaryText} numberOfLines={1}>
              {isVaga ? item.localizacao : (item.unidadeFatec || 'Fatec Jales')}
            </Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.listTagsRow}>
          {(isVaga ? item.requisitos : item.competencias)?.slice(0, 3).map((tag: string, i: number) => (
            <View key={i} style={styles.listTagPill}>
              <Text style={styles.listTagPillText} numberOfLines={1}>{tag}</Text>
            </View>
          ))}
          {((isVaga ? item.requisitos : item.competencias)?.length || 0) > 3 && (
            <View style={styles.listTagMorePill}>
              <Text style={styles.listTagMoreText}>
                +{((isVaga ? item.requisitos : item.competencias)?.length || 0) - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Botões de Ação do Card da Lista */}
        <View style={styles.listActionsRow}>
          <TouchableOpacity
            style={styles.listSecondaryBtn}
            onPress={() => {
              if (isVaga) {
                setSelectedOpp(item as Opportunity);
                setSelectedCand(null);
              } else {
                setSelectedCand(item as Candidate);
                setSelectedOpp(null);
              }
              setModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={15} color={Colors.primary} />
            <Text style={styles.listSecondaryBtnText}>Ver Detalhes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.listPrimaryBtn}
            onPress={() => {
              if (isVaga) {
                if (onApplyToOpportunity) onApplyToOpportunity(item as Opportunity);
                else onStartChat(item.nomeFantasia || item.empresa, item.cargo);
              } else {
                onStartChat(item.nome, item.curso);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name={isVaga ? 'rocket-outline' : 'chatbubbles-outline'} size={15} color="#FFFFFF" />
            <Text style={styles.listPrimaryBtnText}>
              {isVaga ? 'Candidatar-se' : 'Conversar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* SELETOR DE MODO: MODO SWIPE (CARDS) OU MODO LISTA COMPLETA */}
      <View style={styles.viewModeBar}>
        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'swipe' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('swipe')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="albums-outline"
            size={15}
            color={viewMode === 'swipe' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'swipe' && styles.viewModeBtnTextActive]}>
            Modo Swipe (Cards)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
          onPress={() => setViewMode('list')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list-outline"
            size={15}
            color={viewMode === 'list' ? '#FFFFFF' : '#94A3B8'}
          />
          <Text style={[styles.viewModeBtnText, viewMode === 'list' && styles.viewModeBtnTextActive]}>
            {isAluno ? `Todas as Vagas (${allListItems.length})` : `Todos os Currículos (${allListItems.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO DINÂMICO CONFORME O MODO SELECIONADO */}
      {viewMode === 'list' ? (
        <FlatList
          data={allListItems}
          keyExtractor={(item) => String(item.id || item.dbId)}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || loadingFeed}
              onRefresh={async () => {
                await loadFeedData();
                if (onRefresh) await onRefresh();
              }}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.listEmptyBox}>
              <Ionicons name="search-outline" size={42} color="#64748B" />
              <Text style={styles.listEmptyTitle}>Nenhum resultado encontrado</Text>
              <Text style={styles.listEmptySub}>
                {searchQuery
                  ? `Nenhuma correspondência para "${searchQuery}". Tente outros termos.`
                  : isAluno
                  ? 'Nenhuma vaga cadastrada no momento.'
                  : 'Nenhum currículo cadastrado no momento.'}
              </Text>
            </View>
          }
        />
      ) : (
        /* MODO SWIPE (TIKTOK + TINDER CARDS) */
        (loadingDecisions || loadingFeed) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Carregando recomendações inteligentes...</Text>
          </View>
        ) : activeItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name={isAluno ? 'briefcase-outline' : 'people-outline'} size={44} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {isAluno ? 'Você avaliou todas as vagas no swipe!' : 'Você avaliou todos os talentos no swipe!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isAluno
                ? 'Você já deu like ou passou nas recomendações do feed. Deseja rever tudo ou explorar no formato de lista?'
                : 'Você já visualizou todos os alunos disponíveis no modo de cards. Deseja rever o feed ou ver a lista completa?'}
            </Text>
            <View style={styles.emptyButtonsCol}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetFeed} activeOpacity={0.85}>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.resetButtonText}>
                  {isAluno ? 'Rever Todas as Vagas no Feed' : 'Rever Todos os Alunos no Feed'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchToListBtn}
                onPress={() => setViewMode('list')}
                activeOpacity={0.85}
              >
                <Ionicons name="list" size={18} color={Colors.primary} />
                <Text style={styles.switchToListBtnText}>
                  {isAluno ? `Ver Todas as Vagas em Lista (${allListItems.length})` : `Ver Todos os Currículos em Lista (${allListItems.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.cardsArea}>
          {/* PRÓXIMO CARTÃO AO FUNDO (STACK EFFECT REACTBITS) */}
          {nextItem && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cardContainer,
                styles.nextCard,
                {
                  transform: [{ scale: nextCardScale }],
                },
              ]}
            >
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: nextImageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>
              <LinearGradient
                colors={['rgba(15,23,42,0.2)', 'rgba(15,23,42,0.65)', 'rgba(15,23,42,0.98)']}
                style={styles.gradientOverlay}
              />
            </Animated.View>
          )}

          {/* CARTÃO PRINCIPAL INTERATIVO (SWIPE FULL SCREEN TIKTOK + TINDER) */}
          {currentItem && (
            <Animated.View
              {...panResponder.panHandlers}
              style={[styles.cardContainer, styles.activeCard, animatedCardStyle]}
            >
              {/* Imagem de Fundo em Tela Cheia com fundo 100% opaco */}
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: currentImageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>

              {/* Gradiente Escuro de Contraste Profissional */}
              <LinearGradient
                colors={['rgba(15,23,42,0.2)', 'rgba(15,23,42,0.58)', 'rgba(15,23,42,0.98)']}
                style={styles.gradientOverlay}
              />

              {/* CARIMBOS DE SWIPE (STAMPS) */}
              <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                <Ionicons name="heart" size={26} color="#10B981" />
                <Text style={styles.likeStampText}>TENHO INTERESSE</Text>
              </Animated.View>

              <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
                <Ionicons name="close" size={26} color="#EF4444" />
                <Text style={styles.passStampText}>PASSAR</Text>
              </Animated.View>

              {/* OVERLAY SUPERIOR: BADGES & MATCH RATE */}
              <View style={styles.topBadgesRow}>
                {/* Match Score Real com indicador verde */}
                <View style={styles.matchPill}>
                  <View style={styles.matchDot} />
                  <Text style={styles.matchPillText}>{currentItem.matchScore || 95}% Match Real</Text>
                </View>

                {/* Modalidade / Turno */}
                <View style={styles.modalityPill}>
                  <Ionicons
                    name={isAluno ? 'business-outline' : 'school-outline'}
                    size={13}
                    color="#FFFFFF"
                  />
                  <Text style={styles.modalityPillText}>
                    {isAluno ? currentItem.modalidade : currentItem.unidadeFatec}
                  </Text>
                </View>
              </View>

              {/* CONTEÚDO PRINCIPAL SOBRE O GRADIENTE INFERIOR */}
              <View style={styles.contentOverlay}>
                {/* Título Principal & Empresa/Curso */}
                <View style={styles.titleSection}>
                  <View style={styles.verifiedRow}>
                    <Text style={styles.organizationText} numberOfLines={1}>
                      {isAluno ? currentItem.nomeFantasia || currentItem.empresa : currentItem.curso}
                    </Text>
                    <Ionicons name="checkmark-circle" size={17} color={Colors.primary} />
                  </View>

                  <Text style={styles.mainTitle} numberOfLines={2}>
                    {isAluno ? currentItem.cargo : (currentItem.idade ? `${currentItem.nome}, ${currentItem.idade} anos` : currentItem.nome)}
                  </Text>
                </View>

                {/* Métricas Rápidas: Bolsa & Localização */}
                <View style={styles.metaRow}>
                  {isAluno ? (
                    <View style={styles.bolsaBadge}>
                      <Ionicons name="cash-outline" size={14} color="#10B981" />
                      <Text style={styles.bolsaBadgeText}>{currentItem.bolsa}</Text>
                    </View>
                  ) : (
                    <View style={styles.bolsaBadge}>
                      <Ionicons name="time-outline" size={14} color="#10B981" />
                      <Text style={styles.bolsaBadgeText}>
                        {currentItem.semestre || 'Semestre ativo'} • {currentItem.disponibilidade || 'Disponível'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.locationBadge}>
                    <Ionicons name="location-outline" size={14} color="#CBD5E1" />
                    <Text style={styles.locationBadgeText} numberOfLines={1}>
                      {isAluno ? currentItem.localizacao : currentItem.unidadeFatec || 'Fatec Jales'}
                    </Text>
                  </View>
                </View>

                {/* Tags de Requisitos / Competências */}
                <View style={styles.tagsRow}>
                  {(isAluno ? currentItem.requisitos : currentItem.competencias)?.slice(0, 3).map((tag: string, i: number) => (
                    <View key={i} style={styles.tagPill}>
                      <Text style={styles.tagPillText} numberOfLines={1}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                  {((isAluno ? currentItem.requisitos : currentItem.competencias)?.length || 0) > 3 && (
                    <View style={styles.tagMorePill}>
                      <Text style={styles.tagMoreText}>
                        +{((isAluno ? currentItem.requisitos : currentItem.competencias)?.length || 0) - 3}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botão Ver Detalhes Expandido */}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={handleOpenDetails}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailsButtonText}>
                    {isAluno ? 'VER DETALHES DA VAGA' : 'VER PERFIL COMPLETO'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* BOTÕES FIXOS INFERIORES: ❌ (PASSAR), ↩️ (DESFAZER) E ❤️ (INTERESSE) */}
          <View style={styles.floatingActionRow}>
            {/* Botão X — Não Tenho Interesse */}
            <TouchableOpacity
              style={[styles.actionBtnCircle, styles.passBtnCircle]}
              onPress={() => executeDecision('pass')}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={30} color="#EF4444" />
            </TouchableOpacity>

            {/* Botão Central — Desfazer / Info */}
            <TouchableOpacity
              style={[styles.actionBtnCircle, styles.undoBtnCircle, !lastAction && { opacity: 0.4 }]}
              onPress={handleUndo}
              disabled={!lastAction}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-undo" size={20} color="#64748B" />
            </TouchableOpacity>

            {/* Botão Coração — Tenho Interesse */}
            <TouchableOpacity
              style={[styles.actionBtnCircle, styles.likeBtnCircle]}
              onPress={() => executeDecision('like')}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={32} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>
        )
      )}

      {/* Modal de Detalhes Completo */}
      <ModalDetails
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        opportunity={selectedOpp}
        candidate={selectedCand}
        onAction={() => {
          setModalVisible(false);
          if (isAluno && selectedOpp) {
            if (onApplyToOpportunity) {
              onApplyToOpportunity(selectedOpp);
            } else {
              onStartChat(selectedOpp.nomeFantasia, selectedOpp.cargo);
            }
          } else if (!isAluno && selectedCand) {
            onStartChat(selectedCand.nome, selectedCand.curso);
          }
        }}
        actionLabel={isAluno ? 'CANDIDATAR-SE AGORA 🚀' : 'INICIAR CONVERSA'}
      />

      {/* Modal Celebratório de Match Mútuo */}
      <Modal
        visible={!!mutualMatchInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setMutualMatchInfo(null)}
      >
        <View style={styles.matchModalOverlay}>
          <View style={styles.matchModalCard}>
            <View style={styles.matchModalIconCircle}>
              <Ionicons name="flame" size={44} color="#FFFFFF" />
            </View>
            <Text style={styles.matchModalTitle}>DEU MATCH! 🎉</Text>
            <Text style={styles.matchModalSubtitle}>
              Vocês demonstraram interesse mútuo! Ambos estão prontos para avançar no processo seletivo.
            </Text>
            <View style={styles.matchModalButtons}>
              <TouchableOpacity
                style={styles.matchModalPrimaryBtn}
                onPress={() => {
                  const info = mutualMatchInfo;
                  setMutualMatchInfo(null);
                  onStartChat(info?.empresaNome || info?.alunoNome || 'Contato FATEC', info?.cargo || 'Oportunidade');
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                <Text style={styles.matchModalPrimaryBtnText}>Conversar Agora</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.matchModalCloseBtn}
                onPress={() => setMutualMatchInfo(null)}
              >
                <Text style={styles.matchModalCloseBtnText}>Continuar Navegando</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  viewModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 20,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 11,
    gap: 6,
  },
  viewModeBtnActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  viewModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  viewModeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
  },
  cardsArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  cardContainer: {
    position: 'absolute',
    top: 6,
    height: '80%',
    maxHeight: 660,
    width: SCREEN_WIDTH > 540 ? 490 : '92%',
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  activeCard: {
    zIndex: 10,
    elevation: 10,
  },
  nextCard: {
    zIndex: 1,
    elevation: 1,
  },
  imageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  stamp: {
    position: 'absolute',
    top: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
    gap: 8,
    zIndex: 20,
  },
  likeStamp: {
    left: 24,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    transform: [{ rotate: '-12deg' }],
  },
  likeStampText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  passStamp: {
    right: 24,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    transform: [{ rotate: '12deg' }],
  },
  passStampText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topBadgesRow: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  matchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  matchPillText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  modalityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalityPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    zIndex: 10,
  },
  titleSection: {
    marginBottom: 10,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  organizationText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  bolsaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  bolsaBadgeText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  locationBadgeText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tagPillText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
  },
  tagMorePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagMoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: 22,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  floatingActionRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    zIndex: 30,
  },
  actionBtnCircle: {
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  passBtnCircle: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  undoBtnCircle: {
    width: 44,
    height: 44,
    backgroundColor: '#F1F5F9',
  },
  likeBtnCircle: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#0F172A',
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(177, 18, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyButtonsCol: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
    alignItems: 'center',
  },
  resetButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 24,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  switchToListBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  switchToListBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },

  // Estilos do Modo Lista Completa
  listContentContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 24,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  listCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  listCardThumb: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#0F172A',
  },
  listCardInfo: {
    flex: 1,
  },
  listCardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  listMatchBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  listCardModality: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  listCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 2,
  },
  listCardSubtitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  listMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  listMetaBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  listMetaBadgeSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  listMetaBadgeSecondaryText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  listTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  listTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listTagPillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  listTagMorePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  listTagMoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  listActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  listSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  listSecondaryBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  listPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  listPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  listEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  listEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  listEmptySub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  matchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  matchModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  matchModalIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  matchModalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  matchModalSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  matchModalButtons: {
    width: '100%',
    gap: 10,
  },
  matchModalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    height: 46,
    borderRadius: 23,
    gap: 8,
  },
  matchModalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  matchModalCloseBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  matchModalCloseBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
