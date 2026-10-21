import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Conversation, NotificationItem, ChatMessage } from '../types';
import { api } from '../services/api';

interface ChatScreenProps {
  currentUserId?: number;
  activeChatTarget?: { name: string; roleInfo: string; targetUserId?: number; vagaId?: number } | null;
  onClearTarget?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUserId = 1,
  activeChatTarget,
  onClearTarget,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Carregar conversas e notificações do PostgreSQL
  const loadData = async () => {
    if (!currentUserId) return;
    try {
      const [convs, notifs] = await Promise.all([
        api.getConversations(currentUserId),
        api.getNotifications(currentUserId),
      ]);
      setConversations(convs);
      setNotifications(notifs);
    } catch (e) {
      console.warn('Erro ao carregar dados de chat:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  // Se veio redirecionado de um Card/Match com alvo específico
  useEffect(() => {
    if (activeChatTarget) {
      const targetName = activeChatTarget.name.toLowerCase();
      const existing = conversations.find(
        (c) => c.contactName.toLowerCase() === targetName
      );

      if (existing) {
        openConversation(existing);
      } else {
        // Iniciar conversa persistente no backend
        const start = async () => {
          const res = await api.startConversation(
            currentUserId,
            activeChatTarget.targetUserId || 4,
            activeChatTarget.vagaId
          );
          if (res) {
            await loadData();
          }
        };
        start();
      }
      if (onClearTarget) onClearTarget();
    }
  }, [activeChatTarget]);

  // Abrir conversa e carregar mensagens reais do PostgreSQL
  const openConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    try {
      const messages = await api.getMessages(conv.id, currentUserId);
      setChatMessages(messages);
    } catch (e) {
      console.warn('Erro ao carregar mensagens:', e);
    }
  };

  // Enviar mensagem persistente
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedConv || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await api.sendMessage(selectedConv.id, currentUserId, textToSend);
      if (newMsg) {
        setChatMessages((prev) => [...prev, newMsg]);
        // Atualiza a conversa na lista
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConv.id ? { ...c, lastMessage: textToSend, lastTime: 'Agora' } : c
          )
        );
      }
    } catch (e) {
      console.warn('Erro ao enviar mensagem:', e);
    } finally {
      setSending(false);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <View style={styles.container}>
      {/* Abas: Mensagens vs Notificações */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTab, activeTab === 'messages' && styles.topTabActive]}
          onPress={() => setActiveTab('messages')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={18}
            color={activeTab === 'messages' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.topTabText, activeTab === 'messages' && styles.topTabTextActive]}>
            MENSAGENS ({conversations.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTab, activeTab === 'notifications' && styles.topTabActive]}
          onPress={() => setActiveTab('notifications')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={activeTab === 'notifications' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.topTabText, activeTab === 'notifications' && styles.topTabTextActive]}>
            NOTIFICAÇÕES ({notifications.filter((n) => !n.read).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo Aba Mensagens */}
      {activeTab === 'messages' && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={54} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhuma conversa ativa</Text>
              <Text style={styles.emptySub}>
                Inicie uma conversa a partir de um Match no feed ou através de uma candidatura.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convCard}
              onPress={() => openConversation(item)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
              <View style={styles.convInfo}>
                <View style={styles.convHeaderRow}>
                  <Text style={styles.convName} numberOfLines={1}>{item.contactName}</Text>
                  <Text style={styles.convTime}>{item.lastTime}</Text>
                </View>
                <Text style={styles.convRole} numberOfLines={1}>{item.role}</Text>
                <Text style={styles.convLastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Conteúdo Aba Notificações */}
      {activeTab === 'notifications' && (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={54} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptySub}>
                Você receberá avisos quando suas candidaturas avançarem ou receber mensagens.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.read && styles.notifCardUnread]}
              onPress={() => handleMarkNotificationRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.notifIconCircle, !item.read && styles.notifIconCircleUnread]}>
                <Ionicons
                  name={
                    item.type === 'status'
                      ? 'trophy-outline'
                      : item.type === 'candidatura'
                      ? 'paper-plane-outline'
                      : 'information-circle-outline'
                  }
                  size={20}
                  color={!item.read ? Colors.primary : Colors.textSecondary}
                />
              </View>
              <View style={styles.notifTextContainer}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifDesc}>{item.description}</Text>
                <Text style={styles.notifTime}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal de Conversa Ativa em Tempo Real */}
      <Modal
        visible={!!selectedConv}
        animationType="slide"
        onRequestClose={() => setSelectedConv(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatModalContainer}
        >
          {/* Header da Conversa */}
          <View style={styles.chatModalHeader}>
            <TouchableOpacity
              onPress={() => setSelectedConv(null)}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedConv?.avatar }}
              style={styles.chatModalAvatar}
            />
            <View style={styles.chatModalHeaderInfo}>
              <Text style={styles.chatModalName} numberOfLines={1}>
                {selectedConv?.contactName}
              </Text>
              <Text style={styles.chatModalRole} numberOfLines={1}>
                {selectedConv?.role}
              </Text>
            </View>
          </View>

          {/* Lista de Mensagens Persistidas */}
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chatMessagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isMe = item.sender === 'me';
              return (
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.messageTextMe : styles.messageTextOther,
                    ]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isMe ? styles.messageTimeMe : styles.messageTimeOther,
                    ]}
                  >
                    {item.time}
                  </Text>
                </View>
              );
            }}
          />

          {/* Barra de Entrada de Mensagem */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Digite sua mensagem profissional..."
              placeholderTextColor={Colors.placeholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  topTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabActive: {
    borderBottomColor: Colors.primary,
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.4,
  },
  topTabTextActive: {
    color: Colors.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    lineHeight: 18,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  convInfo: {
    flex: 1,
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  convName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  convTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  convRole: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  convLastMessage: {
    fontSize: 13,
    color: '#64748B',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifCardUnread: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifIconCircleUnread: {
    backgroundColor: Colors.primaryLight,
  },
  notifTextContainer: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  notifDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 6,
    marginTop: 4,
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
    marginRight: 10,
  },
  chatModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatModalHeaderInfo: {
    flex: 1,
  },
  chatModalName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chatModalRole: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  chatMessagesContent: {
    padding: 16,
    gap: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  messageBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOther: {
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 90,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
