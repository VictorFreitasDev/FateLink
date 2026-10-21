-- ==========================================================
-- MIGRATION 002: FEED DECISÕES (SWIPES LIKE / PASS)
-- Registra decisões reais de swipe do feed estilo Tinder / TikTok
-- ==========================================================

CREATE TABLE IF NOT EXISTS feed_decisoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_usuario VARCHAR(20) NOT NULL,
    target_id INT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL CHECK (target_tipo IN ('vaga', 'candidato')),
    decisao VARCHAR(10) NOT NULL CHECK (decisao IN ('like', 'pass')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT feed_decisoes_user_target_unique UNIQUE (usuario_id, target_id, target_tipo)
);

CREATE INDEX IF NOT EXISTS idx_feed_decisoes_usuario ON feed_decisoes(usuario_id, target_tipo);
CREATE INDEX IF NOT EXISTS idx_feed_decisoes_target ON feed_decisoes(target_id, target_tipo, decisao);

