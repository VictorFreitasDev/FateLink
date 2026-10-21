-- Migration & Enriquecimento de Dados Mockados: Fatec Jales e Região
-- FateLink 2.0

-- 1. Garantir coluna imagem_url em usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- 2. Atualizar imagens dos usuários mockados existentes
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' WHERE id = 1;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80' WHERE id = 2;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80' WHERE id = 3;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80' WHERE id = 4;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80' WHERE id = 5;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' WHERE id = 6;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80' WHERE id = 7;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80' WHERE id = 8;
UPDATE usuarios SET imagem_url = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80' WHERE id = 9;

-- 3. Inserir Alunos da Fatec Jales (Área de TI) se não existirem
INSERT INTO usuarios (tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url)
VALUES
('aluno', 'Gabriel Santos', 'gabriel.santos@fatec.sp.gov.br', '458.219.740-11', '123456', 'Gestão da Tecnologia da Informação', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80'),
('aluno', 'Letícia Ribeiro Martins', 'leticia.martins@fatec.sp.gov.br', '394.812.560-88', '123456', 'Análise e Desenvolvimento de Sistemas', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'),
('aluno', 'Matheus Oliveira Costa', 'matheus.costa@fatec.sp.gov.br', '481.930.220-45', '123456', 'Análise e Desenvolvimento de Sistemas', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'),
('aluno', 'Camila Ferreira Lima', 'camila.ferreira@fatec.sp.gov.br', '412.339.870-90', '123456', 'Gestão da Tecnologia da Informação', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  documento = EXCLUDED.documento,
  senha = EXCLUDED.senha,
  curso_ou_ramo = EXCLUDED.curso_ou_ramo,
  imagem_url = EXCLUDED.imagem_url;

-- 4. Inserir Empresas da Região de Jales, Rio Preto e Fernandópolis se não existirem
INSERT INTO usuarios (tipo, nome, email, documento, senha, curso_ou_ramo, imagem_url)
VALUES
('empresa', 'TOTVS Rio Preto', 'rh@totvsriopreto.com.br', '53.113.791/0002-03', '123456', 'Sistemas de Gestão ERP, Cloud & IA', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'),
('empresa', 'Softpar Tecnologia', 'contato@softpar.com.br', '04.281.930/0001-44', '123456', 'Automação Comercial & Software de Gestão', 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'),
('empresa', 'Unimed Noroeste Paulista', 'rh@unimedjales.com.br', '45.192.380/0001-67', '123456', 'Saúde & Gestão Hospitalar de TI', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'),
('empresa', 'Kodigos Tecnologia', 'talentos@kodigos.com.br', '28.910.450/0001-89', '123456', 'Fábrica de Software Web, Mobile & Cloud', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'),
('empresa', 'Target Sistemas', 'vagas@targetsistemas.com.br', '60.849.201/0001-15', '123456', 'Soluções Tecnológicas para Distribuição & Logística', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  documento = EXCLUDED.documento,
  senha = EXCLUDED.senha,
  curso_ou_ramo = EXCLUDED.curso_ou_ramo,
  imagem_url = EXCLUDED.imagem_url;

-- 5. Perfis Detalhados dos Candidatos da FATEC JALES
INSERT INTO candidatos (usuario_id, nome, idade, curso, semestre, unidade_fatec, sobre, competencias, disponibilidade, imagem_url, github, linkedin, match_score)
SELECT u.id, 'Gabriel Santos', 22, 'Gestão da Tecnologia da Informação', '5º Semestre', 'Fatec Jales - Prof. José Camargo',
       'Estudante do 5º semestre de GTI na Fatec Jales. Experiência prática em infraestrutura, redes corporativas e suporte a sistemas. Busco estágio na região de Jales e Rio Preto.',
       ARRAY['Governança de TI', 'Redes de Computadores', 'Linux', 'AWS Cloud', 'Suporte Técnico', 'ITIL'],
       'Manhã', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
       'github.com/gabrielsantos-fatec', 'linkedin.com/in/gabrielsantos-ti', 96
FROM usuarios u WHERE u.email = 'gabriel.santos@fatec.sp.gov.br'
AND NOT EXISTS (SELECT 1 FROM candidatos WHERE usuario_id = u.id);

INSERT INTO candidatos (usuario_id, nome, idade, curso, semestre, unidade_fatec, sobre, competencias, disponibilidade, imagem_url, github, linkedin, match_score)
SELECT u.id, 'Letícia Ribeiro Martins', 21, 'Análise e Desenvolvimento de Sistemas', '3º Semestre', 'Fatec Jales - Prof. José Camargo',
       'Estudante de ADS na Fatec Jales apaixonada por desenvolvimento Front-End e interfaces modernas e acessíveis. Criação de layouts no Figma e desenvolvimento mobile com React Native.',
       ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'UI/UX Design', 'JavaScript'],
       'Tarde', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
       'github.com/leticiamartins-dev', 'linkedin.com/in/leticiaribeiro-fatec', 97
FROM usuarios u WHERE u.email = 'leticia.martins@fatec.sp.gov.br'
AND NOT EXISTS (SELECT 1 FROM candidatos WHERE usuario_id = u.id);

INSERT INTO candidatos (usuario_id, nome, idade, curso, semestre, unidade_fatec, sobre, competencias, disponibilidade, imagem_url, github, linkedin, match_score)
SELECT u.id, 'Matheus Oliveira Costa', 23, 'Análise e Desenvolvimento de Sistemas', '4º Semestre', 'Fatec Jales - Prof. José Camargo',
       'Focado em desenvolvimento Backend de alta performance, modelagem de banco relacional PostgreSQL e arquitetura orientada a microsserviços. Estudante da Fatec Jales.',
       ARRAY['Node.js', 'PostgreSQL', 'Python', 'Docker', 'Git', 'APIs REST'],
       'Integral', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
       'github.com/matheuscosta-backend', 'linkedin.com/in/matheuscosta-fatec', 94
FROM usuarios u WHERE u.email = 'matheus.costa@fatec.sp.gov.br'
AND NOT EXISTS (SELECT 1 FROM candidatos WHERE usuario_id = u.id);

INSERT INTO candidatos (usuario_id, nome, idade, curso, semestre, unidade_fatec, sobre, competencias, disponibilidade, imagem_url, github, linkedin, match_score)
SELECT u.id, 'Camila Ferreira Lima', 20, 'Gestão da Tecnologia da Informação', '4º Semestre', 'Fatec Jales - Prof. José Camargo',
       'Entusiasta de dados e gestão ágil de projetos de TI. Vivência na Fatec Jales com projetos de análise de dados, criação de dashboards no Power BI e melhoria de processos corporativos.',
       ARRAY['Power BI', 'SQL', 'Metodologias Ágeis', 'Scrum', 'Gestão de Projetos', 'Excel Avançado'],
       'Manhã', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
       'github.com/camilaferreira-gti', 'linkedin.com/in/camilaferreira-dados', 93
FROM usuarios u WHERE u.email = 'camila.ferreira@fatec.sp.gov.br'
AND NOT EXISTS (SELECT 1 FROM candidatos WHERE usuario_id = u.id);

-- 6. Vagas das Empresas da Região de Jales, Rio Preto e Fernandópolis
INSERT INTO oportunidades (empresa_id, empresa_nome, nome_fantasia, cargo, area, curso_relacionado, localizacao, modalidade, tipo, bolsa, descricao, requisitos, beneficios, imagem_url, match_score, status)
SELECT u.id, 'Softpar Tecnologia', 'Softpar Tecnologia', 'Estágio em Desenvolvimento Backend (Node.js & PostgreSQL)',
       'Engenharia de Software', 'Análise e Desenvolvimento de Sistemas', 'Jales - SP', 'Híbrido', 'Estágio', 'R$ 2.100,00',
       'Oportunidade para estudantes da FATEC Jales atuarem no desenvolvimento e manutenção de microsserviços em Node.js e banco de dados PostgreSQL. Atuação direta em nosso software de automação comercial com mentoria técnica contínua.',
       ARRAY['Cursando ADS na Fatec Jales a partir do 2º semestre', 'Bons conhecimentos em JavaScript/TypeScript', 'Modelagem e consultas em SQL / PostgreSQL', 'Noções de Git'],
       ARRAY['Vale Refeição R$ 650', 'Auxílio Transporte', 'Bônus por Metas Semestral', 'Flexibilidade de Horário'],
       'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80', 97, 'ativa'
FROM usuarios u WHERE u.email = 'contato@softpar.com.br'
AND NOT EXISTS (SELECT 1 FROM oportunidades WHERE empresa_id = u.id AND cargo = 'Estágio em Desenvolvimento Backend (Node.js & PostgreSQL)');

INSERT INTO oportunidades (empresa_id, empresa_nome, nome_fantasia, cargo, area, curso_relacionado, localizacao, modalidade, tipo, bolsa, descricao, requisitos, beneficios, imagem_url, match_score, status)
SELECT u.id, 'Unimed Noroeste Paulista', 'Unimed Noroeste Paulista', 'Estagiário de Suporte Técnico & Infraestrutura de TI',
       'Infraestrutura & Redes', 'Gestão da Tecnologia da Informação', 'Jales - SP', 'Presencial', 'Estágio', 'R$ 1.850,00',
       'Atuação no departamento de TI da Unimed na unidade de Jales. Apoio aos usuários internos, monitoramento de servidores, redes locais TCP/IP, manutenção preventiva de microcomputadores e suporte ao sistema hospitalar.',
       ARRAY['Cursando GTI ou ADS na Fatec Jales', 'Conhecimento em redes de computadores e cabeamento estruturado', 'Sistemas Operacionais Windows e Linux', 'Boa comunicação interpessoal'],
       ARRAY['Vale Alimentação R$ 700', 'Plano de Saúde Unimed Integral', 'Seguro de Vida', 'Subsídio Educacional FATEC'],
       'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', 95, 'ativa'
FROM usuarios u WHERE u.email = 'rh@unimedjales.com.br'
AND NOT EXISTS (SELECT 1 FROM oportunidades WHERE empresa_id = u.id AND cargo = 'Estagiário de Suporte Técnico & Infraestrutura de TI');

INSERT INTO oportunidades (empresa_id, empresa_nome, nome_fantasia, cargo, area, curso_relacionado, localizacao, modalidade, tipo, bolsa, descricao, requisitos, beneficios, imagem_url, match_score, status)
SELECT u.id, 'TOTVS Rio Preto', 'TOTVS Unidade Rio Preto', 'Estágio em Desenvolvimento Full-Stack (React & Node/Java)',
       'Tecnologia da Informação', 'Análise e Desenvolvimento de Sistemas', 'São José do Rio Preto - SP', 'Híbrido', 'Estágio', 'R$ 2.450,00',
       'Integre a equipe de engenharia da TOTVS Rio Preto desenvolvendo soluções corporativas para clientes de médio e grande porte do Noroeste Paulista. Desenvolvimento de novas interfaces em React e integrações via API REST.',
       ARRAY['Cursando ADS ou GTI na Fatec Jales ou região', 'Conhecimentos em React ou JavaScript moderno', 'Conceitos de orientação a objetos e bancos relacionais', 'Vontade de crescer e aprender'],
       ARRAY['Vale Refeição Flexível R$ 900', 'Vale Transporte', 'Gympass / TotalPass', 'Trilha de Certificações Cloud', 'Plano de Carreira'],
       'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', 96, 'ativa'
FROM usuarios u WHERE u.email = 'rh@totvsriopreto.com.br'
AND NOT EXISTS (SELECT 1 FROM oportunidades WHERE empresa_id = u.id AND cargo = 'Estágio em Desenvolvimento Full-Stack (React & Node/Java)');

INSERT INTO oportunidades (empresa_id, empresa_nome, nome_fantasia, cargo, area, curso_relacionado, localizacao, modalidade, tipo, bolsa, descricao, requisitos, beneficios, imagem_url, match_score, status)
SELECT u.id, 'Kodigos Tecnologia', 'Kodigos Tecnologia', 'Estágio Mobile (React Native / Expo)',
       'Engenharia Mobile', 'Análise e Desenvolvimento de Sistemas', 'Fernandópolis - SP', 'Híbrido', 'Estágio', 'R$ 2.200,00',
       'Buscamos alunos da Fatec Jales ou Fernandópolis para desenvolver aplicativos para iOS e Android com React Native e Expo. Foco em UX fluida, consumo de APIs e publicação nas lojas.',
       ARRAY['Cursando Análise e Desenvolvimento de Sistemas', 'Familiaridade com React Native ou React Web', 'Conhecimento em TypeScript e consumo de APIs REST', 'Criatividade e proatividade'],
       ARRAY['Vale Refeição R$ 600', 'Auxílio Home Office', 'Horário Flexível para Faculdade', 'Mentoria com Devs Seniores'],
       'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', 94, 'ativa'
FROM usuarios u WHERE u.email = 'talentos@kodigos.com.br'
AND NOT EXISTS (SELECT 1 FROM oportunidades WHERE empresa_id = u.id AND cargo = 'Estágio Mobile (React Native / Expo)');

INSERT INTO oportunidades (empresa_id, empresa_nome, nome_fantasia, cargo, area, curso_relacionado, localizacao, modalidade, tipo, bolsa, descricao, requisitos, beneficios, imagem_url, match_score, status)
SELECT u.id, 'Target Sistemas', 'Target Sistemas', 'Estágio em Business Intelligence (BI) & Análise de Dados',
       'Dados & Inteligência Artificial', 'Gestão da Tecnologia da Informação', 'São José do Rio Preto - SP', 'Remoto', 'Estágio', 'R$ 2.300,00',
       'Auxiliar na extração, transformação e carga de dados (ETL) e desenvolvimento de dashboards gerenciais em Power BI para empresas de logística e atacado distribuidor de todo o Brasil.',
       ARRAY['Cursando GTI ou ADS na Fatec Jales a partir do 3º semestre', 'Domínio de SQL e raciocínio lógico analítico', 'Conhecimento ou interesse em Power BI / Python para dados', 'Organização e atenção a detalhes'],
       ARRAY['Vale Alimentação R$ 850', 'Assistência Médica e Odontológica', 'Ajuda de Custo Home Office R$ 200', 'Auxílio Livros'],
       'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80', 92, 'ativa'
FROM usuarios u WHERE u.email = 'vagas@targetsistemas.com.br'
AND NOT EXISTS (SELECT 1 FROM oportunidades WHERE empresa_id = u.id AND cargo = 'Estágio em Business Intelligence (BI) & Análise de Dados');

-- 7. Inserir Candidaturas Reais para que as Empresas vejam os inscritos
-- Softpar Tecnologia: Gabriel Santos e Letícia Ribeiro
INSERT INTO candidaturas (aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao, match_score_momento, match_justificativas)
SELECT u.id, c.id, o.id, 'em_analise',
       'Olá Softpar! Sou estudante da FATEC Jales e resido em Jales. Tenho grande interesse no estágio de backend e já desenvolvi APIs com Node.js e PostgreSQL nos projetos acadêmicos!',
       94, ARRAY['Reside em Jales - SP (alta compatibilidade geográfica)', 'Cursando ADS na Fatec Jales', 'Conhecimento em PostgreSQL e Node.js']
FROM usuarios u
JOIN candidatos c ON c.usuario_id = u.id
CROSS JOIN oportunidades o
WHERE u.email = 'matheus.costa@fatec.sp.gov.br'
  AND o.cargo = 'Estágio em Desenvolvimento Backend (Node.js & PostgreSQL)'
ON CONFLICT (aluno_id, vaga_id) DO NOTHING;

INSERT INTO candidaturas (aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao, match_score_momento, match_justificativas)
SELECT u.id, c.id, o.id, 'enviada',
       'Prezada equipe da Softpar, sou estudante de ADS na Fatec Jales e gostaria muito de uma oportunidade no time de desenvolvimento da empresa!',
       88, ARRAY['Cursando ADS na Fatec Jales', 'Boa base em lógica e bancos relacionais']
FROM usuarios u
JOIN candidatos c ON c.usuario_id = u.id
CROSS JOIN oportunidades o
WHERE u.email = 'leticia.martins@fatec.sp.gov.br'
  AND o.cargo = 'Estágio em Desenvolvimento Backend (Node.js & PostgreSQL)'
ON CONFLICT (aluno_id, vaga_id) DO NOTHING;

-- Unimed Jales: Gabriel Santos e Camila Ferreira
INSERT INTO candidaturas (aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao, match_score_momento, match_justificativas)
SELECT u.id, c.id, o.id, 'entrevista',
       'Olá RH da Unimed Noroeste Paulista! Tenho formação focada em infraestrutura e redes na Fatec Jales, e gostaria muito de contribuir no suporte de TI hospitalar.',
       96, ARRAY['Cursando GTI na Fatec Jales', 'Conhecimento em Redes e Sistemas Operacionais', 'Localizado em Jales']
FROM usuarios u
JOIN candidatos c ON c.usuario_id = u.id
CROSS JOIN oportunidades o
WHERE u.email = 'gabriel.santos@fatec.sp.gov.br'
  AND o.cargo = 'Estagiário de Suporte Técnico & Infraestrutura de TI'
ON CONFLICT (aluno_id, vaga_id) DO NOTHING;

-- TOTVS Rio Preto: Matheus Costa e Letícia Ribeiro
INSERT INTO candidaturas (aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao, match_score_momento, match_justificativas)
SELECT u.id, c.id, o.id, 'proposta',
       'Olá TOTVS! Meus projetos na Fatec Jales utilizam React e TypeScript. Tenho disponibilidade para atuação híbrida em Rio Preto.',
       95, ARRAY['Cursando ADS na Fatec Jales', 'Experiência prática em React e TypeScript']
FROM usuarios u
JOIN candidatos c ON c.usuario_id = u.id
CROSS JOIN oportunidades o
WHERE u.email = 'leticia.martins@fatec.sp.gov.br'
  AND o.cargo = 'Estágio em Desenvolvimento Full-Stack (React & Node/Java)'
ON CONFLICT (aluno_id, vaga_id) DO NOTHING;

-- Kodigos Tecnologia: Letícia Ribeiro e Gabriel Santos
INSERT INTO candidaturas (aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao, match_score_momento, match_justificativas)
SELECT u.id, c.id, o.id, 'em_analise',
       'Olá Kodigos! Adoro desenvolvimento mobile com React Native e Expo. Acompanho a empresa na região e quero fazer parte do time de Fernandópolis!',
       93, ARRAY['Experiência com React Native', 'Cursando Fatec Jales na microrregião de Fernandópolis']
FROM usuarios u
JOIN candidatos c ON c.usuario_id = u.id
CROSS JOIN oportunidades o
WHERE u.email = 'leticia.martins@fatec.sp.gov.br'
  AND o.cargo = 'Estágio Mobile (React Native / Expo)'
ON CONFLICT (aluno_id, vaga_id) DO NOTHING;

-- Target Sistemas: Camila Ferreira
INSERT INTO candidaturas (aluno_id, candidato_id, vaga_id, status, mensagem_apresentacao, match_score_momento, match_justificativas)
SELECT u.id, c.id, o.id, 'enviada',
       'Olá Target Sistemas! Desenvolvo dashboards em Power BI e modelagem dimensional na Fatec Jales. Oportunidade perfeita para minha área de estudo!',
       92, ARRAY['Cursando GTI na Fatec Jales', 'Forte afinidade com Power BI e SQL']
FROM usuarios u
JOIN candidatos c ON c.usuario_id = u.id
CROSS JOIN oportunidades o
WHERE u.email = 'camila.ferreira@fatec.sp.gov.br'
  AND o.cargo = 'Estágio em Business Intelligence (BI) & Análise de Dados'
ON CONFLICT (aluno_id, vaga_id) DO NOTHING;

