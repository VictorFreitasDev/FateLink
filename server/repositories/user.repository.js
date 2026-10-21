const pool = require('../config/db');

const userRepository = {
  async findByEmailOrDoc(credential) {
    const cred = credential.trim();
    const result = await pool.query(
      `SELECT id, tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url, criado_em
       FROM usuarios
       WHERE LOWER(email) = LOWER($1) OR documento = $1`,
      [cred]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT id, tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url, criado_em
       FROM usuarios
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findUsersByIds(id1, id2) {
    const result = await pool.query(
      `SELECT id, tipo, nome, email, imagem_url
       FROM usuarios
       WHERE id = $1 OR id = $2`,
      [id1, id2]
    );
    return result.rows;
  },

  async createUser({ tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url }) {
    const result = await pool.query(
      `INSERT INTO usuarios (tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url, criado_em`,
      [tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url]
    );
    return result.rows[0];
  },

  async updateProfileImage(id, imagemUrl) {
    const result = await pool.query(
      `UPDATE usuarios
       SET imagem_url = $1
       WHERE id = $2
       RETURNING id, tipo, nome, email, documento, curso_ou_ramo, imagem_url`,
      [imagemUrl, id]
    );
    return result.rows[0] || null;
  }
};

module.exports = userRepository;
