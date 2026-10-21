import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export type TabType = 'list' | 'match' | 'publish' | 'applications' | 'chat' | 'dashboard' | 'filter';

interface TabItemConfig {
  id: TabType;
  label: string;
  iconOutline: string;
  iconFilled: string;
  isCenter?: boolean;
  badge?: number;
}

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  role: 'aluno' | 'empresa';
  unreadMessages?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  role,
  unreadMessages = 0,
}) => {
  const isAluno = role === 'aluno';

  const alunoTabs: TabItemConfig[] = [
    {
      id: 'list' as TabType,
      label: 'Vagas',
      iconOutline: 'briefcase-outline',
      iconFilled: 'briefcase',
    },
    {
      id: 'match' as TabType,
      label: 'Conexões',
      iconOutline: 'git-network-outline',
      iconFilled: 'git-network',
    },
    {
      id: 'publish' as TabType,
      label: 'Publicar',
      iconOutline: 'add-circle-outline',
      iconFilled: 'add-circle',
      isCenter: true,
    },
    {
      id: 'applications' as TabType,
      label: 'Candidaturas',
      iconOutline: 'document-text-outline',
      iconFilled: 'document-text',
    },
    {
      id: 'chat' as TabType,
      label: 'Mensagens',
      iconOutline: 'chatbubbles-outline',
      iconFilled: 'chatbubbles',
      badge: unreadMessages,
    },
  ];

  const empresaTabs: TabItemConfig[] = [
    {
      id: 'dashboard' as TabType,
      label: 'Painel',
      iconOutline: 'bar-chart-outline',
      iconFilled: 'bar-chart',
    },
    {
      id: 'list' as TabType,
      label: 'Talentos',
      iconOutline: 'people-outline',
      iconFilled: 'people',
    },
    {
      id: 'match' as TabType,
      label: 'Conexões',
      iconOutline: 'git-network-outline',
      iconFilled: 'git-network',
    },
    {
      id: 'applications' as TabType,
      label: 'Candidaturas',
      iconOutline: 'document-text-outline',
      iconFilled: 'document-text',
    },
    {
      id: 'chat' as TabType,
      label: 'Mensagens',
      iconOutline: 'chatbubbles-outline',
      iconFilled: 'chatbubbles',
      badge: unreadMessages,
    },
  ];

  const tabs = isAluno ? alunoTabs : empresaTabs;

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.centerButtonWrapper}
                onPress={() => onSelectTab(tab.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.centerButton, isActive && styles.centerButtonActive]}>
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, { marginTop: 3 }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={(isActive ? tab.iconFilled : tab.iconOutline) as any}
                  size={24}
                  color={isActive ? Colors.primary : Colors.textSecondary}
                />
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    paddingHorizontal: 8,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -10,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  centerButtonActive: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 1.05 }],
  },
});
