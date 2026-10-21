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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Conversation, NotificationItem, ChatMessage } from '../types';
import { api } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChatScreenProps {
  currentUserId?: number;
  activeChatTarget?: { name: string; roleInfo: string; targetUserId?: number; vagaId?: number } | null;
  onClearTarget?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUserId,
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
  const isWide = Platform.OS === 'web' && SCREEN_WIDTH >= 820;

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
    if (activeChatTarget && currentUserId) {
      const targetName = activeChatTarget.name.toLowerCase();
      const existing = conversations.find(
        (c) => c.contactName.toLowerCase() === targetName
      );

      if (existing) {
        openConversation(existing);
      } else if (activeChatTarget.targetUserId) {
        const start = async () => {
          const res = await api.startConversation(
            currentUserId,
            activeChatTarget.targetUserId!,
            activeChatTarget.vagaId
          );
          if (res) {
            await loadData();
            const updatedConvs = await api.getConversations(currentUserId);
            const found = updatedConvs.find(
              (c) => c.contactName.toLowerCase() === targetName || (c.dbId && c.dbId === res.id)
            );
            if (found) {
              openConversation(found);
            }
          }
        };
        start();
      }
      if (onClearTarget) onClearTarget();
    }
  }, [activeChatTarget, currentUserId]);

  // Polling em tempo real quando há uma conversa aberta
  useEffect(() => {
    if (!selectedConv || !currentUserId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const msgs = await api.getMessages(selectedConv.id, currentUserId);
        if (isMounted) {
          setChatMessages((prev) => {
            // Se mudou o número de mensagens ou a última é diferente, atualiza
            if (msgs.length !== prev.length || (msgs.length > 0 && prev.length > 0 && msgs[msgs.length - 1].id !== prev[prev.length - 1].id)) {
              return msgs;
            }
            return prev;
          });
        }
      } catch (e) {}
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedConv?.id, currentUserId]);

  // Auto-scroll ao enviar ou receber novas mensagens
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [chatMessages.length]);

  // Abrir conversa e marcar mensagens como lidas
  const openConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    try {
      const messages = await api.getMessages(conv.id, currentUserId);
      setChatMessages(messages);
      // Zera o contador visual de não lidas
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (e) {
      console.warn('Erro ao carregar mensagens:', e);
    }
  };

  // Enviar mensagem persistente no PostgreSQL
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedConv || sending || !currentUserId) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await api.sendMessage(selectedConv.id, currentUserId, textToSend);
      if (newMsg) {
        setChatMessages((prev) => [...prev, newMsg]);
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

  // Marcar notificação individual como lida
  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Marcar todas notificações como lidas
  const handleMarkAllNotificationsRead = async () => {
    if (!currentUserId) return;
    await api.markAllNotificationsAsRead(currentUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Renderizar o chat (tanto no painel lateral quanto no modal)
  const renderChatArea = () => {
    if (!selectedConv) {
      return (
        <View style={styles.noConvSelectedBox}>
          <Ionicons name="chatbubbles-outline" size={54} color={Colors.placeholder} />
          <Text style={styles.noConvSelectedTitle}>Selecione uma conversa</Text>
          <Text style={styles.noConvSelectedSub}>
            Escolha um contato à esquerda para conversar ou responder sobre processos seletivos.
          </Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.chatPane}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header do Chat */}
        <View style={styles.chatPaneHeader}>
          {!isWide && (
            <TouchableOpacity onPress={() => setSelectedConv(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Image source={{ uri: selectedConv.avatar }} style={styles.chatPaneAvatar} />
          <View style={styles.chatPaneHeaderInfo}>
            <Text style={styles.chatPaneName} numberOfLines={1}>
              {selectedConv.contactName}
            </Text>
            <Text style={styles.chatPaneRole} numberOfLines={1}>
              {selectedConv.role}
            </Text>
          </View>
        </View>

        {/* Lista de Mensagens */}
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatMessagesContent}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={9}
          removeClippedSubviews={Platform.OS !== 'web'}
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
                <View style={styles.msgFooterRow}>
                  <Text
                    style={[
                      styles.messageTime,
                      isMe ? styles.messageTimeMe : styles.messageTimeOther,
                    ]}
                  >
                    {item.time}
                  </Text>
                  {isMe && (
                    <Ionicons
                      name={item.lida ? 'checkmark-done' : 'checkmark'}
                      size={13}
                      color={item.lida ? '#60A5FA' : 'rgba(255,255,255,0.7)'}
                      style={{ marginLeft: 3 }}
                    />
                  )}
                </View>
              </View>
            );
          }}
        />

        {/* Barra de Entrada de Texto */}
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
              <Ionicons name="send" size={17} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Abas Superiores: Mensagens vs Notificações */}
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
            CONVERSAS ({conversations.length})
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

      {/* Conteúdo Principal */}
      <View style={styles.bodyLayout}>
        {/* Painel da Esquerda (Lista de Conversas ou Notificações) */}
        <View style={[styles.leftPane, isWide && selectedConv ? styles.leftPaneNarrow : null]}>
          {activeTab === 'messages' && (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={Platform.OS !== 'web'}
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
                  <Text style={styles.emptyTitle}>Nenhuma conversa iniciada</Text>
                  <Text style={styles.emptySub}>
                    Inicie uma conversa a partir de um Match no feed ou através de uma candidatura recebida.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedConv?.id === item.id;

                return (
                  <TouchableOpacity
                    style={[styles.convCard, isSelected && styles.convCardActive]}
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
                );
              }}
            />
          )}

          {activeTab === 'notifications' && (
            <View style={{ flex: 1 }}>
              {notifications.length > 0 && (
                <View style={styles.notifActionsBar}>
                  <TouchableOpacity
                    onPress={handleMarkAllNotificationsRead}
                    style={styles.markAllReadBtn}
                  >
                    <Ionicons name="checkmark-done-outline" size={16} color={Colors.primary} />
                    <Text style={styles.markAllReadText}>Marcar todas como lidas</Text>
                  </TouchableOpacity>
                </View>
              )}

              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={7}
                removeClippedSubviews={Platform.OS !== 'web'}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off-outline" size={54} color={Colors.textSecondary} />
                    <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
                    <Text style={styles.emptySub}>
                      Você receberá avisos quando suas candidaturas avançarem, entrevistas forem agendadas ou houver novos matches.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                    onPress={() => handleMarkNotificationRead(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.notifIconBox, { backgroundColor: getNotifColor(item.type).bg }]}>
                      <Ionicons
                        name={getNotifIcon(item.type) as any}
                        size={20}
                        color={getNotifColor(item.type).icon}
                      />
                    </View>
                    <View style={styles.notifBody}>
                      <View style={styles.notifTitleRow}>
                        <Text style={[styles.notifTitle, !item.read && styles.notifTitleBold]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.notifTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notifDesc}>{item.description}</Text>
                    </View>
                    {!item.read && <View style={styles.notifDot} />}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Painel da Direita (Visão Web: Chat Integrado) */}
        {isWide && activeTab === 'messages' && (
          <View style={styles.rightPane}>{renderChatArea()}</View>
        )}
      </View>

      {/* Modal Mobile para Visualização da Conversa */}
      {!isWide && (
        <Modal
          visible={!!selectedConv}
          animationType="slide"
          onRequestClose={() => setSelectedConv(null)}
        >
          {renderChatArea()}
        </Modal>
      )}
    </View>
  );
};

