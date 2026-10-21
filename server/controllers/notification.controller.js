const notificationRepository = require('../repositories/notification.repository');

const notificationController = {
  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const rows = await notificationRepository.findByUser(userId);
      const mapped = rows.map((row) => ({
        id: `notif-${row.id}`,
        title: row.titulo,
        description: row.descricao,
        time: new Date(row.criado_em).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + new Date(row.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: row.lida,
        type: row.tipo,
      }));
      return res.json(mapped);
    } catch (err) {
      console.error('Erro em GET /api/notifications:', err);
      return res.status(500).json({ error: 'Erro ao buscar notificações.' });
    }
  },

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      await notificationRepository.markAsRead(id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar notificação.' });
    }
  },

  async markAllAsRead(req, res) {
    try {
      const { userId } = req.params;
      const count = await notificationRepository.markAllAsRead(userId);
      return res.json({ success: true, count });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao marcar notificações como lidas.' });
    }
  }
};

module.exports = notificationController;
