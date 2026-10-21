import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { Opportunity, Candidate, UserRole, FeedFilterCriteria, SortOption } from '../types';
import { ModalDetails } from '../components/ModalDetails';
import { api } from '../services/api';
import { useFilterStore } from '../stores/filterStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 500);
const SWIPE_THRESHOLD = Math.min(CARD_WIDTH * 0.25, 110);

// Helper seguro para feedback tátil cross-platform
const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        if (type === 'success') {
          navigator.vibrate([40, 60, 80]);
        } else {
          navigator.vibrate(25);
        }
      }
      return;
    }
    if (type === 'light') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === 'heavy') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  } catch {
    // Silencioso em ambientes sem suporte
  }
};

// Componente de Avatar com Fallback Elegante de Iniciais
const EntityAvatar: React.FC<{
  uri?: string;
  name: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
}> = ({ uri, name, size = 42, borderColor = '#334155', borderWidth = 2 }) => {
  const [hasError, setHasError] = useState(false);
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  if (uri && !hasError) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor,
          backgroundColor: '#0F172A',
        }}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: Math.floor(size * 0.38), fontWeight: '800' }}>
        {initials}
      </Text>
    </View>
  );
};

interface ListScreenProps {
  role: UserRole;
  currentUserId?: number;
  currentUserName?: string;
  currentUserAvatar?: string;
  opportunities: Opportunity[];
  candidates: Candidate[];
  searchQuery: string;
  appliedFilters?: FeedFilterCriteria | null;
  onClearFilters?: () => void;
  onStartChat: (name: string, roleInfo: string, targetUserId?: number, vagaId?: number) => void;
  onApplyToOpportunity?: (opp: Opportunity) => void;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

export const ListScreen: React.FC<ListScreenProps> = ({
  role,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  opportunities,
  candidates,
  searchQuery,
  appliedFilters,
  onClearFilters,
  onStartChat,
  onApplyToOpportunity,
  onRefresh,
  refreshing = false,
}) => {
  const isAluno = role === 'aluno';
  const targetTipo: 'vaga' | 'candidato' = isAluno ? 'vaga' : 'candidato';

  // Dimensões dinâmicas da tela e responsividade cross-device
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [cardsAreaHeight, setCardsAreaHeight] = useState<number>(0);

  const isSmallScreen = windowWidth < 380;
  const isCompactHeight = windowHeight < 760;
  const dynamicCardWidth = Math.min(windowWidth * 0.93, 490);
  const dynamicThreshold = Math.min(dynamicCardWidth * 0.25, 95);

  const calculatedCardHeight = cardsAreaHeight > 0
    ? Math.min(Math.max(cardsAreaHeight - 62, 300), 570)
    : Math.min(Math.max(windowHeight - 330, 300), 570);

  // Store de filtros persistentes e contagens
  const {
    studentFilters,
    companyFilters,
    resetStudentFilters,
    resetCompanyFilters,
    removeFilterKey,
    setSortBy,
    getActiveFiltersCount,
  } = useFilterStore();

  const currentFilters = isAluno ? studentFilters : companyFilters;
  const currentSort = currentFilters.sortBy || 'relevancia';

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

  // Busca dados diretamente do backend com filtros aplicados
  const loadFeedData = async () => {
    setLoadingFeed(true);
    try {
      const activeF = isAluno ? useFilterStore.getState().studentFilters : useFilterStore.getState().companyFilters;
      if (isAluno) {
        const opps = await api.getOpportunities(currentUserId, activeF);
        if (Array.isArray(opps)) setFeedItems(opps);
      } else {
        const cands = await api.getCandidates(activeF);
        if (Array.isArray(cands)) setFeedItems(cands);
      }
    } catch (e) {
      console.warn('Erro ao carregar feed no ListScreen:', e);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Carregar decisões anteriores do PostgreSQL para não repetir cartões
  const loadDecisions = async () => {
    if (!currentUserId) {
      setLoadingDecisions(false);
      return;
    }
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
  }, [currentUserId, targetTipo, role, studentFilters, companyFilters]);

  // Sincroniza se os props do pai mudarem
  useEffect(() => {
    const propList = isAluno ? opportunities : candidates;
    if (Array.isArray(propList)) {
      setFeedItems(propList);
    }
  }, [opportunities, candidates, isAluno]);

  // Filtro de critérios adicionais combináveis
  const matchesAppliedFilters = (item: any) => {
    if (!item) return false;
    const filters = currentFilters;

    if (isAluno) {
      const opp = item as Opportunity;
      // 1. Curso
      if (filters.curso && filters.curso !== 'Todos os Cursos') {
        const cNorm = filters.curso.toLowerCase();
        const related = (opp.cursoRelacionado || '').toLowerCase();
        const area = (opp.area || '').toLowerCase();
        const cargo = (opp.cargo || '').toLowerCase();
        const isAds = cNorm.includes('análise') || cNorm.includes('ads');
        const isDsm = cNorm.includes('multiplataforma') || cNorm.includes('dsm');
        const isGti = cNorm.includes('gestão da ti') || cNorm.includes('gti');

        const match =
          related.includes(cNorm) ||
          area.includes(cNorm) ||
          cargo.includes(cNorm) ||
          (isAds && (cargo.includes('software') || cargo.includes('dev') || cargo.includes('full') || cargo.includes('front') || cargo.includes('back') || area.includes('ti') || area.includes('software'))) ||
          (isDsm && (cargo.includes('multiplataforma') || cargo.includes('mobile') || cargo.includes('react') || cargo.includes('web') || area.includes('mobile'))) ||
          (isGti && (cargo.includes('gestão') || cargo.includes('suporte') || cargo.includes('redes') || area.includes('infra') || area.includes('ti')));
        if (!match) return false;
      }

      // 2. Área Profissional
      if (filters.area && filters.area !== 'Todas as Áreas') {
        const aNorm = filters.area.toLowerCase();
        const oppArea = (opp.area || '').toLowerCase();
        const oppCargo = (opp.cargo || '').toLowerCase();
        if (!oppArea.includes(aNorm) && !oppCargo.includes(aNorm) && !aNorm.includes(oppArea)) {
          return false;
        }
      }

      // 3. Modalidade
      if (filters.modalidade && filters.modalidade !== 'Todas') {
        if (opp.modalidade?.toLowerCase() !== filters.modalidade.toLowerCase()) {
          return false;
        }
      }

      // 4. Tipo de contratação
      if (filters.tipo && filters.tipo !== 'Todos') {
        if (opp.tipo?.toLowerCase() !== filters.tipo.toLowerCase()) {
          return false;
        }
      }

      // 5. Localização
      if (filters.localizacao && filters.localizacao !== 'Todas') {
        const locNorm = filters.localizacao.toLowerCase();
        const oppLoc = (opp.localizacao || '').toLowerCase();
        if (!oppLoc.includes(locNorm)) {
          return false;
        }
      }

      // 6. Faixa Salarial / Bolsa Mínima
      if (filters.minBolsa && filters.minBolsa > 0) {
        const clean = String(opp.bolsa || '').split(',')[0].replace(/[^\d]/g, '');
        const val = parseInt(clean, 10);
        if (isNaN(val) || val < filters.minBolsa) {
          return false;
        }
      }

      // 7. Compatibilidade Mínima (Match Score)
      if (filters.minMatch && filters.minMatch > 0) {
        if ((opp.matchScore || 0) < filters.minMatch) {
          return false;
        }
      }

      // 8. Competências
      if (filters.competencias && filters.competencias.length > 0) {
        const skillsNorm = filters.competencias.map((s) => s.toLowerCase());
        const oppSkills = (opp.requisitos || []).map((r) => r.toLowerCase());
        const oppDesc = (opp.descricao || '').toLowerCase();
        const hasSkill = skillsNorm.some((skill) =>
          oppSkills.some((r) => r.includes(skill) || skill.includes(r)) || oppDesc.includes(skill)
        );
        if (!hasSkill) return false;
      }
    } else {
      const cand = item as Candidate;

      // 1. Curso FATEC
      if (filters.curso && filters.curso !== 'Todos os Cursos') {
        const cNorm = filters.curso.toLowerCase();
        const candCurso = (cand.curso || '').toLowerCase();
        if (!candCurso.includes(cNorm) && !cNorm.includes(candCurso)) {
          return false;
        }
      }

      // 2. Unidade FATEC
      if (filters.unidadeFatec && filters.unidadeFatec !== 'Todas as Unidades') {
        const uNorm = filters.unidadeFatec.toLowerCase();
        const candU = (cand.unidadeFatec || '').toLowerCase();
        if (!candU.includes(uNorm) && !uNorm.includes(candU)) {
          return false;
        }
      }

      // 3. Semestre
      if (filters.semestre && filters.semestre !== 'Todos os Semestres') {
        const numFilter = (filters.semestre.match(/\d+/) || [])[0];
        const numCand = (cand.semestre?.match(/\d+/) || [])[0];
        if (numFilter && numCand && numFilter !== numCand) {
          return false;
        }
      }

      // 4. Disponibilidade de Horário
      if (filters.disponibilidade && filters.disponibilidade !== 'Todas') {
        const dNorm = filters.disponibilidade.toLowerCase();
        const candD = (cand.disponibilidade || '').toLowerCase();
        if (!candD.includes(dNorm)) {
          return false;
        }
      }

      // 5. Compatibilidade Mínima
      if (filters.minMatch && filters.minMatch > 0) {
        if ((cand.matchScore || 0) < filters.minMatch) {
          return false;
        }
      }

      // 6. Competências Técnicas
      if (filters.competencias && filters.competencias.length > 0) {
        const skillsNorm = filters.competencias.map((s) => s.toLowerCase());
        const candSkills = (cand.competencias || []).map((c) => c.toLowerCase());
        const sobre = (cand.sobre || '').toLowerCase();
        const hasSkill = skillsNorm.some((skill) =>
          candSkills.some((c) => c.includes(skill) || skill.includes(c)) || sobre.includes(skill)
        );
        if (!hasSkill) return false;
      }
    }
    return true;
  };

  // Ordenação inteligente com base no critério selecionado
  const sortFeedItems = (items: any[]) => {
    const list = [...items];
    const sortBy = currentSort;

    if (sortBy === 'recente') {
      list.sort((a, b) => {
        const timeA = new Date(a.criadoEm || 0).getTime() || a.dbId || 0;
        const timeB = new Date(b.criadoEm || 0).getTime() || b.dbId || 0;
        return timeB - timeA;
      });
    } else if (sortBy === 'maior_bolsa' && isAluno) {
      const getBolsa = (item: any) => {
        const clean = String(item.bolsa || '').split(',')[0].replace(/[^\d]/g, '');
        const val = parseInt(clean, 10);
        return isNaN(val) ? 0 : val;
      };
      list.sort((a, b) => getBolsa(b) - getBolsa(a));
    } else if (sortBy === 'semestre' && !isAluno) {
      const getSem = (item: any) => {
        const m = String(item.semestre || '').match(/\d+/);
        return m ? parseInt(m[0], 10) : 0;
      };
      list.sort((a, b) => getSem(b) - getSem(a));
    } else {
      // Relevância (default): ordenar por matchScore decrescente
      list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return list;
  };

  // Lista de itens filtrada por busca e excluindo itens já avaliados (para Modo Swipe)
  const filteredActiveItems = feedItems.filter((item: any) => {
    if (!item) return false;
    const numericId = item.dbId || parseInt(String(item.id).replace('opp-', '').replace('cand-', ''), 10);
    if (evaluatedIds.has(numericId)) return false;

    if (!matchesAppliedFilters(item)) return false;

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
  const filteredAllListItems = feedItems.filter((item: any) => {
    if (!item) return false;
    if (!matchesAppliedFilters(item)) return false;
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

  const activeItems = useMemo(() => sortFeedItems(filteredActiveItems), [filteredActiveItems, currentSort]);
  const allListItems = useMemo(() => sortFeedItems(filteredAllListItems), [filteredAllListItems, currentSort]);

  // Lista de chips ativos para exibição e remoção rápida individual
  const activeChips = useMemo(() => {
    const chips: { key: keyof FeedFilterCriteria; label: string; subKey?: string }[] = [];
    const f = currentFilters;

    if (f.curso && f.curso !== 'Todos os Cursos') {
      chips.push({ key: 'curso', label: `Curso: ${f.curso.length > 18 ? f.curso.slice(0, 16) + '...' : f.curso}` });
    }
    if (f.area && f.area !== 'Todas as Áreas') {
      chips.push({ key: 'area', label: `Área: ${f.area}` });
    }
    if (f.modalidade && f.modalidade !== 'Todas') {
      chips.push({ key: 'modalidade', label: `Mod: ${f.modalidade}` });
    }
    if (f.tipo && f.tipo !== 'Todos') {
      chips.push({ key: 'tipo', label: `Tipo: ${f.tipo}` });
    }
    if (f.localizacao && f.localizacao !== 'Todas') {
      chips.push({ key: 'localizacao', label: `Local: ${f.localizacao}` });
    }
    if (f.minBolsa && f.minBolsa > 0) {
      chips.push({ key: 'minBolsa', label: `Bolsa ≥ R$ ${f.minBolsa}` });
    }
    if (f.minMatch && f.minMatch > 0) {
      chips.push({ key: 'minMatch', label: `Match ≥ ${f.minMatch}%` });
    }
    if (f.unidadeFatec && f.unidadeFatec !== 'Todas as Unidades') {
      chips.push({ key: 'unidadeFatec', label: `Unidade: ${f.unidadeFatec}` });
    }
    if (f.semestre && f.semestre !== 'Todos os Semestres') {
      chips.push({ key: 'semestre', label: `Sem: ${f.semestre}` });
    }
    if (f.disponibilidade && f.disponibilidade !== 'Todas') {
      chips.push({ key: 'disponibilidade', label: `Disp: ${f.disponibilidade}` });
    }
    if (f.competencias && f.competencias.length > 0) {
      f.competencias.forEach((skill) => {
        chips.push({ key: 'competencias', label: skill, subKey: skill });
      });
    }

    return chips;
  }, [currentFilters]);

  // Remoção de um chip específico
  const handleRemoveChip = (key: keyof FeedFilterCriteria, subKey?: string) => {
    removeFilterKey(role, key, subKey);
  };

  // Limpeza de todos os filtros
  const handleClearAll = () => {
    if (isAluno) {
      resetStudentFilters();
    } else {
      resetCompanyFilters();
    }
    if (onClearFilters) onClearFilters();
  };

  // Seleção de ordenação rápida
  const handleSelectSort = (sortId: SortOption) => {
    setSortBy(role, sortId);
  };

  const sortOptions: { id: SortOption; label: string; icon: string }[] = isAluno
    ? [
        { id: 'relevancia', label: 'Mais Compatíveis', icon: 'sparkles' },
        { id: 'recente', label: 'Mais Recentes', icon: 'time-outline' },
        { id: 'maior_bolsa', label: 'Maior Bolsa', icon: 'cash-outline' },
      ]
    : [
        { id: 'relevancia', label: 'Mais Compatíveis', icon: 'sparkles' },
        { id: 'recente', label: 'Mais Recentes', icon: 'time-outline' },
        { id: 'semestre', label: 'Semestre Avançado', icon: 'school-outline' },
      ];

  const defaultOppImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80';
  const defaultCandImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  const currentItem: any = activeItems[0] || null;
  const nextItem: any = activeItems[1] || null;

  const currentImageUrl = currentItem?.imagemUrl || (isAluno ? defaultOppImage : defaultCandImage);
  const nextImageUrl = nextItem?.imagemUrl || (isAluno ? defaultOppImage : defaultCandImage);

  // Interpolações de Física e Rotação responsivas ao viewport
  const rotate = pan.x.interpolate({
    inputRange: [-windowWidth * 1.5, 0, windowWidth * 1.5],
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

  // Feedback de Conexão (Direita - Esmeralda)
  const likeOpacity = pan.x.interpolate({
    inputRange: [15, dynamicThreshold * 0.8],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Feedback de Avanço (Esquerda - Ardósia)
  const passOpacity = pan.x.interpolate({
    inputRange: [-dynamicThreshold * 0.8, -15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Próximo cartão ao fundo (Stack Effect ReactBits)
  const nextCardScale = pan.x.interpolate({
    inputRange: [-windowWidth, 0, windowWidth],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  // Gestor de Arraste (PanResponder otimizado para Web, iOS e Android)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (modalVisible || isAnimating.current) return false;
        return Math.abs(gesture.dx) > 6;
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        if (modalVisible || isAnimating.current) return false;
        return Math.abs(gesture.dx) > 6;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        if (isAnimating.current || modalVisible) return;
        pan.setValue({ x: gesture.dx, y: gesture.dy * 0.25 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (isAnimating.current || modalVisible) return;

        if (gesture.dx > dynamicThreshold || gesture.vx > 0.45) {
          executeDecision('like');
        } else if (gesture.dx < -dynamicThreshold || gesture.vx < -0.45) {
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
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          tension: 40,
          useNativeDriver: false,
        }).start();
        isAnimating.current = false;
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

  // Executar Decisão com Animação Fluida, Feedback Tátil e Persistência no PostgreSQL
  const executeDecision = (decisao: 'like' | 'pass') => {
    if (isAnimating.current || !currentItem) return;
    isAnimating.current = true;
    triggerHaptic(decisao === 'like' ? 'medium' : 'light');

    const targetX = decisao === 'like' ? windowWidth * 1.4 : -windowWidth * 1.4;
    const targetY = 30;

    const targetNumericId = currentItem.dbId || parseInt(String(currentItem.id).replace('opp-', '').replace('cand-', ''), 10);

    const safetyTimer = setTimeout(() => {
      isAnimating.current = false;
    }, 450);

    Animated.timing(pan, {
      toValue: { x: targetX, y: targetY },
      duration: 260,
      useNativeDriver: false,
    }).start(async () => {
      clearTimeout(safetyTimer);
      pan.setValue({ x: 0, y: 0 });
      isAnimating.current = false;

      // Gravar no PostgreSQL
      if (currentUserId) {
        try {
          const res = await api.sendFeedDecision(
            currentUserId,
            role,
            targetNumericId,
            targetTipo,
            decisao
          );

          if (res.isMutualMatch) {
            triggerHaptic('success');
            const oppItem = isAluno ? currentItem : null;
            const candItem = !isAluno ? currentItem : null;

            const studentName =
              res.matchInfo?.alunoNome ||
              (isAluno ? (currentUserName || 'Você') : (candItem?.nome || 'Estudante FATEC'));
            const studentAvatar = isAluno ? currentUserAvatar : candItem?.imagemUrl;
            const companyName =
              res.matchInfo?.empresaNome ||
              (isAluno
                ? (oppItem?.nomeFantasia || oppItem?.empresa || 'Empresa')
                : (currentUserName || 'Sua Empresa'));
            const companyAvatar = isAluno ? oppItem?.imagemUrl : currentUserAvatar;
            const cargoTitle =
              res.matchInfo?.cargo || (isAluno ? oppItem?.cargo : (candItem?.curso || 'Oportunidade'));

            setMutualMatchInfo({
              alunoNome: studentName,
              alunoImagem: studentAvatar,
              empresaNome: companyName,
              empresaImagem: companyAvatar,
              cargo: cargoTitle,
              empresaId: isAluno ? oppItem?.empresaId : currentUserId,
              alunoId: isAluno ? currentUserId : candItem?.usuarioId,
              vagaId: oppItem ? (oppItem.dbId || parseInt(String(oppItem.id).replace('opp-', ''), 10)) : undefined,
              matchScore: currentItem?.matchScore || 95,
            });
          }
        } catch (err) {
          console.warn('Erro ao salvar decisão no banco:', err);
        }
      }

      setLastAction({ id: targetNumericId, decisao });
      setEvaluatedIds((prev) => new Set(prev).add(targetNumericId));
    });
  };

  // Desfazer última decisão (Undo)
  const handleUndo = async () => {
    if (!lastAction || isAnimating.current || !currentUserId) return;
    triggerHaptic('light');
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
    if (!currentUserId) return;
    triggerHaptic('medium');
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
                const opp = item as Opportunity;
                if (onApplyToOpportunity) onApplyToOpportunity(opp);
                else {
                  const vagaDbId = opp.dbId || parseInt(String(opp.id || '').replace('opp-', ''), 10);
                  onStartChat(opp.nomeFantasia || opp.empresa, opp.cargo, opp.empresaId, isNaN(vagaDbId) ? undefined : vagaDbId);
                }
              } else {
                const cand = item as Candidate;
                onStartChat(cand.nome, cand.curso, cand.usuarioId, undefined);
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

      {/* Barra de Ordenação Rápida Integrada */}
      <View style={styles.sortBar}>
        <Ionicons name="swap-vertical" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
        <Text style={styles.sortBarLabel}>Ordenar:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScrollContent}>
          {sortOptions.map((opt) => {
            const isSelected = currentSort === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sortPill, isSelected && styles.sortPillActive]}
                onPress={() => handleSelectSort(opt.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={12}
                  color={isSelected ? '#FFFFFF' : '#94A3B8'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.sortPillText, isSelected && styles.sortPillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Indicadores de Filtros Ativos com Contagem e Chips Removíveis */}
      {activeChips.length > 0 && (
        <View style={styles.activeFiltersSection}>
          <View style={styles.activeFiltersHeaderRow}>
            <View style={styles.activeCountBadgeRow}>
              <Ionicons name="filter" size={13} color={Colors.primary} />
              <Text style={styles.activeFiltersHeaderCount}>
                {activeChips.length} {activeChips.length === 1 ? 'filtro ativo' : 'filtros ativos'}
              </Text>
              <Text style={styles.activeResultCountDot}>•</Text>
              <Text style={styles.activeResultCountText}>
                {allListItems.length} {isAluno ? (allListItems.length === 1 ? 'vaga' : 'vagas') : (allListItems.length === 1 ? 'candidato' : 'candidatos')}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={12} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.clearAllBtnText}>Limpar Filtros</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeChipsScrollContent}
          >
            {activeChips.map((chip, index) => (
              <View key={`${chip.key}-${chip.subKey || index}`} style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText} numberOfLines={1}>
                  {chip.label}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveChip(chip.key, chip.subKey)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.activeFilterChipClose}
                >
                  <Ionicons name="close-circle" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CONTEÚDO DINÂMICO CONFORME O MODO SELECIONADO */}
      {viewMode === 'list' ? (
        <FlatList
          data={allListItems}
          keyExtractor={(item) => String(item.id || item.dbId)}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS !== 'web'}
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
              <View style={styles.emptyFilterCircle}>
                <Ionicons
                  name={activeChips.length > 0 ? 'filter-outline' : 'search-outline'}
                  size={36}
                  color={activeChips.length > 0 ? Colors.primary : '#64748B'}
                />
              </View>
              <Text style={styles.listEmptyTitle}>
                {activeChips.length > 0
                  ? 'Nenhum resultado com estes filtros'
                  : 'Nenhum resultado encontrado'}
              </Text>
              <Text style={styles.listEmptySub}>
                {activeChips.length > 0
                  ? `Nenhum${isAluno ? 'a vaga' : ' candidato'} atende a todos os ${activeChips.length} critérios selecionados.`
                  : searchQuery
                  ? `Nenhuma correspondência para "${searchQuery}". Tente outros termos.`
                  : isAluno
                  ? 'Nenhuma vaga cadastrada no momento.'
                  : 'Nenhum currículo cadastrado no momento.'}
              </Text>
              {activeChips.length > 0 && (
                <TouchableOpacity style={styles.clearFiltersBtn} onPress={handleClearAll} activeOpacity={0.8}>
                  <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.clearFiltersBtnText}>
                    Limpar Filtros e Ver Todas ({feedItems.length})
                  </Text>
                </TouchableOpacity>
              )}
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
              <Ionicons
                name={activeChips.length > 0 ? 'filter-outline' : isAluno ? 'briefcase-outline' : 'people-outline'}
                size={42}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeChips.length > 0
                ? 'Nenhum card com os filtros atuais'
                : isAluno
                ? 'Você avaliou todas as vagas no swipe!'
                : 'Você avaliou todos os talentos no swipe!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeChips.length > 0
                ? `Não há cards correspondentes aos ${activeChips.length} filtros ativos (ou todos já foram avaliados).`
                : isAluno
                ? 'Você já deu like ou passou nas recomendações do feed. Deseja rever tudo ou explorar no formato de lista?'
                : 'Você já visualizou todos os alunos disponíveis no modo de cards. Deseja rever o feed ou ver a lista completa?'}
            </Text>
            <View style={styles.emptyButtonsCol}>
              {activeChips.length > 0 ? (
                <TouchableOpacity style={styles.resetButton} onPress={handleClearAll} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>
                    Limpar Filtros e Ver Todos ({feedItems.length})
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resetButton} onPress={handleResetFeed} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={18} color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>
                    {isAluno ? 'Rever Todas as Vagas no Feed' : 'Rever Todos os Alunos no Feed'}
                  </Text>
                </TouchableOpacity>
              )}

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
          <View
            style={styles.cardsArea}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0 && Math.abs(h - cardsAreaHeight) > 2) {
                setCardsAreaHeight(h);
              }
            }}
          >
          {/* PRÓXIMO CARTÃO AO FUNDO (STACK EFFECT EDITORIAL TECH) */}
          {nextItem && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.cardContainer,
                styles.nextCard,
                {
                  height: calculatedCardHeight,
                  width: dynamicCardWidth,
                  transform: [{ scale: nextCardScale }],
                },
              ]}
            >
              <View
                style={[
                  styles.showcaseBannerContainer,
                  { height: calculatedCardHeight < 420 ? 105 : 135 },
                ]}
                pointerEvents="none"
              >
                <Image
                  source={{ uri: nextImageUrl }}
                  style={styles.showcaseImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(11,17,30,0.3)', 'rgba(19,29,49,0.85)', '#131D31']}
                  style={styles.showcaseGradient}
                />
              </View>
            </Animated.View>
          )}

          {/* CARTÃO PRINCIPAL INTERATIVO (CARD EDITORIAL TECH FATEC) */}
          {currentItem && (
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.cardContainer,
                styles.activeCard,
                {
                  height: calculatedCardHeight,
                  width: dynamicCardWidth,
                },
                animatedCardStyle,
              ]}
            >
              {/* 1. TOPO: BANNER VISUAL SHOWCASE COM FUSÃO GRADIENTE */}
              <View
                style={[
                  styles.showcaseBannerContainer,
                  { height: calculatedCardHeight < 420 ? 105 : 135 },
                ]}
                pointerEvents="none"
              >
                <Image
                  source={{ uri: currentImageUrl }}
                  style={styles.showcaseImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(11,17,30,0.15)', 'rgba(19,29,49,0.65)', '#131D31']}
                  style={styles.showcaseGradient}
                />
              </View>

              {/* 2. RIBBON INSTITUCIONAL SUPERIOR: INSÍGNIA CPS & MEDIDOR DE AFINIDADE FATEC */}
              <View style={styles.topCredentialRibbon} pointerEvents="none">
                {/* Micro-insígnia FATEC / CPS */}
                <View style={styles.institutionBadge}>
                  <View style={styles.institutionDot} />
                  <Text style={styles.institutionBadgeText}>
                    {isAluno ? 'CPS • VAGA VERIFICADA' : (currentItem.unidadeFatec || 'CPS • FATEC JALES')}
                  </Text>
                </View>

                {/* Afinidade Curricular FATEC */}
                <View style={styles.affinityPill}>
                  <Ionicons name="sparkles" size={12} color="#10B981" />
                  <Text style={styles.affinityPillText}>{currentItem.matchScore || 95}% Afinidade</Text>
                </View>
              </View>

              {/* 3. AURA DE DECISÃO DIRECIIONAL (SUBSTITUI OS CARIMBOS GENÉRICOS) */}
              <Animated.View
                pointerEvents="none"
                style={[styles.decisionAuraBar, styles.decisionAuraConnect, { opacity: likeOpacity }]}
              >
                <View style={styles.decisionIconCircleConnect}>
                  <Ionicons name="git-network" size={15} color="#10B981" />
                </View>
                <Text style={styles.decisionAuraTextConnect}>
                  {isAluno ? '✦ CONECTAR OPORTUNIDADE' : '✦ CONECTAR TALENTO'}
                </Text>
              </Animated.View>

              <Animated.View
                pointerEvents="none"
                style={[styles.decisionAuraBar, styles.decisionAuraPass, { opacity: passOpacity }]}
              >
                <View style={styles.decisionIconCirclePass}>
                  <Ionicons name="arrow-forward" size={15} color="#94A3B8" />
                </View>
                <Text style={styles.decisionAuraTextPass}>AVANÇAR PRÓXIMO</Text>
              </Animated.View>

              {/* 4. CORPO EDITORIAL DO CARD */}
              <View style={styles.cardEditorialBody}>
                {/* Identidade: Avatar com borda nobre + Organização / Estudante */}
                <View style={[styles.identityHeaderRow, calculatedCardHeight < 420 && { marginTop: -18, marginBottom: 2 }]}>
                  <EntityAvatar
                    uri={currentItem.imagemUrl}
                    name={isAluno ? (currentItem.nomeFantasia || currentItem.empresa || 'Empresa') : (currentItem.nome || 'Estudante')}
                    size={calculatedCardHeight < 420 ? 38 : 44}
                    borderColor={isAluno ? '#38BDF8' : '#10B981'}
                    borderWidth={2}
                  />
                  <View style={styles.identityTextCol}>
                    <View style={styles.verifiedRow}>
                      <Text style={[styles.identityOrgText, calculatedCardHeight < 420 && { fontSize: 13.5 }]} numberOfLines={1}>
                        {isAluno
                          ? (currentItem.nomeFantasia || currentItem.empresa)
                          : (currentItem.idade ? `${currentItem.nome}, ${currentItem.idade} anos` : currentItem.nome)}
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color={isAluno ? Colors.primary : '#10B981'}
                      />
                    </View>
                    <Text style={[styles.identityTrackText, calculatedCardHeight < 420 && { fontSize: 11 }]} numberOfLines={1}>
                      {isAluno
                        ? (currentItem.area || currentItem.cursoRelacionado || 'Tecnologia da Informação')
                        : (currentItem.curso || 'Fatec Jales')}
                    </Text>
                  </View>
                </View>

                {/* Título Principal: Cargo ou Curso / Especialidade */}
                <Text style={[styles.cardMainTitle, calculatedCardHeight < 420 && { fontSize: 15.5, lineHeight: 19, marginBottom: 4 }]} numberOfLines={2}>
                  {isAluno ? currentItem.cargo : (currentItem.unidadeFatec ? `${currentItem.curso} • ${currentItem.unidadeFatec}` : currentItem.curso)}
                </Text>

                {/* TRÍADE DE RELEVÂNCIA (3 MICRO-BADGES ESTRUTURADOS) */}
                <View style={[styles.relevanceTriadRow, calculatedCardHeight < 420 && { marginBottom: 4 }]}>
                  {/* Micro-badge 1: Remuneração / Bolsa / Horário */}
                  <View style={styles.triadPillEmerald}>
                    <Ionicons name={isAluno ? 'cash-outline' : 'time-outline'} size={12} color="#10B981" />
                    <Text style={styles.triadPillEmeraldText} numberOfLines={1}>
                      {isAluno ? (currentItem.bolsa || 'A combinar') : `${currentItem.semestre || 'Ativo'} • ${currentItem.disponibilidade || 'Disponível'}`}
                    </Text>
                  </View>

                  {/* Micro-badge 2: Polo / Localização */}
                  <View style={styles.triadPillSlate}>
                    <Ionicons name="location-outline" size={12} color="#CBD5E1" />
                    <Text style={[styles.triadPillSlateText, isSmallScreen && { maxWidth: 120 }]} numberOfLines={1}>
                      {isAluno ? (currentItem.localizacao || 'Fatec Jales') : (currentItem.unidadeFatec || currentItem.localizacao || 'Fatec Jales')}
                    </Text>
                  </View>

                  {/* Micro-badge 3: Regime / Modalidade */}
                  <View style={styles.triadPillCyan}>
                    <Ionicons name={isAluno ? 'briefcase-outline' : 'laptop-outline'} size={12} color="#38BDF8" />
                    <Text style={styles.triadPillCyanText} numberOfLines={1}>
                      {isAluno ? (currentItem.modalidade || currentItem.tipo || 'Presencial') : (currentItem.modalidadeDesejada || 'Presencial / Híbrido')}
                    </Text>
                  </View>
                </View>

                {/* DESTAQUE DE PROJETO / DESAFIO TÉCNICO */}
                {!isAluno && currentItem.projetos && currentItem.projetos.length > 0 ? (
                  <View style={[styles.projectSpotlightBox, calculatedCardHeight < 420 && { paddingVertical: 2.5, marginBottom: 4 }]}>
                    <Ionicons name="rocket-outline" size={11} color="#F59E0B" />
                    <Text style={styles.projectSpotlightLabel}>Portfólio:</Text>
                    <Text style={styles.projectSpotlightTitle} numberOfLines={1}>
                      {currentItem.projetos[0].titulo}
                      {currentItem.projetos[0].tecnologias?.length ? ` (${currentItem.projetos[0].tecnologias.slice(0, 2).join(', ')})` : ''}
                    </Text>
                  </View>
                ) : isAluno && currentItem.area ? (
                  <View style={[styles.projectSpotlightBox, calculatedCardHeight < 420 && { paddingVertical: 2.5, marginBottom: 4 }]}>
                    <Ionicons name="flash-outline" size={11} color="#38BDF8" />
                    <Text style={[styles.projectSpotlightLabel, { color: '#38BDF8' }]}>Desafio:</Text>
                    <Text style={styles.projectSpotlightTitle} numberOfLines={1}>
                      {currentItem.area} • Inovação e Desenvolvimento
                    </Text>
                  </View>
                ) : null}

                {/* SÍNTESE CURRICULAR / RESUMO */}
                <Text style={[styles.summaryExcerpt, calculatedCardHeight < 420 && { fontSize: 11, lineHeight: 15, marginBottom: 4 }]} numberOfLines={2}>
                  {isAluno
                    ? (currentItem.descricao || 'Oportunidade conectada aos cursos de tecnologia da Fatec.')
                    : (currentItem.sobre || 'Estudante da Fatec focado em desenvolvimento prático e novos desafios.')}
                </Text>

                {/* DNA TECNOLÓGICO (TAGS COM PONTOS DE PRECISÃO) */}
                <View style={[styles.techDnaRow, calculatedCardHeight < 420 && { marginBottom: 5 }]}>
                  {(isAluno ? currentItem.requisitos : currentItem.competencias)?.slice(0, 3).map((tag: string, i: number) => (
                    <View key={i} style={styles.techDnaPill}>
                      <View style={styles.techDnaDot} />
                      <Text style={[styles.techDnaPillText, isSmallScreen && { maxWidth: 130 }]} numberOfLines={1}>{tag}</Text>
                    </View>
                  ))}
                  {((isAluno ? currentItem.requisitos : currentItem.competencias)?.length || 0) > 3 && (
                    <View style={styles.techDnaMorePill}>
                      <Text style={styles.techDnaMoreText}>
                        +{((isAluno ? currentItem.requisitos : currentItem.competencias)?.length || 0) - 3}
                      </Text>
                    </View>
                  )}
                </View>

                {/* AFFORDANCE DE DOSSIÊ / DETALHES COMPACTO */}
                <TouchableOpacity
                  style={styles.cardDetailHintRow}
                  onPress={handleOpenDetails}
                  activeOpacity={0.7}
                >
                  <Ionicons name="document-text-outline" size={12} color="#38BDF8" />
                  <Text style={styles.cardDetailHintText} numberOfLines={1}>
                    {isAluno ? 'Toque no Dossiê para requisitos completos' : 'Toque no Dossiê para competências e projetos'}
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color="#38BDF8" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* FATELINK ACTION DOCK — CÁPSULA UNIFICADA DE DECISÃO PROFISSIONAL */}
          <View
            style={[
              styles.fatelinkDockContainer,
              { top: calculatedCardHeight + 8 },
            ]}
          >
            <View style={[styles.fatelinkDock, isSmallScreen && styles.fatelinkDockCompact]}>
              {/* 1. Pular / Próximo */}
              <TouchableOpacity
                style={[styles.dockActionBtn, isSmallScreen && styles.dockActionBtnCompact]}
                onPress={() => executeDecision('pass')}
                activeOpacity={0.75}
                accessibilityLabel="Avançar para o próximo"
              >
                <View style={styles.dockIconBoxPass}>
                  <Ionicons name="close" size={isSmallScreen ? 17 : 19} color="#EF4444" />
                </View>
                {!isSmallScreen && <Text style={styles.dockLabelPass}>Pular</Text>}
              </TouchableOpacity>

              {/* 2. Desfazer (Undo) */}
              <TouchableOpacity
                style={[styles.dockMiniBtn, !lastAction && { opacity: 0.25 }]}
                onPress={handleUndo}
                disabled={!lastAction}
                activeOpacity={0.7}
                accessibilityLabel="Desfazer última decisão"
              >
                <Ionicons name="arrow-undo" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Separador vertical sutil */}
              <View style={styles.dockDivider} />

              {/* 3. Dossiê Completo */}
              <TouchableOpacity
                style={[styles.dockInspectBtn, isSmallScreen && styles.dockInspectBtnCompact]}
                onPress={handleOpenDetails}
                activeOpacity={0.8}
                accessibilityLabel="Abrir dossiê técnico detalhado"
              >
                <Ionicons name="newspaper-outline" size={15} color="#38BDF8" />
                <Text style={styles.dockInspectText}>Dossiê</Text>
              </TouchableOpacity>

              {/* Separador vertical sutil */}
              <View style={styles.dockDivider} />

              {/* 4. Conectar (Ação Principal com Destaque Institucional) */}
              <TouchableOpacity
                style={styles.dockConnectBtn}
                onPress={() => executeDecision('like')}
                activeOpacity={0.85}
                accessibilityLabel="Conectar e demonstrar afinidade mútua"
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.dockConnectGradient, isSmallScreen && styles.dockConnectGradientCompact]}
                >
                  <Ionicons name="git-network" size={isSmallScreen ? 15 : 17} color="#FFFFFF" />
                  <Text style={[styles.dockConnectText, isSmallScreen && { fontSize: 12 }]}>Conectar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
              const vagaDbId = selectedOpp.dbId || parseInt(String(selectedOpp.id || '').replace('opp-', ''), 10);
              onStartChat(selectedOpp.nomeFantasia, selectedOpp.cargo, selectedOpp.empresaId, isNaN(vagaDbId) ? undefined : vagaDbId);
            }
          } else if (!isAluno && selectedCand) {
            onStartChat(selectedCand.nome, selectedCand.curso, selectedCand.usuarioId, undefined);
          }
        }}
        actionLabel={isAluno ? 'CANDIDATAR-SE AGORA 🚀' : 'INICIAR CONVERSA'}
      />

      {/* Modal Celebratório: CONEXÃO ESTABELECIDA (FATELINK NEXUS) */}
      <Modal
        visible={!!mutualMatchInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setMutualMatchInfo(null)}
      >
        <View style={styles.matchModalOverlay}>
          <View style={styles.matchModalCard}>
            {/* Top Nexus Badge */}
            <View style={styles.nexusIconCircle}>
              <Ionicons name="git-network" size={32} color="#FFFFFF" />
            </View>

            <View style={styles.nexusPill}>
              <Ionicons name="sparkles" size={12} color="#10B981" />
              <Text style={styles.nexusPillText}>ELO PROFISSIONAL CONFIRMADO</Text>
            </View>

            <Text style={styles.matchModalTitle}>Conexão Estabelecida!</Text>

            <Text style={styles.matchModalSubtitle}>
              Afinidade bilateral confirmada entre o perfil FATEC e a oportunidade. As competências e diretrizes curriculares estão em plena sinergia.
            </Text>

            {/* Apresentação Dupla Bilateral (Aluno & Empresa) */}
            <View style={styles.matchDualAvatarSection}>
              {/* Lado Aluno */}
              <View style={styles.matchAvatarCol}>
                <EntityAvatar
                  uri={mutualMatchInfo?.alunoImagem}
                  name={mutualMatchInfo?.alunoNome || 'Estudante'}
                  size={64}
                  borderColor="#10B981"
                  borderWidth={2.5}
                />
                <Text style={styles.matchAvatarName} numberOfLines={1}>
                  {mutualMatchInfo?.alunoNome || 'Estudante'}
                </Text>
                <Text style={styles.matchAvatarRole}>Estudante FATEC</Text>
              </View>

              {/* Ponte de Rede Central */}
              <View style={styles.matchConnector}>
                <View style={styles.matchConnectorLine} />
                <View style={styles.matchNexusCircle}>
                  <Ionicons name="git-commit-outline" size={18} color="#FFFFFF" />
                </View>
              </View>

              {/* Lado Empresa */}
              <View style={styles.matchAvatarCol}>
                <EntityAvatar
                  uri={mutualMatchInfo?.empresaImagem}
                  name={mutualMatchInfo?.empresaNome || 'Empresa'}
                  size={64}
                  borderColor="#38BDF8"
                  borderWidth={2.5}
                />
                <Text style={styles.matchAvatarName} numberOfLines={1}>
                  {mutualMatchInfo?.empresaNome || 'Empresa'}
                </Text>
                <Text style={styles.matchAvatarRole}>Empresa Parceira</Text>
              </View>
            </View>

            {/* Detalhes da Vaga e Afinidade */}
            <View style={styles.matchDetailsBox}>
              <Text style={styles.matchDetailsLabel}>OPORTUNIDADE EM FOCO</Text>
              <Text style={styles.matchDetailsCargo} numberOfLines={1}>
                {mutualMatchInfo?.cargo || 'Vaga em Tecnologia'}
              </Text>
              <View style={styles.matchScoreRow}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.matchScoreText}>
                  {mutualMatchInfo?.matchScore || 95}% de Afinidade Curricular
                </Text>
              </View>
            </View>

            {/* Botões de Ação */}
            <View style={styles.matchModalButtons}>
              <TouchableOpacity
                style={styles.matchModalPrimaryBtn}
                onPress={() => {
                  const info = mutualMatchInfo;
                  setMutualMatchInfo(null);
                  const targetId = isAluno ? info?.empresaId : info?.alunoId;
                  onStartChat(
                    info?.empresaNome || info?.alunoNome || 'Contato FATEC',
                    info?.cargo || 'Oportunidade',
                    targetId,
                    info?.vagaId
                  );
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
                <Text style={styles.matchModalPrimaryBtnText}>Iniciar Diálogo Técnico</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.matchModalCloseBtn}
                onPress={() => setMutualMatchInfo(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.matchModalCloseBtnText}>Continuar Explorando o Feed</Text>
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
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 20,
    maxWidth: 500,
    alignSelf: 'center',
    width: '94%',
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
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardContainer: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#131D31',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...(Platform.OS === 'web'
      ? {
          userSelect: 'none' as any,
          cursor: 'grab' as any,
          touchAction: 'none' as any,
        }
      : {}),
  },
  activeCard: {
    zIndex: 10,
    elevation: 10,
  },
  nextCard: {
    zIndex: 1,
    elevation: 1,
  },

  // Showcase Visual Superior com Gradiente Suave
  showcaseBannerContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#090E17',
    overflow: 'hidden',
  },
  showcaseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#090E17',
  },
  showcaseGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  // Ribbon Institucional Superior (CPS / FATEC + Medidor de Afinidade)
  topCredentialRibbon: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 15,
  },
  institutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 23, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  institutionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B11216', // Vermelho Institucional Centro Paula Souza / FATEC
  },
  institutionBadgeText: {
    color: '#F1F5F9',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  affinityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 14, 23, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  affinityPillText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // Aura de Decisão FateLink (Substitui os carimbos de swipe inclinados)
  decisionAuraBar: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 7,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  decisionAuraConnect: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(9, 14, 23, 0.94)',
  },
  decisionIconCircleConnect: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionAuraTextConnect: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  decisionAuraPass: {
    borderColor: '#94A3B8',
    backgroundColor: 'rgba(9, 14, 23, 0.94)',
  },
  decisionIconCirclePass: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionAuraTextPass: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  // Corpo Editorial do Card
  cardEditorialBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  identityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -20,
    marginBottom: 4,
  },
  identityTextCol: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },
  identityOrgText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  identityTrackText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  cardMainTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 21,
    letterSpacing: -0.3,
    marginBottom: 6,
  },

  // Tríade de Relevância
  relevanceTriadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  triadPillEmerald: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  triadPillEmeraldText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '800',
  },
  triadPillSlate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  triadPillSlateText: {
    color: '#CBD5E1',
    fontSize: 10.5,
    fontWeight: '600',
  },
  triadPillCyan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 4,
  },
  triadPillCyanText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Destaque de Projeto e Resumo
  projectSpotlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
    marginBottom: 5,
  },
  projectSpotlightLabel: {
    color: '#F59E0B',
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  projectSpotlightTitle: {
    color: '#FEF3C7',
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
  },
  summaryExcerpt: {
    color: '#CBD5E1',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
    marginBottom: 6,
  },

  // DNA Tecnológico
  techDnaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  techDnaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 4,
  },
  techDnaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
  techDnaPillText: {
    color: '#F1F5F9',
    fontSize: 10.5,
    fontWeight: '600',
  },
  techDnaMorePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  techDnaMoreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Toque para Detalhes Compacto
  cardDetailHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 3,
  },
  cardDetailHintText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '600',
  },

  // FATELINK ACTION DOCK (CÁPSULA UNIFICADA DE DECISÃO)
  fatelinkDockContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  fatelinkDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
    maxWidth: 440,
    alignSelf: 'center',
  },
  fatelinkDockCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 6,
  },
  dockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  dockActionBtnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 18,
  },
  dockIconBoxPass: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockLabelPass: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '800',
  },
  dockMiniBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dockDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  dockInspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  dockInspectBtnCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dockInspectText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '800',
  },
  dockConnectBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  dockConnectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7.5,
    borderRadius: 20,
    gap: 6,
  },
  dockConnectGradientCompact: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
  },
  dockConnectText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.3,
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
  matchDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
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
    backgroundColor: 'rgba(9, 14, 23, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  matchModalCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#131D31',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  nexusIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 5,
  },
  nexusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginBottom: 8,
  },
  nexusPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  matchModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  matchModalSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  matchDualAvatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 12,
  },
  matchAvatarCol: {
    alignItems: 'center',
    flex: 1,
  },
  matchAvatarName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 110,
  },
  matchAvatarRole: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  matchConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
  },
  matchConnectorLine: {
    position: 'absolute',
    height: 2,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  matchNexusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 2,
  },
  matchDetailsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  matchDetailsLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  matchDetailsCargo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  matchScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  matchScoreText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
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
    paddingVertical: 8,
  },
  matchModalCloseBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  sortBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  sortScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sortPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sortPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeFiltersSection: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  activeFiltersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activeCountBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeFiltersHeaderCount: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  activeResultCountDot: {
    fontSize: 12,
    color: '#64748B',
  },
  activeResultCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  clearAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  activeChipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
    gap: 5,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F1F5F9',
    maxWidth: 160,
  },
  activeFilterChipClose: {
    padding: 1,
  },
  emptyFilterCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(217, 30, 24, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  clearFiltersBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(217, 30, 24, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 30, 24, 0.25)',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeFilterText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  clearFilterBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  clearFilterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
