const conversationRepository = require('../repositories/conversation.repository');
const messageRepository = require('../repositories/message.repository');
const userRepository = require('../repositories/user.repository');
const notificationRepository = require('../repositories/notification.repository');

const chatService = {
  async getUserConversations(userId) {
    const rows = await conversationRepository.findByUser(userId);
    return rows.map((row) => {
      const isAluno = parseInt(userId, 10) === row.participante_aluno_id;
      const contactName = isAluno ? row.empresa_nome : row.aluno_nome;
      const contactAvatar = isAluno ? row.empresa_imagem : row.aluno_imagem;
      const roleInfo = isAluno ? (row.vaga_cargo || 'Recrutador FATEC') : 'Estudante FATEC';

      return {
        id: `conv-${row.id}`,
        dbId: row.id,
        contactName,
        role: roleInfo,
        avatar: contactAvatar || (isAluno
          ? 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'),
        lastMessage: row.ultima_mensagem || 'Conversa iniciada',
        lastTime: new Date(row.ultima_mensagem_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: parseInt(row.unread_count || '0', 10),
        vagaId: row.vaga_id,
        vagaTitulo: row.vaga_cargo,
        messages: [],
      };
    });
  },

  async startOrGetConversation(user1, user2, vagaId = null) {
    const u1 = parseInt(user1, 10);
    const u2 = parseInt(user2, 10);
    if (isNaN(u1) || isNaN(u2)) {
      throw { status: 400, message: 'IDs reais de ambos os participantes são obrigatórios.' };
    }

    const cleanVagaId = vagaId ? (typeof vagaId === 'string' ? parseInt(vagaId.replace('opp-', ''), 10) : vagaId) : null;

    let realAlunoId = u1;
    let realEmpresaId = u2;

    const users = await userRepository.findUsersByIds(u1, u2);
    if (users.length >= 2) {
      const alunoUser = users.find((u) => u.tipo === 'aluno');
      const empresaUser = users.find((u) => u.tipo === 'empresa');
      if (alunoUser && empresaUser) {
        realAlunoId = alunoUser.id;
        realEmpresaId = empresaUser.id;
      }
    }

    // 1. Busca conversa existente vinculada à mesma vaga
    let existing = await conversationRepository.findBetweenUsers(realAlunoId, realEmpresaId, cleanVagaId);
    if (existing) {
      return existing;
    }

    // 2. Se não encontrou por vaga específica, busca qualquer conversa existente entre esses dois usuários para evitar duplicatas
    existing = await conversationRepository.findBetweenUsers(realAlunoId, realEmpresaId, null);
    if (existing) {
      return existing;
    }

    return await conversationRepository.create(realAlunoId, realEmpresaId, cleanVagaId);
  },

  async getMessages(conversaId, currentUserId = null) {
    const cleanId = typeof conversaId === 'string' ? parseInt(conversaId.replace('conv-', ''), 10) : conversaId;
    if (currentUserId) {
      await messageRepository.markAsRead(cleanId, currentUserId);
    }

    const rows = await messageRepository.findByConversation(cleanId);
    return rows.map((row) => ({
      id: `msg-${row.id}`,
      conversaId: row.conversa_id,
      remetenteId: row.remetente_id,
      sender: currentUserId && parseInt(currentUserId, 10) === row.remetente_id ? 'me' : 'other',
      text: row.conteudo,
      time: new Date(row.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lida: row.lida,
    }));
  },

  async sendMessage(conversaId, remetenteId, conteudo) {
    const cleanId = typeof conversaId === 'string' ? parseInt(conversaId.replace('conv-', ''), 10) : conversaId;
    const cleanRemetente = parseInt(remetenteId, 10);

    const newMsg = await messageRepository.create(cleanId, cleanRemetente, conteudo.trim());
    await conversationRepository.updateLastMessage(cleanId, conteudo.trim());

    // Notificar o destinatário de forma persistente
    try {
      const conv = await conversationRepository.findById(cleanId);
      if (conv) {
        const recipientId = conv.participante_aluno_id === cleanRemetente ? conv.participante_empresa_id : conv.participante_aluno_id;
        const senderUser = await userRepository.findById(cleanRemetente);
        const senderName = senderUser ? senderUser.nome : 'Contato';

        await notificationRepository.create({
          usuarioId: recipientId,
          titulo: `Nova mensagem de ${senderName}`,
          descricao: conteudo.trim().substring(0, 100),
          tipo: 'mensagem',
          metadata: { conversaId: cleanId, remetenteId: cleanRemetente },
        });
      }
    } catch (e) {
      console.warn('Erro ao gerar notificação de nova mensagem:', e);
    }

    return {
      id: `msg-${newMsg.id}`,
      conversaId: newMsg.conversa_id,
      remetenteId: newMsg.remetente_id,
      sender: 'me',
      text: newMsg.conteudo,
      time: new Date(newMsg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lida: newMsg.lida,
    };
  }
};

module.exports = chatService;
