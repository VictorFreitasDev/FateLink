import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole } from '../types';

interface HeaderProps {
  role: UserRole;
  userName: string;
  userAvatarUrl?: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onLogout: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  userName,
  userAvatarUrl,
  searchQuery,
  onSearchChange,
  onOpenNotifications,
  onOpenProfile,
  onLogout,
  unreadCount = 2,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.innerWrapper}>
        {/* Linha superior: Logo / Perfil & Identificador Fixo de Papel + Logout */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.userSection}
            onPress={onOpenProfile}
            activeOpacity={0.75}
          >
            <View style={styles.avatarBorder}>
              <Image
                source={userAvatarUrl ? { uri: userAvatarUrl } : require('../../assets/profile-avatar.png')}
                style={styles.avatar}
                defaultSource={require('../../assets/profile-avatar.png')}
              />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Bem-vindo(a),</Text>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName || (role === 'aluno' ? 'Aluno FATEC' : 'Empresa Parceira')}
                </Text>
                <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.actionsSection}>
            {/* Badge fixo do perfil do banco de dados (Sem toggle, definido no login/cadastro) */}
            <View style={[styles.roleBadge, role === 'empresa' && styles.roleBadgeEmpresa]}>
              <Ionicons
                name={role === 'aluno' ? 'school' : 'business'}
                size={13}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.roleText}>{role === 'aluno' ? 'ALUNO' : 'EMPRESA'}</Text>
            </View>

            {/* Notificações */}
            <TouchableOpacity
              style={styles.notifButton}
              onPress={onOpenNotifications}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Botão de Sair / Logout */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={onLogout}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.dislike} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de Pesquisa */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.primary} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={role === 'aluno' ? 'Pesquisar vagas, empresas, tecnologias...' : 'Pesquisar alunos, cursos, competências...'}
            placeholderTextColor={Colors.placeholder}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color={Colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  innerWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarBorder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  roleBadgeEmpresa: {
    backgroundColor: Colors.primaryDark,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.dislike,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
    paddingVertical: 0,
  },
});
