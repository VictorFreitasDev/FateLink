const chatService = require('../services/chat.service');

const chatController = {
  async getUserConversations(req, res) {
    try {
      const { userId } = req.params;
      const convs = await chatService.getUserConversations(userId);
      return res.json(convs);
    } catch (err) {
      console.error('Erro em GET /api/conversations:', err);
      return res.status(500).json({ error: 'Erro ao buscar conversas.' });
    }
  },

  async startConversation(req, res) {
    try {
      const { alunoId, empresaId, vagaId, userA, userB } = req.body;
      const u1 = alunoId || userA;
      const u2 = empresaId || userB;

      if (!u1 || !u2) {
        return res.status(400).json({ error: 'Identificadores dos participantes são obrigatórios.' });
      }

      const conv = await chatService.startOrGetConversation(u1, u2, vagaId);
      return res.json(conv);
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao iniciar conversa.' });
    }
  },

  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const { currentUserId } = req.query;
      const messages = await chatService.getMessages(id, currentUserId);
      return res.json(messages);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      return res.status(500).json({ error: 'Erro ao buscar histórico de mensagens.' });
    }
  },

  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { remetenteId, conteudo } = req.body;
      if (!remetenteId || !conteudo || !conteudo.trim()) {
        return res.status(400).json({ error: 'remetenteId e conteudo são obrigatórios.' });
      }

      const msg = await chatService.sendMessage(id, remetenteId, conteudo);
      return res.status(201).json(msg);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      return res.status(500).json({ error: 'Erro ao salvar mensagem: ' + err.message });
    }
  }
};

module.exports = chatController;
