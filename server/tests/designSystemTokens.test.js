/**
 * Test Suite: FATElink 2.0 — ETAPA 9: UI/UX & Design System Tokens Test
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🎨 TESTES DO DESIGN SYSTEM & UI TOKENS FATELINK 2.0');
console.log('====================================================\n');

let passedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Validar Colors Tokens
runTest('Cenário 1: Tokens Semânticos de Cores (Colors)', () => {
  const colorsFile = fs.readFileSync(path.join(__dirname, '../../src/theme/colors.ts'), 'utf8');

  // Cores da Identidade FATEC
  assert(colorsFile.includes("primary: '#2563EB'"), 'Cor primária deve ser #2563EB (Azul Royal FATEC)');
  assert(colorsFile.includes("accent: '#0D9488'"), 'Cor secundária deve ser #0D9488 (Teal)');
  assert(colorsFile.includes("background: '#F8FAFC'"), 'Cor de fundo deve ser #F8FAFC (Slate 50)');

  // Cores Semânticas de Status
  assert(colorsFile.includes("success: '#16A34A'"), 'Cor de sucesso deve ser #16A34A');
  assert(colorsFile.includes("warning: '#D97706'"), 'Cor de aviso deve ser #D97706');
  assert(colorsFile.includes("danger: '#DC2626'"), 'Cor de erro/perigo deve ser #DC2626');

  // Tipografia e Contraste WCAG AA
  assert(colorsFile.includes("textPrimary: '#0F172A'"), 'Texto primário deve ter alto contraste (#0F172A)');
  assert(colorsFile.includes("textSecondary: '#475569'"), 'Texto secundário (#475569)');
  assert(colorsFile.includes("textMuted: '#64748B'"), 'Texto esmaecido (#64748B)');
  assert(colorsFile.includes("border: baseColors.cardBorder"), 'Alias border mapeado para cardBorder');
});

// 2. Validar Typography Tokens
runTest('Cenário 2: Escala Tipográfica Padronizada (Typography)', () => {
  const typoFile = fs.readFileSync(path.join(__dirname, '../../src/theme/typography.ts'), 'utf8');

  const requiredScales = [
    'h1',
    'h2',
    'h3',
    'h4',
    'bodyLarge',
    'body',
    'bodySmall',
    'caption',
    'overline',
    'button',
  ];

  for (const scale of requiredScales) {
    assert(typoFile.includes(`${scale}:`), `Escala tipográfica deve incluir ${scale}`);
  }

  assert(typoFile.includes('FontWeights'), 'Deve exportar FontWeights');
  assert(typoFile.includes('FontSizes'), 'Deve exportar FontSizes');
});

// 3. Validar Spacing & Radii Tokens
runTest('Cenário 3: Espaçamentos, Raios e Sombras (Spacing, Radii, Shadows)', () => {
  const spacingFile = fs.readFileSync(path.join(__dirname, '../../src/theme/spacing.ts'), 'utf8');

  // Spacing
  assert(spacingFile.includes('xs: 4'), 'Spacing xs deve ser 4');
  assert(spacingFile.includes('sm: 8'), 'Spacing sm deve ser 8');
  assert(spacingFile.includes('md: 12'), 'Spacing md deve ser 12');
  assert(spacingFile.includes('lg: 16'), 'Spacing lg deve ser 16');
  assert(spacingFile.includes('xxxl: 32'), 'Spacing xxxl deve ser 32');

  // Radii
  assert(spacingFile.includes('xs: 4'), 'Radii xs deve ser 4');
  assert(spacingFile.includes('sm: 8'), 'Radii sm deve ser 8');
  assert(spacingFile.includes('md: 12'), 'Radii md deve ser 12');
  assert(spacingFile.includes('lg: 16'), 'Radii lg deve ser 16');
  assert(spacingFile.includes('full: 9999'), 'Radii full deve ser 9999');

  // Shadows
  assert(spacingFile.includes('Shadows: Record<string, ViewStyle> ='), 'Deve definir preset Shadows com compatibilidade web (boxShadow)');
});

// 4. Validar Layout & Breakpoints Responsivos
runTest('Cenário 4: Breakpoints e Layout Helpers Responsivos', () => {
  const layoutFile = fs.readFileSync(path.join(__dirname, '../../src/theme/layout.ts'), 'utf8');

  assert(layoutFile.includes('sm: 640'), 'Breakpoint sm: 640');
  assert(layoutFile.includes('md: 768'), 'Breakpoint md: 768');
  assert(layoutFile.includes('lg: 1024'), 'Breakpoint lg: 1024');
  assert(layoutFile.includes('xl: 1280'), 'Breakpoint xl: 1280');
  assert(layoutFile.includes('maxContentWidth: 1200'), 'Largura máxima de conteúdo desktop: 1200');
});

// 5. Validar Componentes Reutilizáveis do Design System
runTest('Cenário 5: Catálogo de Componentes UI do Design System', () => {
  const uiIndex = fs.readFileSync(path.join(__dirname, '../../src/components/ui/index.ts'), 'utf8');

  const components = [
    'Button',
    'Input',
    'Card',
    'Badge',
    'Avatar',
    'Skeleton',
    'EmptyState',
    'Toast',
  ];

  for (const comp of components) {
    assert(
      uiIndex.includes(`export * from './${comp}'`),
      `UI index deve exportar o componente ${comp}`
    );
    const compFile = path.join(__dirname, `../../src/components/ui/${comp}.tsx`);
    assert(fs.existsSync(compFile), `Arquivo ${comp}.tsx deve existir no disco`);
  }
});

// 6. Validar Responsividade e Ausência de Telas Esticadas no Desktop
runTest('Cenário 6: Responsividade das Telas Principais (Mobile, Tablet, Desktop)', () => {
  const headerFile = fs.readFileSync(path.join(__dirname, '../../src/components/Header.tsx'), 'utf8');
  assert(headerFile.includes('maxWidth: 1200'), 'Header deve conter innerWrapper responsivo');

  const bottomNavFile = fs.readFileSync(path.join(__dirname, '../../src/components/BottomNav.tsx'), 'utf8');
  assert(bottomNavFile.includes('maxWidth: 800'), 'BottomNav deve conter navbar responsiva');

  const dashboardFile = fs.readFileSync(path.join(__dirname, '../../src/screens/DashboardScreen.tsx'), 'utf8');
  assert(dashboardFile.includes('maxWidth: 1200'), 'Dashboard deve conter contentContainer responsivo');

  const appsFile = fs.readFileSync(path.join(__dirname, '../../src/screens/ApplicationsScreen.tsx'), 'utf8');
  assert(appsFile.includes('maxWidth: 800'), 'ApplicationsScreen deve conter listContent responsivo');

  const matchFile = fs.readFileSync(path.join(__dirname, '../../src/screens/MatchScreen.tsx'), 'utf8');
  assert(matchFile.includes('maxWidth: 800'), 'MatchScreen deve conter content responsivo');

  const loginFile = fs.readFileSync(path.join(__dirname, '../../src/screens/LoginScreen.tsx'), 'utf8');
  assert(loginFile.includes('maxWidth: 460'), 'LoginScreen deve conter scrollContent responsivo');

  const regFile = fs.readFileSync(path.join(__dirname, '../../src/screens/RegisterScreen.tsx'), 'utf8');
  assert(regFile.includes('maxWidth: 520'), 'RegisterScreen deve conter scrollContent responsivo');

  const pubFile = fs.readFileSync(path.join(__dirname, '../../src/screens/PublishScreen.tsx'), 'utf8');
  assert(pubFile.includes('maxWidth: 720'), 'PublishScreen deve conter container responsivo');
});

console.log('\n====================================================');
console.log(`📊 RESULTADO FINAL: ${passedTests}/6 TESTES DO DESIGN SYSTEM APROVADOS!`);
console.log('====================================================\n');