function getNotifIcon(type: string): string {
  switch (type) {
    case 'match':
      return 'sparkles';
    case 'entrevista':
      return 'calendar';
    case 'mensagem':
      return 'chatbubble-ellipses';
    case 'status':
    case 'candidatura':
      return 'document-text';
    default:
      return 'notifications';
  }
}

function getNotifColor(type: string): { bg: string; icon: string } {
  switch (type) {
    case 'match':
      return { bg: '#EDE9FE', icon: '#7C3AED' };
    case 'entrevista':
      return { bg: '#E0E7FF', icon: '#4F46E5' };
    case 'mensagem':
      return { bg: '#EFF6FF', icon: '#2563EB' };
    case 'status':
    case 'candidatura':
      return { bg: '#ECFDF5', icon: '#059669' };
    default:
      return { bg: '#F1F5F9', icon: '#64748B' };
  }
}

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
  bodyLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  leftPaneNarrow: {
    maxWidth: 380,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  rightPane: {
    flex: 2,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 340,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  convCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#F8FAFC',
  },
  avatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  convInfo: {
    flex: 1,
    marginLeft: 12,
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  convTime: {
    fontSize: 11,
    color: Colors.placeholder,
    marginLeft: 6,
  },
  convRole: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  convLastMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  notifActionsBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifCardUnread: {
    backgroundColor: '#F8FAFC',
    borderColor: '#BFDBFE',
  },
  notifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifBody: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  notifTitleBold: {
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.placeholder,
    marginLeft: 6,
  },
  notifDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginLeft: 8,
  },
  noConvSelectedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noConvSelectedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  noConvSelectedSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
    lineHeight: 19,
  },
  chatPane: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatPaneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  chatPaneAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  chatPaneHeaderInfo: {
    flex: 1,
    marginLeft: 10,
  },
  chatPaneName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chatPaneRole: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  messageBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: Colors.textPrimary,
  },
  msgFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.8)',
  },
  messageTimeOther: {
    color: Colors.placeholder,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: Colors.textPrimary,
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
    backgroundColor: '#CBD5E1',
  },
});
