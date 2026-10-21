// ==========================================================
// FATELINK 2.0 DESIGN SYSTEM — COLOR TOKENS
// ==========================================================

const baseColors = {
  // Identidade FATEC Principal
  primary: '#2563EB',          // Azul Royal FATEC contemporâneo (WCAG AA compliant)
  primaryHover: '#1D4ED8',     // Hover / Press state
  primaryDark: '#1E40AF',      // Azul escuro institucional
  primaryLight: '#EFF6FF',     // Fundo suave de destaque
  primarySurface: '#DBEAFE',   // Superfície suave para badges e chips
  primaryGlow: 'rgba(37, 99, 235, 0.18)',

  // Cor Secundária / Destaque FATEC
  accent: '#0D9488',           // Teal moderno
  accentLight: '#F0FDFA',
  accentDark: '#0F766E',

  // Superfícies e Fundos
  background: '#F8FAFC',       // Fundo geral do app (Slate 50)
  surface: '#FFFFFF',          // Cartões, modais, headers
  surfaceAlt: '#F1F5F9',       // Inputs, subcards, áreas secundárias
  surfaceHover: '#E2E8F0',     // Estados de hover em listas
  cardBorder: '#E2E8F0',       // Bordas finas de cartões
  inputBg: '#F8FAFC',          // Fundo de campos de texto
  inputBorder: '#CBD5E1',      // Borda padrão de inputs
  inputFocusBorder: '#2563EB', // Borda com foco
  divider: '#E2E8F0',          // Linhas divisórias

  // Tipografia e Textos (WCAG 4.5:1+)
  textPrimary: '#0F172A',      // Títulos e textos de alto contraste (Slate 900)
  textSecondary: '#475569',    // Parágrafos e rótulos (Slate 600)
  textMuted: '#64748B',        // Subtítulos e metadados (Slate 500)
  placeholder: '#94A3B8',      // Textos de placeholder (Slate 400)
  textInverse: '#FFFFFF',      // Texto sobre superfícies escuras

  // Status Semânticos
  success: '#16A34A',          // Verde sucesso
  successLight: '#DCFCE7',     // Fundo verde claro
  successDark: '#15803D',
  like: '#10B981',
  likeBg: 'rgba(16, 185, 129, 0.12)',

  warning: '#D97706',          // Âmbar alerta
  warningLight: '#FEF3C7',
  warningDark: '#B45309',

  danger: '#DC2626',           // Vermelho erro / recusa
  dangerLight: '#FEE2E2',
  dangerDark: '#B91C1C',
  dislike: '#EF4444',
  dislikeBg: 'rgba(239, 68, 68, 0.12)',

  info: '#0284C7',             // Azul informativo
  infoLight: '#E0F2FE',
  infoDark: '#0369A1',

  // Badges e Categorias
  indigo: '#4F46E5',
  indigoLight: '#EEF2FF',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',

  // Sombras e Glassmorphism
  shadowColor: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.65)',

  // ==========================================================
  // FATELINK 2.0 — IDENTIDADE VISUAL EXCLUSIVA & ORIGINAL
  // ==========================================================
  fatecCrimson: '#B11216',        // Vermelho institucional Centro Paula Souza / FATEC
  fatecCrimsonLight: '#FEE2E2',
  fatecCrimsonDark: '#8F0E11',
  fatecCrimsonGlow: 'rgba(177, 18, 22, 0.28)',

  synergyEmerald: '#10B981',      // Esmeralda para afinidade curricular e compatibilidade
  synergyEmeraldDark: '#059669',
  synergyEmeraldLight: '#D1FAE5',
  synergyEmeraldGlow: 'rgba(16, 185, 129, 0.25)',

  cyberCyan: '#38BDF8',           // Ciano tecnológico para regimes, contratos e links
  cyberCyanDark: '#0284C7',
  cyberCyanLight: '#E0F2FE',
  cyberCyanGlow: 'rgba(56, 189, 248, 0.25)',

  academicAmber: '#F59E0B',       // Âmbar para projetos em destaque, bolsas e semestres
  academicAmberLight: '#FEF3C7',

  // Superfícies Exclusivas do FateLink (Dark Editorial Tech)
  fatelinkCardBg: '#131D31',      // Superfície nobre de cartões editoriais
  fatelinkCardBorder: 'rgba(255, 255, 255, 0.09)',
  fatelinkHeaderBg: '#090E17',
  fatelinkDockBg: 'rgba(15, 23, 42, 0.94)', // Cápsula do Dock de Ações
  fatelinkDockBorder: 'rgba(255, 255, 255, 0.14)',
  fatelinkNexusGlow: 'rgba(37, 99, 235, 0.35)',
};

export const Colors = {
  ...baseColors,
  // Convenient aliases
  border: baseColors.cardBorder,
  text: baseColors.textPrimary,
  surfaceSecondary: baseColors.surfaceAlt,
  secondary: baseColors.accent,
  secondaryLight: baseColors.accentLight,
  secondaryDark: baseColors.accentDark,
  error: baseColors.danger,
  errorLight: baseColors.dangerLight,
  errorDark: baseColors.dangerDark,
};
