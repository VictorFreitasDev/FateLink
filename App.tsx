import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { Colors } from './src/theme/colors';
import { UserRole, Opportunity, Candidate } from './src/types';
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

  // Dados do aplicativo (alimentados pelo PostgreSQL com fallback para os mocks)
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [conversations, setConversations] = useState(mockConversations);
  const [notifications, setNotifications] = useState(mockNotifications);

  // Busca e Chat Ativo
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatTarget, setActiveChatTarget] = useState<{ name: string; roleInfo: string } | null>(null);

  // Estado de pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Carrega e atualiza dados do PostgreSQL com cálculo de match dinâmico
  const handleRefreshFeed = async () => {
    setRefreshing(true);
    try {
      const [opps, cands] = await Promise.all([
        api.getOpportunities(currentUser?.tipo === 'aluno' ? currentUser.id : undefined),
        api.getCandidates(),
      ]);
      if (opps && opps.length > 0) setOpportunities(opps);
      if (cands && cands.length > 0) setCandidates(cands);
    } catch (e) {
      console.warn('Erro ao atualizar feed:', e);
    } finally {
      setRefreshing(false);
    }
  };

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

  // Iniciar conversa direta a partir de um Card
  const handleStartChat = (name: string, roleInfo: string) => {
    setActiveChatTarget({ name, roleInfo });
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

  // Publicar nova oportunidade (Empresa publica Vagas para Alunos)
  const handlePublishOpportunity = async (oppData: Partial<Opportunity>): Promise<boolean> => {
    try {
      const created = await api.createOpportunity(oppData);
      if (created) {
        setOpportunities((prev) => [created, ...prev]);
        return true;
      }
      // Fallback
      const fallback: Opportunity = {
        id: `opp-${Date.now()}`,
        empresa: oppData.empresa || 'Empresa Parceira',
        nomeFantasia: oppData.nomeFantasia || 'Tech Partner',
        cargo: oppData.cargo || 'Estagiário',
        area: oppData.area || 'Tecnologia da Informação',
        cursoRelacionado: 'TI / FATEC',
        localizacao: oppData.localizacao || 'São Paulo - SP',
        modalidade: (oppData.modalidade as any) || 'Híbrido',
        tipo: (oppData.tipo as any) || 'Estágio',
        bolsa: oppData.bolsa || 'A combinar',
        descricao: oppData.descricao || '',
        requisitos: oppData.requisitos || ['Estudante FATEC ativo'],
        beneficios: oppData.beneficios || ['Bolsa-Auxílio'],
        imagemUrl: oppData.imagemUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        matchScore: 96,
      };
      setOpportunities((prev) => [fallback, ...prev]);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Publicar novo currículo (Aluno publica Currículo para Empresas)
  const handlePublishCandidate = async (candData: Partial<Candidate>): Promise<boolean> => {
    try {
      const created = await api.createCandidate(candData);
      if (created) {
        setCandidates((prev) => [created, ...prev]);
        return true;
      }
      // Fallback
      const fallback: Candidate = {
        id: `cand-${Date.now()}`,
        nome: candData.nome || 'Estudante FATEC',
        idade: candData.idade || 21,
        curso: candData.curso || 'Análise e Desenv. de Sistemas',
        semestre: candData.semestre || '4º Semestre',
        unidadeFatec: candData.unidadeFatec || 'Fatec Zona Leste',
        sobre: candData.sobre || '',
        competencias: candData.competencias || ['Tecnologia'],
        disponibilidade: (candData.disponibilidade as any) || 'Tarde',
        imagemUrl: candData.imagemUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        github: candData.github,
        linkedin: candData.linkedin,
        matchScore: 98,
      };
      setCandidates((prev) => [fallback, ...prev]);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Aplicar filtros
  const handleApplyFilters = (filters: any) => {
    setCurrentTab('list');
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
          onProfileUpdated={(newImageUrl) => {
            if (currentUser) {
              setCurrentUser({ ...currentUser, imagemUrl: newImageUrl });
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
              opportunities={opportunities}
              candidates={candidates}
              searchQuery={searchQuery}
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
