const authService = require('../services/auth.service');
const authValidator = require('../validators/auth.validator');

const authController = {
  async register(req, res) {
    try {
      const error = authValidator.validateRegister(req.body);
      if (error) {
        return res.status(400).json({ error });
      }

      const user = await authService.register(req.body);
      return res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso!',
        user,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro interno ao salvar no banco.' });
    }
  },

  async login(req, res) {
    try {
      const error = authValidator.validateLogin(req.body);
      if (error) {
        return res.status(400).json({ error });
      }

      const user = await authService.login(req.body.credential, req.body.password);
      return res.json({
        success: true,
        message: 'Login realizado com sucesso!',
        user,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro no servidor durante o login.' });
    }
  },

  async updateProfileImage(req, res) {
    try {
      const { id } = req.params;
      const { imagemUrl } = req.body;
      if (!imagemUrl || typeof imagemUrl !== 'string' || !imagemUrl.trim()) {
        return res.status(400).json({ error: 'URL da imagem é obrigatória.' });
      }

      const user = await authService.updateProfileImage(id, imagemUrl);
      return res.json({
        success: true,
        message: 'Foto de perfil atualizada com sucesso!',
        user,
      });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao atualizar foto de perfil.' });
    }
  }
};

module.exports = authController;
