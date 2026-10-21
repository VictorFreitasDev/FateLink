import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole } from '../types';
import { api } from '../services/api';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: number;
    tipo: UserRole;
    nome: string;
    email: string;
    documento: string;
    curso_ou_ramo?: string;
    imagemUrl?: string;
  } | null;
  onProfileUpdated: (newImageUrl: string) => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  { label: 'Dev 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Dev 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Dev 3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { label: 'Dev 4', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
  { label: 'Tech Corp', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' },
  { label: 'Inovação', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
  user,
  onProfileUpdated,
  onLogout,
}) => {
  if (!user) return null;

  const [imageUrl, setImageUrl] = useState(user.imagemUrl || '');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSavePhoto = async () => {
    if (!imageUrl.trim()) {
      const msg = 'Por favor, informe uma URL válida de imagem.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Aviso', msg);
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateProfileImage(user.id, imageUrl.trim());
      if (res.success) {
        onProfileUpdated(imageUrl.trim());
        setIsEditingPhoto(false);
        const msg = 'Foto de perfil atualizada com sucesso no banco de dados!';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sucesso', msg);
      } else {
        const err = res.error || 'Erro ao atualizar foto de perfil.';
        Platform.OS === 'web' ? window.alert(err) : Alert.alert('Erro', err);
      }
    } catch (e: any) {
      const err = e.message || 'Erro inesperado ao salvar imagem.';
      Platform.OS === 'web' ? window.alert(err) : Alert.alert('Erro', err);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = () => {
    onClose();
    onLogout();
  };

  const currentAvatar = imageUrl.trim() || user.imagemUrl || (user.tipo === 'aluno'
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header do Modal */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Meu Perfil FateLink</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Foto de Perfil & Ação de Alteração */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: currentAvatar }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.editAvatarBadge}
                  onPress={() => setIsEditingPhoto(!isEditingPhoto)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.userName}>{user.nome}</Text>
              <View style={[styles.rolePill, user.tipo === 'empresa' && styles.rolePillEmpresa]}>
                <Ionicons
                  name={user.tipo === 'aluno' ? 'school' : 'business'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.rolePillText}>
                  {user.tipo === 'aluno' ? 'ALUNO FATEC' : 'EMPRESA CONTRATANTE'}
                </Text>
              </View>
            </View>

            {/* Formulário de Alteração de Imagem */}
            {isEditingPhoto && (
              <View style={styles.editPhotoBox}>
                <Text style={styles.editPhotoLabel}>Alterar Foto de Perfil (URL da Imagem):</Text>
                <TextInput
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  placeholderTextColor={Colors.placeholder}
                  style={styles.photoInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.presetsLabel}>Ou escolha um avatar rápido:</Text>
                <View style={styles.presetsRow}>
                  {PRESET_AVATARS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.presetThumb, imageUrl === preset.url && styles.presetThumbActive]}
                      onPress={() => setImageUrl(preset.url)}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: preset.url }} style={styles.presetImg} />
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.cancelPhotoBtn}
                    onPress={() => {
                      setImageUrl(user.imagemUrl || '');
                      setIsEditingPhoto(false);
                    }}
                  >
                    <Text style={styles.cancelPhotoText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.savePhotoBtn}
                    onPress={handleSavePhoto}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.savePhotoText}>Salvar Foto</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Informações da Conta */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>E-mail Institucional</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={18} color={Colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{user.tipo === 'aluno' ? 'CPF' : 'CNPJ'}</Text>
                  <Text style={styles.infoValue}>{user.documento}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name={user.tipo === 'aluno' ? 'book-outline' : 'briefcase-outline'}
                  size={18}
                  color={Colors.primary}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>{user.tipo === 'aluno' ? 'Curso / Formação' : 'Ramo de Atuação'}</Text>
                  <Text style={styles.infoValue}>{user.curso_ou_ramo || 'Tecnologia da Informação'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={Colors.primary} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Unidade Regional</Text>
                  <Text style={styles.infoValue}>Fatec Jales - Professor José Camargo</Text>
                </View>
              </View>
            </View>

            {/* Botão de Alterar Foto (se não estiver em modo edição) */}
            {!isEditingPhoto && (
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={() => setIsEditingPhoto(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={18} color={Colors.primary} />
                <Text style={styles.changePhotoBtnText}>Alterar Foto de Perfil</Text>
              </TouchableOpacity>
            )}

            {/* Botão de Sair da Conta (Logout) Prominente */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleConfirmLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={styles.logoutBtnText}>Sair da Conta</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E2E8F0',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  rolePillEmpresa: {
    backgroundColor: '#0D9488',
  },
  rolePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editPhotoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editPhotoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  photoInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  presetThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetThumbActive: {
    borderColor: Colors.primary,
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelPhotoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  cancelPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  savePhotoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  savePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  changePhotoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
});

