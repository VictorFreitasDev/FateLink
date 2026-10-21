-- Script de Inicialização Completo do Banco fatelinkBD
-- FateLink 2.0: Conectando Alunos FATEC e Empresas Parceiras

-- 1. Tabela de Usuários (Alunos e Empresas)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('aluno', 'empresa')),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    documento VARCHAR(30) UNIQUE NOT NULL,
    senha VARCHAR(100) NOT NULL,
    curso_ou_ramo VARCHAR(150),
    imagem_url TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Oportunidades (Vagas cadastradas)
CREATE TABLE IF NOT EXISTS oportunidades (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_nome VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150) NOT NULL,
    cargo VARCHAR(150) NOT NULL,
    area VARCHAR(100) NOT NULL,
    curso_relacionado VARCHAR(150),
    localizacao VARCHAR(100) NOT NULL,
    modalidade VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    bolsa VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    requisitos TEXT[] NOT NULL,
    beneficios TEXT[] NOT NULL,
    imagem_url TEXT,
    match_score INT DEFAULT 90,
    status VARCHAR(30) DEFAULT 'ativa',
    visualizacoes INT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Candidatos (Perfis detalhados dos alunos)
CREATE TABLE IF NOT EXISTS candidatos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    idade INT NOT NULL,
    curso VARCHAR(150) NOT NULL,
    semestre VARCHAR(50) NOT NULL,
    unidade_fatec VARCHAR(100) NOT NULL,
    sobre TEXT NOT NULL,
    competencias TEXT[] NOT NULL,
    disponibilidade VARCHAR(50) NOT NULL,
    imagem_url TEXT,
    github VARCHAR(150),
    linkedin VARCHAR(150),
    match_score INT DEFAULT 90,
    projetos JSONB DEFAULT '[]',
    experiencias JSONB DEFAULT '[]',
    certificacoes TEXT[] DEFAULT ARRAY[]::TEXT[],
    curriculo_url TEXT,
    previsao_formacao VARCHAR(100),
    localizacao VARCHAR(150),
    modalidade_desejada VARCHAR(50),
    portfolio VARCHAR(250),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Candidaturas (Processo Seletivo Real)
CREATE TABLE IF NOT EXISTS candidaturas (
    id SERIAL PRIMARY KEY,
    aluno_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    candidato_id INT REFERENCES candidatos(id) ON DELETE SET NULL,
    vaga_id INT NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada', 'nova', 'em_analise', 'selecionado', 'entrevista', 'proposta', 'contratado', 'recusada', 'recusado', 'encerrado', 'desistente')),
    mensagem_apresentacao TEXT,
    match_score_momento INT NOT NULL DEFAULT 85,
    match_justificativas TEXT[] DEFAULT ARRAY[]::TEXT[],
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT candidaturas_aluno_vaga_unique UNIQUE (aluno_id, vaga_id)
);

-- 5. Histórico e Auditoria de Candidaturas
CREATE TABLE IF NOT EXISTS historico_candidaturas (
    id SERIAL PRIMARY KEY,
    candidatura_id INT NOT NULL REFERENCES candidaturas(id) ON DELETE CASCADE,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    motivo TEXT,
    alterado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Conversas e Chat Real
CREATE TABLE IF NOT EXISTS conversas (
    id SERIAL PRIMARY KEY,
    participante_aluno_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    participante_empresa_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vaga_id INT REFERENCES oportunidades(id) ON DELETE SET NULL,
    ultima_mensagem TEXT,
    ultima_mensagem_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mensagens (
    id SERIAL PRIMARY KEY,
    conversa_id INT NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
    remetente_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notificações Persistidas
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'sistema' CHECK (tipo IN ('candidatura', 'status', 'mensagem', 'match', 'entrevista', 'proposta', 'sistema')),
    lida BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Agendamento de Entrevistas
CREATE TABLE IF NOT EXISTS entrevistas (
    id SERIAL PRIMARY KEY,
    candidatura_id INT NOT NULL REFERENCES candidaturas(id) ON DELETE CASCADE,
    empresa_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    aluno_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vaga_id INT NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'reagendamento_solicitado', 'cancelada', 'concluida')),
    formato VARCHAR(30) NOT NULL DEFAULT 'online' CHECK (formato IN ('online', 'presencial')),
    link_ou_local TEXT,
    horarios_propostos JSONB NOT NULL DEFAULT '[]',
    horario_confirmado VARCHAR(100),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Vagas Salvas / Favoritas
CREATE TABLE IF NOT EXISTS vagas_salvas (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    vaga_id INT NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vagas_salvas_usuario_vaga_unique UNIQUE (usuario_id, vaga_id)
);

-- 10. Decisões do Feed Interativo (Swipe like / pass)
CREATE TABLE IF NOT EXISTS feed_decisoes (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    target_id INT NOT NULL,
    target_tipo VARCHAR(20) NOT NULL CHECK (target_tipo IN ('vaga', 'candidato')),
    decisao VARCHAR(10) NOT NULL CHECK (decisao IN ('like', 'pass')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT feed_decisoes_usuario_target_unique UNIQUE (usuario_id, target_id, target_tipo)
);

-- ==========================================================
-- ÍNDICES DE ALTA PERFORMANCE (CONSULTAS E FILTROS RÁPIDOS)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_oportunidades_empresa_id ON oportunidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_status ON oportunidades(status);
CREATE INDEX IF NOT EXISTS idx_candidatos_usuario_id ON candidatos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_aluno_id ON candidaturas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_vaga_id ON candidaturas(vaga_id);
CREATE INDEX IF NOT EXISTS idx_candidaturas_status ON candidaturas(status);
CREATE INDEX IF NOT EXISTS idx_historico_candidatura_id ON historico_candidaturas(candidatura_id);
CREATE INDEX IF NOT EXISTS idx_conversas_participantes ON conversas(participante_aluno_id, participante_empresa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_id ON mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_lida ON mensagens(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_entrevistas_candidatura_id ON entrevistas(candidatura_id);
CREATE INDEX IF NOT EXISTS idx_feed_decisoes_usuario_target ON feed_decisoes(usuario_id, target_id, target_tipo);

