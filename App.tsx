import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors } from './src/theme/colors';
import { UserRole, Opportunity, Candidate, Conversation, NotificationItem } from './src/types';
import {
  mockOpportunities,
  mockCandidates,
  mockConversations,
  mockNotifications,
} from './src/data/mockData';
import { api } from './src/services/api';

import { Header } from './src/components/Header';
import { BottomNav, TabType } from './src/components/BottomNav';
import { ProfileModal } from './src/components/ProfileModal';

import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { ListScreen } from './src/screens/ListScreen';
import { PublishScreen } from './src/screens/PublishScreen';
import { FilterScreen } from './src/screens/FilterScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ApplicationsScreen } from './src/screens/ApplicationsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';

interface LoggedUser {
  id: number;
  tipo: UserRole;
  nome: string;
  email: string;
  documento: string;
  curso_ou_ramo?: string;
  imagemUrl?: string;
}

export default function App() {
  // Controle de Telas Principais
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'login' | 'register' | 'main'>('splash');
  
  // Controle de Abas da Navegação Principal
  const [currentTab, setCurrentTab] = useState<TabType>('match');
  
  // Usuário Autenticado no PostgreSQL (Define estritamente o papel Aluno vs Empresa)
  const [currentUser, setCurrentUser] = useState<LoggedUser | null>(null);

  // Modal de Perfil e Alteração de Foto
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Dados do aplicativo (persistidos no PostgreSQL fatelinkBD com fallback inicial seguro)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  // Filtros aplicados no feed
  const [appliedFilters, setAppliedFilters] = useState<any>(null);

  // Busca e Chat Ativo com IDs reais de participantes
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatTarget, setActiveChatTarget] = useState<{
    name: string;
    roleInfo: string;
    targetUserId?: number;
    vagaId?: number;
  } | null>(null);

  // Estado de pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Carrega e atualiza dados do PostgreSQL com cálculo de match dinâmico
  const handleRefreshFeed = async () => {
    setRefreshing(true);
    try {
      const [opps, cands] = await Promise.all([
        api.getOpportunities(currentUser?.tipo === 'aluno' ? currentUser.id : undefined, appliedFilters || undefined),
        api.getCandidates(appliedFilters || undefined),
      ]);
      if (Array.isArray(opps)) setOpportunities(opps);
      if (Array.isArray(cands)) setCandidates(cands);

      if (currentUser?.id) {
        const notifs = await api.getNotifications(currentUser.id);
        if (Array.isArray(notifs)) setNotifications(notifs);
      }
    } catch (e) {
      console.warn('Erro ao atualizar feed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Previne zoom por duplo clique ou duplo toque no ambiente web/mobile web preservando gestos de swipe
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleGesture = (e: Event) => {
        e.preventDefault();
      };

      const handleDblClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
      };

      // Injeta regra de CSS para manipulação de toque sem zoom duplo
      const styleId = 'fatelink-prevent-zoom-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          html, body, #root {
            touch-action: manipulation;
            -webkit-text-size-adjust: 100%;
          }
        `;
        document.head.appendChild(style);
      }

      // Garante viewport sem permitir escalonamento acidental
      let metaViewport = document.querySelector('meta[name="viewport"]');
      if (!metaViewport) {
        metaViewport = document.createElement('meta');
        metaViewport.setAttribute('name', 'viewport');
        document.head.appendChild(metaViewport);
      }
      metaViewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no, viewport-fit=cover'
      );

      document.addEventListener('gesturestart', handleGesture as any);
      document.addEventListener('dblclick', handleDblClick, { passive: false });

      return () => {
        document.removeEventListener('gesturestart', handleGesture as any);
        document.removeEventListener('dblclick', handleDblClick);
      };
    }
  }, []);

  // Recarrega feed quando o usuário loga ou acessa a aba de feed/talentos
  useEffect(() => {
    handleRefreshFeed();
  }, [currentUser, currentTab]);

  // Logout funcional com suporte robusto para Web e Mobile
  const handleLogout = () => {
    const doLogout = () => {
      setCurrentUser(null);
      setCurrentScreen('login');
      setProfileModalVisible(false);
      setAppliedFilters(null);
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Deseja realmente sair da sua sessão no FateLink?')) {
        doLogout();
      }
      return;
    }

    Alert.alert('Sair da Conta', 'Deseja realmente sair da sua sessão no FateLink?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: doLogout,
      },
    ]);
  };

  // Iniciar conversa direta com IDs reais de participantes
  const handleStartChat = (name: string, roleInfo: string, targetUserId?: number, vagaId?: number) => {
    setActiveChatTarget({ name, roleInfo, targetUserId, vagaId });
    setCurrentTab('chat');
  };

  // Candidatar-se a uma vaga com persistência no PostgreSQL
  const handleApplyToOpportunity = async (opp: Opportunity) => {
    if (!currentUser) return;
    const res = await api.createApplication(
      currentUser.id,
      opp.id,
      'Candidatura submetida via aplicativo FateLink 2.0.'
    );
    if (res.success) {
      const msg = `Candidatura enviada com sucesso para a vaga "${opp.cargo}" na ${opp.nomeFantasia}!`;
      Alert.alert('Sucesso! 🚀', msg, [
        { text: 'Acompanhar Candidatura', onPress: () => setCurrentTab('applications') },
        { text: 'Continuar no Feed', style: 'cancel' },
      ]);
      handleRefreshFeed();
    } else {
      Alert.alert('Aviso', res.error || 'Erro ao enviar candidatura.');
    }
  };

  // Publicar nova oportunidade (Empresa publica Vagas para Alunos com persistência estrita no banco)
  const handlePublishOpportunity = async (oppData: Partial<Opportunity>): Promise<boolean> => {
    try {
      const created = await api.createOpportunity(oppData);
      if (created) {
        setOpportunities((prev) => [created, ...prev.filter((o) => o.id !== created.id)]);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Erro ao salvar oportunidade:', e);
      return false;
    }
  };

  // Publicar novo currículo (Aluno publica Currículo para Empresas com persistência estrita no banco)
  const handlePublishCandidate = async (candData: Partial<Candidate>): Promise<boolean> => {
    try {
      const created = await api.createCandidate(candData);
      if (created) {
        setCandidates((prev) => [created, ...prev.filter((c) => c.id !== created.id)]);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Erro ao salvar candidato:', e);
      return false;
    }
  };

  // Aplicar filtros no feed com sincronização backend
  const handleApplyFilters = async (filters: any) => {
    setAppliedFilters(filters);
    setCurrentTab('list');
    try {
      if (currentUser?.tipo === 'aluno') {
        const opps = await api.getOpportunities(currentUser?.id, filters);
        if (Array.isArray(opps)) setOpportunities(opps);
      } else {
        const cands = await api.getCandidates(filters);
        if (Array.isArray(cands)) setCandidates(cands);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados com filtros:', e);
    }
  };

  // Limpar filtros do feed
  const handleClearFilters = async () => {
    setAppliedFilters(null);
    try {
      const [opps, cands] = await Promise.all([
        api.getOpportunities(currentUser?.tipo === 'aluno' ? currentUser.id : undefined),
        api.getCandidates(),
      ]);
      if (Array.isArray(opps)) setOpportunities(opps);
      if (Array.isArray(cands)) setCandidates(cands);
    } catch (e) {
      console.warn('Erro ao limpar filtros no feed:', e);
    }
  };

  // 1. Tela Splash Inicial
  if (currentScreen === 'splash') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SplashScreen onFinish={() => setCurrentScreen('login')} />
      </SafeAreaProvider>
    );
  }

  // 2. Fluxo de Login (determina o perfil pelo PostgreSQL)
  if (currentScreen === 'login') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.authSafeArea}>
          <LoginScreen
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setCurrentTab(user.tipo === 'empresa' ? 'dashboard' : 'list');
              setCurrentScreen('main');
            }}
            onNavigateToRegister={() => setCurrentScreen('register')}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // 3. Fluxo de Cadastro (cria a conta com tipo fixo no PostgreSQL)
  if (currentScreen === 'register') {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.authSafeArea}>
          <RegisterScreen
            onRegisterSuccess={(user) => {
              setCurrentUser(user);
              setCurrentTab(user.tipo === 'empresa' ? 'dashboard' : 'list');
              setCurrentScreen('main');
            }}
            onNavigateToLogin={() => setCurrentScreen('login')}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Papel estrito e imutável do usuário autenticado
  const userRole: UserRole = currentUser ? currentUser.tipo : 'aluno';

  // 4. Aplicação Principal (Main Hub)
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.mainSafeArea} edges={['top', 'left', 'right']}>
        {/* Header Superior com Papel Fixo do Banco, Avatar Clicável e Logout */}
        <Header
          role={userRole}
          userName={currentUser ? currentUser.nome : ''}
          userAvatarUrl={currentUser?.imagemUrl}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenNotifications={() => setCurrentTab('chat')}
          onOpenProfile={() => setProfileModalVisible(true)}
          onLogout={handleLogout}
          unreadCount={notifications.filter((n) => !n.read).length}
        />

        {/* Modal de Perfil e Edição de Imagem */}
        <ProfileModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          user={currentUser}
          onProfileUpdated={(updated) => {
            if (currentUser) {
              if (typeof updated === 'string') {
                setCurrentUser({ ...currentUser, imagemUrl: updated });
              } else if (updated && typeof updated === 'object') {
                setCurrentUser({
                  ...currentUser,
                  ...(updated.imagemUrl ? { imagemUrl: updated.imagemUrl } : {}),
                  ...(updated.nome ? { nome: updated.nome } : {}),
                  ...(updated.curso_ou_ramo ? { curso_ou_ramo: updated.curso_ou_ramo } : {}),
                });
              }
            }
          }}
          onLogout={handleLogout}
        />

        {/* Conteúdo Dinâmico por Aba */}
        <View style={styles.contentContainer}>
          {currentTab === 'match' && (
            <MatchScreen
              role={userRole}
              currentUserId={currentUser?.id}
              onStartChat={handleStartChat}
              onNavigateToFeed={() => setCurrentTab('list')}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardScreen
              empresaId={currentUser?.id}
              onNavigateToApplications={() => setCurrentTab('applications')}
              onNavigateToPublish={() => setCurrentTab('publish')}
              onStartChat={handleStartChat}
            />
          )}

          {currentTab === 'list' && (
            <ListScreen
              role={userRole}
              currentUserId={currentUser?.id}
              currentUserName={currentUser?.nome}
              currentUserAvatar={currentUser?.imagemUrl}
              opportunities={opportunities}
              candidates={candidates}
              searchQuery={searchQuery}
              appliedFilters={appliedFilters}
              onClearFilters={handleClearFilters}
              onStartChat={handleStartChat}
              onApplyToOpportunity={handleApplyToOpportunity}
              onRefresh={handleRefreshFeed}
              refreshing={refreshing}
            />
          )}

          {currentTab === 'applications' && (
            <ApplicationsScreen
              role={userRole}
              currentUserId={currentUser?.id}
              onStartChat={handleStartChat}
            />
          )}

          {currentTab === 'publish' && (
            <PublishScreen
              role={userRole}
              currentUser={currentUser}
              onPublishOpportunity={handlePublishOpportunity}
              onPublishCandidate={handlePublishCandidate}
              onSuccessNavigate={() => setCurrentTab('list')}
            />
          )}

          {currentTab === 'filter' && (
            <FilterScreen
              role={userRole}
              opportunities={opportunities}
              candidates={candidates}
              onApplyFilters={handleApplyFilters}
            />
          )}

          {currentTab === 'chat' && (
            <ChatScreen
              currentUserId={currentUser?.id}
              activeChatTarget={activeChatTarget}
              onClearTarget={() => setActiveChatTarget(null)}
            />
          )}
        </View>

        {/* Barra de Navegação Inferior Adaptada */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          role={userRole}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  authSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainSafeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
