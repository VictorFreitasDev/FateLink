# FATElink 2.0 — Plataforma de Conexão Profissional e Empregabilidade FATEC

> Conectando estudantes universitários da rede FATEC e empresas parceiras por meio de compatibilidade inteligente, recrutamento ágil e comunicação em tempo real.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Requisitos de Sistema](#-requisitos-de-sistema)
- [Configuração do Banco de Dados](#-configuração-do-banco-de-dados)
- [Instalação e Execução](#-instalação-e-execução)
  - [Backend (Node.js + Express)](#1-execução-do-backend)
  - [Frontend (React Native + Expo)](#2-execução-do-frontend)
- [Principais Funcionalidades](#-principais-funcionalidades)
- [Algoritmo de Compatibilidade (Match Engine)](#-algoritmo-de-compatibilidade-match-engine)
- [Suíte de Testes Automatizados](#-suíte-de-testes-automatizados)
- [Design System & Multiplataforma](#-design-system--multiplataforma)

---

## 🌟 Visão Geral

O **FATElink 2.0** é uma solução completa multiplataforma (Mobile Android/iOS e Web Desktop/Tablet) projetada para modernizar a inserção de estudantes da FATEC no mercado de trabalho.

O sistema unifica em uma só plataforma:
1. **Para Alunos:** Descoberta imersiva de vagas (Swipe + Lista), cálculo explicável de match, gestão de candidaturas, currículo em PDF persistido e chat direto com recrutadores.
2. **Para Empresas:** Painel corporativo com 7 KPIs persistidos em tempo real, pipeline Kanban interativo, publicação de vagas, triagem com filtros avançados e agendamento de entrevistas.

---

## 🛠 Tecnologias Utilizadas

### Frontend & Mobile
- **React Native 0.88** & **Expo SDK 58** (com Continuous Native Generation).
- **TypeScript 6.0** (Tipagem estrita ponta a ponta).
- **Zustand 5** (Gerenciamento de estado global reativo para filtros e preferências).
- **Expo Vector Icons** (Ionicons) & **Expo Linear Gradient**.
- **React Native Web** (Experiência desktop e tablet fluida com limites de conteúdo responsivos).

### Backend & API
- **Node.js 24** & **Express 5** (Arquitetura modular em camadas: Routes, Controllers, Services, Repositories, Validators).
- **PostgreSQL 16** (`fatelinkBD`) com connection pooling (`pg`), chaves estrangeiras com integridade referencial e 14 índices otimizados.
- **RESTful API** com upload multipart/base64 de arquivos físicos em disco (`server/uploads/resumes/`).

---

## 📁 Estrutura do Projeto

```plaintext
FateLink/
├── assets/                       # Ícones e imagens institucionais do app
├── server/                       # Backend Express modularizado
│   ├── config/                   # Conexão e pooling do banco (db.js)
│   ├── controllers/              # Camada de controle HTTP REST
│   │   ├── application.controller.js
│   │   ├── auth.controller.js
│   │   ├── candidate.controller.js
│   │   ├── chat.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── feed.controller.js
│   │   ├── interview.controller.js
│   │   └── opportunity.controller.js
│   ├── repositories/             # Acesso a dados e queries SQL parametrizadas
│   ├── routes/                   # Definição e roteamento das rotas Express
│   ├── services/                 # Lógica de negócio e regras operacionais
│   │   ├── matchEngine.js        # Motor de cálculo normalizado e explicável (0-100)
│   │   └── ...
│   ├── tests/                    # Suíte completa de testes automatizados
│   │   ├── matchEngine.test.js
│   │   ├── candidateProfile.test.js
│   │   ├── recruiterDashboard.test.js
│   │   ├── communicationAndApplications.test.js
│   │   ├── designSystemTokens.test.js
│   │   └── e2eFullFlows.test.js  # 16 fluxos operacionais E2E
│   ├── uploads/resumes/          # Diretório físico de armazenamento de currículos PDF
│   ├── init_db.sql               # Script DDL completo com índices de alta performance
│   ├── seed_fatec_jales.sql      # Carga inicial com dados representativos da FATEC
│   └── index.js                  # Ponto de entrada do servidor backend
├── src/                          # Código-fonte da aplicação React Native / Expo
│   ├── components/               # Componentes estruturais e modais
│   │   ├── ui/                   # Design System reutilizável (Button, Input, Card, Badge, etc.)
│   │   ├── BottomNav.tsx         # Barra de navegação inferior responsiva
│   │   ├── CandidateCard.tsx     # Card de exibição de estudantes com fallback
│   │   ├── Header.tsx            # Cabeçalho com pesquisa, perfil e notificações
│   │   ├── MatchBreakdownCard.tsx# Explicabilidade detalhada do match
│   │   ├── ModalDetails.tsx      # Bottom sheet expansível de detalhes
│   │   ├── OpportunityCard.tsx   # Card de exibição de oportunidades
│   │   └── ProfileModal.tsx      # Modal de edição de perfil e upload de currículo
│   ├── screens/                  # Telas da aplicação
│   │   ├── ApplicationsScreen.tsx# Linha do tempo e gestão de processos seletivos
│   │   ├── ChatScreen.tsx        # Chat em tempo real e central de notificações
│   │   ├── DashboardScreen.tsx   # Painel corporativo com 7 KPIs e Kanban
│   │   ├── FilterScreen.tsx      # Filtros multi-critério (estudante e empresa)
│   │   ├── ListScreen.tsx        # Feed com modo Swipe (TikTok/Tinder) e Lista
│   │   ├── LoginScreen.tsx       # Autenticação com perfis Aluno/Empresa
│   │   ├── MatchScreen.tsx       # Visualização de conexões e matches mútuos
│   │   ├── PublishScreen.tsx     # Publicação de vagas e perfis profissionais
│   │   ├── RegisterScreen.tsx    # Cadastro segregado de Aluno ou Empresa
│   │   └── SplashScreen.tsx      # Abertura animada da identidade visual
│   ├── services/                 # Cliente de integração HTTP (`api.ts`)
│   ├── stores/                   # Stores globais Zustand (`filterStore.ts`)
│   ├── theme/                    # Design tokens (Colors, Typography, Spacing, Layout)
│   ├── types/                    # Definições completas TypeScript
│   └── utils/                    # Utilitários compartilhados (`matchEngine.ts`)
├── App.tsx                       # Componente raiz com navegação e estado de autenticação
├── package.json
└── tsconfig.json
```

---

## 💻 Requisitos de Sistema

- **Node.js:** Versão 18.x ou superior (testado com Node v24.x).
- **PostgreSQL:** Versão 14.x ou superior (porta padrão: 5432).
- **Gerenciador de Pacotes:** `npm` ou `bun`.

---

## 🗄 Configuração do Banco de Dados

1. Certifique-se de que o serviço do PostgreSQL está ativo localmente.
2. Crie a base de dados `fatelinkBD`:
   ```bash
   createdb -U postgres fatelinkBD
   ```
3. Execute o script de inicialização para criar todas as tabelas e índices otimizados:
   ```bash
   npm run db:init
   ```
   *(Ou execute manualmente: `psql -U postgres -d fatelinkBD -f server/init_db.sql`)*

---

## 🚀 Instalação e Execução

### 1. Instalação das Dependências

Na raiz do projeto:
```bash
npm install
```

### 2. Execução do Backend

Inicie o servidor Express (porta 3000):
```bash
npm run server
```
O servidor inicializará com as rotas modulares da API REST e conexão ativa com o PostgreSQL.

### 3. Execução do Frontend

Em um terminal separado:
```bash
# Iniciar o servidor de desenvolvimento Expo
npm start

# Ou abrir diretamente no navegador Web
npm run web

# Ou abrir no emulador Android
npm run android

# Ou abrir no simulador iOS
npm run ios
```

---

## ✨ Principais Funcionalidades

### 🎓 Estudantes
- **Feed Interativo Duplo:** Alterne livremente entre o **Modo Swipe** (cards gestuais com física fluida) e o **Modo Lista** detalhado.
- **Filtros Multi-Critério:** Filtre por Curso, Modalidade, Localização, Faixa de Bolsa e Requisitos Técnicos.
- **Perfil & Currículo:** Cadastro de formação, semestre, previsão de formatura, projetos com links GitHub/demo e **upload real de currículo PDF**.
- **Candidaturas com Linha do Tempo:** Acompanhe o avanço em cada etapa (Enviada, Em Análise, Selecionado, Entrevista, Proposta e Contratado).
- **Confirmação de Entrevistas:** Receba horários sugeridos pela empresa e confirme com um toque.

### 🏢 Empresas Parceiras
- **Dashboard Corporativo Completo:** 7 KPIs consolidados diretamente do banco (Vagas Ativas, Vagas Encerradas, Candidaturas, Novos Candidatos, Matches, Entrevistas e Contratações).
- **Pipeline Kanban Responsivo:** Arraste ou mova candidatos entre etapas com histórico e auditoria persistida.
- **Publicação e Ciclo de Vida da Vaga:** Criar, editar, encerrar, reabrir e excluir oportunidades com atualização instantânea.
- **Agendamento de Entrevistas:** Sugira múltiplos slots de horários com link de videoconferência ou endereço presencial.

---

## 🧠 Algoritmo de Compatibilidade (Match Engine)

O algoritmo do FateLink 2.0 avalia a afinidade entre estudante e oportunidade com uma escala normalizada de **0 a 100**, baseada em 5 pilares com explicabilidade total:

| Pilar | Peso | Critérios Avaliados |
|---|---|---|
| **Competências** | 35% | Correspondência exata e por sinônimos/aliases técnicos (ex.: JS ➔ JavaScript, TS ➔ TypeScript, Postgres ➔ PostgreSQL). |
| **Formação Acadêmica** | 25% | Correlação entre o curso do aluno e a área de atuação da vaga. |
| **Experiência & Semestre** | 15% | Semestre atual versus complexidade e requisitos da vaga. |
| **Disponibilidade** | 15% | Turno de estudo (Manhã/Tarde/Noite) compatível com a jornada de trabalho. |
| **Localização & Modalidade** | 10% | Proximidade física ou compatibilidade com vagas remotas/híbridas. |

O algoritmo identifica e destaca **Pontos Fortes**, **Competências Ausentes** e **Sugestões de Desenvolvimento**.

---

## 🧪 Suíte de Testes Automatizados

O projeto possui **50 testes automatizados** cobrindo serviços, regras de negócio e integração E2E com banco de dados real.

### Executar todos os testes:
```bash
npm test
```

### Executar suítes específicas:
```bash
npm run test:match       # 7 testes do Algoritmo de Match
npm run test:profile     # 6 testes de Perfil e Upload de Currículo PDF
npm run test:dashboard   # 9 testes do Dashboard Empresarial e Pipeline Kanban
npm run test:chat        # 6 testes de Chat, Mensagens e Notificações
npm run test:ui          # 6 testes de Tokens do Design System e Responsividade
npm run test:e2e         # 16 testes dos fluxos operacionais completos ponta a ponta
```

### Validações Técnicas Adicionais:
```bash
# Verificação estrita de tipagem TypeScript
npx tsc --noEmit

# Diagnóstico de integridade e dependências do Expo
npx expo-doctor

# Validação do build estático de produção Web
npx expo export --platform web --clear
```

---

## 🎨 Design System & Multiplataforma

O **FateLink 2.0** conta com componentes desacoplados e responsivos localizados em `src/components/ui/`:

- `Button`: Acessível (min 44px de área de toque), com variantes semânticas e estados de loading.
- `Input`: Com indicador de foco, limpeza rápida, rótulos e mensagens de erro estruturadas.
- `Card`: Superfície com elevação refinada e subcomponentes estruturados.
- `Badge`: Pílulas de status semânticos para competências e etapas de processos.
- `Avatar`: Suporte a fotos reais com fallback de iniciais coloridas de forma determinística.
- `Skeleton`: Shimmer elegante para carregamento gradual de conteúdo.
- `EmptyState`: Estados vazios ilustrados com ações contextuais de redirecionamento.
- `Toast`: Notificações flutuantes de feedback (sucesso, aviso e erro).

---

## 👥 Equipe do Projeto

Desenvolvido para conectar a comunidade acadêmica da **FATEC** ao ecossistema produtivo de tecnologia e negócios.

