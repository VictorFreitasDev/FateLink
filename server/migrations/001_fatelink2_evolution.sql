-- ==========================================================
-- MIGRATION 001: FATELINK 2.0 EVOLUTION
-- Adiciona tabelas relacionais para candidaturas, conversas,
-- mensagens, histórico, vagas salvas e notificações
-- ==========================================================

-- 1. Status da Oportunidade (ativa, pausada, encerrada)
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ativa';
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS visualizacoes INT DEFAULT 0;

-- 2. Campos complementares no perfil de Candidatos
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS projetos JSONB DEFAULT '[]';
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS experiencias JSONB DEFAULT '[]';
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS certificacoes TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS curriculo_url TEXT;

-- 3. Tabela de Candidaturas (Alunos se candidatam a Vagas)
CREATE TABLE IF NOT EXISTS candidaturas (
    id SERIAL PRIMARY KEY,
    aluno_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    candidato_id INT REFERENCES candidatos(id) ON DELETE SET NULL,
    vaga_id INT NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'enviada' CHECK (status IN (
        'enviada', 'em_analise', 'entrevista', 'proposta', 'contratado', 'recusada', 'desistente'
    )),
    mensagem_apresentacao TEXT,
    match_score_momento INT NOT NULL DEFAULT 85,
    match_justificativas TEXT[] DEFAULT ARRAY[]::TEXT[],
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT candidaturas_aluno_vaga_unique UNIQUE (aluno_id, vaga_id)
);

-- 4. Histórico de Alterações de Etapa da Candidatura
CREATE TABLE IF NOT EXISTS historico_candidaturas (
    id SERIAL PRIMARY KEY,
    candidatura_id INT NOT NULL REFERENCES candidaturas(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    motivo TEXT,
    alterado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Vagas Salvas / Favoritas
CREATE TABLE IF NOT EXISTS vagas_salvas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vaga_id INT NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vagas_salvas_usuario_vaga_unique UNIQUE (usuario_id, vaga_id)
);

-- 6. Tabela de Conversas (Chats entre Aluno e Empresa)
CREATE TABLE IF NOT EXISTS conversas (
    id SERIAL PRIMARY KEY,
    participante_aluno_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    participante_empresa_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vaga_id INT REFERENCES oportunidades(id) ON DELETE SET NULL,
    ultima_mensagem TEXT,
    ultima_mensagem_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT conversas_participantes_vaga_unique UNIQUE (participante_aluno_id, participante_empresa_id, vaga_id)
);

-- 7. Tabela de Mensagens Persistidas
CREATE TABLE IF NOT EXISTS mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INT NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
    remetente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de Notificações Reais
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('candidatura', 'status', 'mensagem', 'match', 'sistema')),
    lida BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Índices para Alto Desempenho e Consultas Rápidas
CREATE INDEX IF NOT EXISTS idx_candidaturas_aluno ON candidaturas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga ON candidaturas(vaga_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_status ON candidaturas(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id, criado_em);
CREATE INDEX IF NOT EXISTS idx_conversas_participantes ON conversas(participante_aluno_id, participante_empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, lida);

