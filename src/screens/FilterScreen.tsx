import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole, FeedFilterCriteria, SortOption, Opportunity, Candidate } from '../types';
import { useFilterStore } from '../stores/filterStore';

interface FilterScreenProps {
  role: UserRole;
  opportunities?: Opportunity[];
  candidates?: Candidate[];
  onApplyFilters: (filters: FeedFilterCriteria) => void;
  onClose?: () => void;
}

export const FilterScreen: React.FC<FilterScreenProps> = ({
  role,
  opportunities = [],
  candidates = [],
  onApplyFilters,
  onClose,
}) => {
  const isAluno = role === 'aluno';

  const {
    studentFilters,
    companyFilters,
    setStudentFilters,
    setCompanyFilters,
    resetStudentFilters,
    resetCompanyFilters,
    getActiveFiltersCount,
  } = useFilterStore();

  const currentStoreFilters = isAluno ? studentFilters : companyFilters;

  // Estados locais editáveis pré-populados do Zustand para persistência
  const [curso, setCurso] = useState(currentStoreFilters.curso || 'Todos os Cursos');
  const [area, setArea] = useState(currentStoreFilters.area || 'Todas as Áreas');
  const [modalidade, setModalidade] = useState(currentStoreFilters.modalidade || 'Todas');
  const [tipo, setTipo] = useState(currentStoreFilters.tipo || 'Todos');
  const [localizacao, setLocalizacao] = useState(currentStoreFilters.localizacao || 'Todas');
  const [faixa, setFaixa] = useState(currentStoreFilters.faixa || 'Qualquer valor');
  const [minBolsa, setMinBolsa] = useState<number>(currentStoreFilters.minBolsa || 0);
  const [competencias, setCompetencias] = useState<string[]>(currentStoreFilters.competencias || []);
  const [minMatch, setMinMatch] = useState<number>(currentStoreFilters.minMatch || 0);
  const [sortBy, setSortBy] = useState<SortOption>(currentStoreFilters.sortBy || 'relevancia');

  // Estados específicos de Empresa
  const [unidadeFatec, setUnidadeFatec] = useState(currentStoreFilters.unidadeFatec || 'Todas as Unidades');
  const [semestre, setSemestre] = useState(currentStoreFilters.semestre || 'Todos os Semestres');
  const [disponibilidade, setDisponibilidade] = useState(currentStoreFilters.disponibilidade || 'Todas');

  // Sincroniza se o store mudar externamente
  useEffect(() => {
    setCurso(currentStoreFilters.curso || 'Todos os Cursos');
    setArea(currentStoreFilters.area || 'Todas as Áreas');
    setModalidade(currentStoreFilters.modalidade || 'Todas');
    setTipo(currentStoreFilters.tipo || 'Todos');
    setLocalizacao(currentStoreFilters.localizacao || 'Todas');
    setFaixa(currentStoreFilters.faixa || 'Qualquer valor');
    setMinBolsa(currentStoreFilters.minBolsa || 0);
    setCompetencias(currentStoreFilters.competencias || []);
    setMinMatch(currentStoreFilters.minMatch || 0);
    setSortBy(currentStoreFilters.sortBy || 'relevancia');
    setUnidadeFatec(currentStoreFilters.unidadeFatec || 'Todas as Unidades');
    setSemestre(currentStoreFilters.semestre || 'Todos os Semestres');
    setDisponibilidade(currentStoreFilters.disponibilidade || 'Todas');
  }, [role]);

  // Opções para Alunos (Vagas)
  const cursosFatec = [
    'Todos os Cursos',
    'Análise e Desenvolvimento de Sistemas',
    'Agronegócio',
    'Gestão Empresarial (Presencial)',
    'Gestão Empresarial (EaD)',
    'Sistemas para Internet',
  ];

  const areasOportunidade = [
    'Todas as Áreas',
    'Tecnologia da Informação & Software',
    'Sistemas para Internet & Web',
    'Agronegócio & AgTech',
    'Gestão Empresarial & Negócios',
    'Dados & Business Intelligence',
    'Infraestrutura & Redes',
  ];

  const modalidades = ['Todas', 'Remoto', 'Híbrido', 'Presencial'];
  const tiposContrato = ['Todos', 'Estágio', 'Júnior', 'Trainee'];

  const faixasBolsa = [
    { label: 'Qualquer valor', val: 0 },
    { label: 'A partir de R$ 1.500', val: 1500 },
    { label: 'A partir de R$ 2.000', val: 2000 },
    { label: 'A partir de R$ 2.500+', val: 2500 },
  ];

  const localizacoes = [
    'Todas',
    'Jales',
    'Fernandópolis',
    'Santa Fé do Sul',
    'Votuporanga',
    'Urânia',
    'Palmeira d\'Oeste',
    'São José do Rio Preto',
    'Remoto',
  ];

  const techSkills = [
    'React / React Native',
    'Node.js',
    'TypeScript',
    'Python',
    'SQL / PostgreSQL',
    'Gestão do Agronegócio',
    'AgTech & Automação',
    'Gestão Financeira & RH',
    'Power BI & Analytics',
    'Metodologias Ágeis / Scrum',
    'Git & GitHub',
    'Linux & Redes',
  ];

  // Opções para Empresas (Candidatos)
  const unidadesFatec = [
    'Todas as Unidades',
    'Fatec Jales - Prof. José Camargo',
    'Fatec São José do Rio Preto',
    'Outras Unidades FATEC',
  ];

  const semestres = [
    'Todos os Semestres',
    '1º Semestre',
    '2º Semestre',
    '3º Semestre',
    '4º Semestre',
    '5º Semestre',
    '6º Semestre',
  ];

  const disponibilidades = ['Todas', 'Manhã', 'Tarde', 'Noite', 'Integral'];

  const matchOptions = [
    { label: 'Qualquer %', val: 0 },
    { label: '70%+ Match', val: 70 },
    { label: '80%+ Match', val: 80 },
    { label: '90%+ Match', val: 90 },
  ];

  const sortOptionsAluno: Array<{ id: SortOption; label: string; icon: any }> = [
    { id: 'relevancia', label: 'Maior Compatibilidade', icon: 'flame' },
    { id: 'recente', label: 'Mais Recentes', icon: 'time' },
    { id: 'maior_bolsa', label: 'Maior Bolsa', icon: 'cash' },
  ];

  const sortOptionsEmpresa: Array<{ id: SortOption; label: string; icon: any }> = [
    { id: 'relevancia', label: 'Maior Compatibilidade', icon: 'flame' },
    { id: 'recente', label: 'Mais Recentes', icon: 'time' },
    { id: 'semestre', label: 'Semestre Avançado', icon: 'school' },
  ];

  // Alternar seleção de competências (multi-select)
  const toggleCompetencia = (skill: string) => {
    if (competencias.includes(skill)) {
      setCompetencias(competencias.filter((s) => s !== skill));
    } else {
      setCompetencias([...competencias, skill]);
    }
  };

  // Cálculo ao vivo de resultados compatíveis (Live Counter)
  const matchingCount = useMemo(() => {
    if (isAluno) {
      if (!opportunities || opportunities.length === 0) return 0;
      return opportunities.filter((opp) => {
        if (curso !== 'Todos os Cursos') {
          const cClean = curso.toLowerCase().replace(/\s*\(.*\)/, '').trim();
          const cr = (opp.cursoRelacionado || '').toLowerCase();
          const ar = (opp.area || '').toLowerCase();
          const cg = (opp.cargo || '').toLowerCase();
          if (!cr.includes(cClean) && !ar.includes(cClean) && !cg.includes(cClean)) return false;
        }
        if (area !== 'Todas as Áreas') {
          const aClean = area.toLowerCase().trim();
          if (!(opp.area || '').toLowerCase().includes(aClean) && !(opp.cargo || '').toLowerCase().includes(aClean)) return false;
        }
        if (modalidade !== 'Todas' && (opp.modalidade || '').toLowerCase() !== modalidade.toLowerCase()) return false;
        if (tipo !== 'Todos' && (opp.tipo || '').toLowerCase() !== tipo.toLowerCase()) return false;
        if (localizacao !== 'Todas') {
          const locClean = localizacao.toLowerCase();
          if (!(opp.localizacao || '').toLowerCase().includes(locClean) && (opp.modalidade || '').toLowerCase() !== 'remoto') return false;
        }
        if (minBolsa > 0) {
          const digits = (opp.bolsa || '').split(',')[0].replace(/[^\d]/g, '');
          const val = digits ? parseInt(digits, 10) : 0;
          if (val < minBolsa) return false;
        }
        if (minMatch > 0 && (opp.matchScore || 0) < minMatch) return false;
        if (competencias.length > 0) {
          const reqs = (opp.requisitos || []).map((r) => r.toLowerCase());
          const desc = (opp.descricao || '').toLowerCase();
          const matchesAny = competencias.some((comp) => {
            const cNorm = comp.toLowerCase();
            return reqs.some((r) => r.includes(cNorm) || cNorm.includes(r)) || desc.includes(cNorm);
          });
          if (!matchesAny) return false;
        }
        return true;
      }).length;
    } else {
      if (!candidates || candidates.length === 0) return 0;
      return candidates.filter((cand) => {
        if (curso !== 'Todos os Cursos') {
          const cClean = curso.toLowerCase().replace(/\s*\(.*\)/, '').trim();
          if (!(cand.curso || '').toLowerCase().includes(cClean)) return false;
        }
        if (unidadeFatec !== 'Todas as Unidades') {
          if (!(cand.unidadeFatec || '').toLowerCase().includes(unidadeFatec.toLowerCase())) return false;
        }
        if (semestre !== 'Todos os Semestres') {
          const num = semestre.replace(/\D/g, '');
          if (num && !(cand.semestre || '').includes(num)) return false;
        }
        if (disponibilidade !== 'Todas') {
          if ((cand.disponibilidade || '').toLowerCase() !== disponibilidade.toLowerCase()) return false;
        }
        if (localizacao !== 'Todas') {
          const locClean = localizacao.toLowerCase();
          const candLoc = (cand.localizacao || '').toLowerCase();
          const candUnit = (cand.unidadeFatec || '').toLowerCase();
          if (!candLoc.includes(locClean) && !candUnit.includes(locClean)) return false;
        }
        if (minMatch > 0 && (cand.matchScore || 0) < minMatch) return false;
        if (competencias.length > 0) {
          const candSkills = (cand.competencias || []).map((c) => c.toLowerCase());
          const sobre = (cand.sobre || '').toLowerCase();
          const matchesAny = competencias.some((comp) => {
            const cNorm = comp.toLowerCase();
            return candSkills.some((s) => s.includes(cNorm) || cNorm.includes(s)) || sobre.includes(cNorm);
          });
          if (!matchesAny) return false;
        }
        return true;
      }).length;
    }
  }, [
    isAluno,
    opportunities,
    candidates,
    curso,
    area,
    modalidade,
    tipo,
    localizacao,
    minBolsa,
    competencias,
    minMatch,
    unidadeFatec,
    semestre,
    disponibilidade,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (curso !== 'Todos os Cursos') count++;
    if (area !== 'Todas as Áreas') count++;
    if (modalidade !== 'Todas') count++;
    if (tipo !== 'Todos') count++;
    if (localizacao !== 'Todas') count++;
    if (faixa !== 'Qualquer valor') count++;
    if (minBolsa > 0) count++;
    if (competencias.length > 0) count += competencias.length;
    if (minMatch > 0) count++;
    if (sortBy !== 'relevancia') count++;
    if (unidadeFatec !== 'Todas as Unidades') count++;
    if (semestre !== 'Todos os Semestres') count++;
    if (disponibilidade !== 'Todas') count++;
    return count;
  }, [
    curso,
    area,
    modalidade,
    tipo,
    localizacao,
    faixa,
    minBolsa,
    competencias,
    minMatch,
    sortBy,
    unidadeFatec,
    semestre,
    disponibilidade,
  ]);

  const handleApply = () => {
    const payload: FeedFilterCriteria = {
      curso,
      area: isAluno ? area : undefined,
      modalidade: isAluno ? modalidade : undefined,
      tipo: isAluno ? tipo : undefined,
      localizacao: localizacao !== 'Todas' ? localizacao : undefined,
      faixa: isAluno ? faixa : undefined,
      minBolsa: isAluno ? minBolsa : undefined,
      competencias,
      minMatch,
      sortBy,
      unidadeFatec: !isAluno ? (unidadeFatec !== 'Todas as Unidades' ? unidadeFatec : undefined) : undefined,
      semestre: !isAluno ? (semestre !== 'Todos os Semestres' ? semestre : undefined) : undefined,
      disponibilidade: !isAluno ? (disponibilidade !== 'Todas' ? disponibilidade : undefined) : undefined,
    };

    if (isAluno) {
      setStudentFilters(payload);
    } else {
      setCompanyFilters(payload);
    }

    onApplyFilters(payload);
  };

  const handleClear = () => {
    if (isAluno) {
      resetStudentFilters();
    } else {
      resetCompanyFilters();
    }

    setCurso('Todos os Cursos');
    setArea('Todas as Áreas');
    setModalidade('Todas');
    setTipo('Todos');
    setLocalizacao('Todas');
    setFaixa('Qualquer valor');
    setMinBolsa(0);
    setCompetencias([]);
    setMinMatch(0);
    setSortBy('relevancia');
    setUnidadeFatec('Todas as Unidades');
    setSemestre('Todos os Semestres');
    setDisponibilidade('Todas');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>FILTROS INTELIGENTES</Text>
              {activeFiltersCount > 0 && (
                <View style={styles.activePillBadge}>
                  <Text style={styles.activePillBadgeText}>{activeFiltersCount} ativos</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              {isAluno
                ? 'Personalize e ordene as oportunidades de acordo com seus objetivos e cursos na FATEC.'
                : 'Filtre e selecione os estudantes com as qualificações ideias para sua empresa.'}
            </Text>
          </View>

          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.clearBtnText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1. SEÇÃO DE ORDENAÇÃO */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="swap-vertical" size={17} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Ordenar Feed Por</Text>
          </View>
          <View style={styles.chipsRowWrap}>
            {(isAluno ? sortOptionsAluno : sortOptionsEmpresa).map((opt) => {
              const isSelected = sortBy === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.sortChip, isSelected && styles.sortChipSelected]}
                  onPress={() => setSortBy(opt.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={opt.icon}
                    size={14}
                    color={isSelected ? '#FFFFFF' : Colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.sortChipText, isSelected && styles.sortChipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. COMPATIBILIDADE MÍNIMA (MATCH ENGINE) */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={17} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Compatibilidade Mínima (Match)</Text>
          </View>
          <View style={styles.chipsRowWrap}>
            {matchOptions.map((opt) => {
              const isSelected = minMatch === opt.val;
              return (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setMinMatch(opt.val)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. CURSO FATEC */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={17} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Curso de Graduação FATEC</Text>
          </View>
          <View style={styles.chipsRowWrap}>
            {cursosFatec.map((item, idx) => {
              const isSelected = curso === item;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setCurso(item)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SEÇÕES ESPECÍFICAS DE ALUNO (VAGAS) */}
        {isAluno && (
          <>
            {/* ÁREA PROFISSIONAL */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="layers-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Área da Oportunidade</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {areasOportunidade.map((item, idx) => {
                  const isSelected = area === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setArea(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* MODALIDADE DE TRABALHO */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="laptop-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Modalidade de Trabalho</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {modalidades.map((item, idx) => {
                  const isSelected = modalidade === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setModalidade(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* TIPO DE OPORTUNIDADE */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="briefcase-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Tipo de Contrato</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {tiposContrato.map((item, idx) => {
                  const isSelected = tipo === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setTipo(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* FAIXA DE BOLSA-AUXÍLIO */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash-outline" size={17} color="#10B981" />
                <Text style={styles.sectionTitle}>Faixa de Bolsa-Auxílio Mínima</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {faixasBolsa.map((item, idx) => {
                  const isSelected = minBolsa === item.val;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => {
                        setMinBolsa(item.val);
                        setFaixa(item.label);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* LOCALIZAÇÃO */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={17} color="#EF4444" />
                <Text style={styles.sectionTitle}>Localização da Vaga</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {localizacoes.map((item, idx) => {
                  const isSelected = localizacao === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setLocalizacao(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* SEÇÕES ESPECÍFICAS DE EMPRESA (CANDIDATOS) */}
        {!isAluno && (
          <>
            {/* UNIDADE FATEC */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Unidade FATEC do Estudante</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {unidadesFatec.map((item, idx) => {
                  const isSelected = unidadeFatec === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setUnidadeFatec(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SEMESTRE */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Semestre Atual</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {semestres.map((item, idx) => {
                  const isSelected = semestre === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setSemestre(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DISPONIBILIDADE DE HORÁRIO */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Disponibilidade de Horário</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {disponibilidades.map((item, idx) => {
                  const isSelected = disponibilidade === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setDisponibilidade(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* CIDADE / REGIÃO DE ORIGEM DO ALUNO */}
            <View style={styles.filterSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={17} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Cidade de Origem / Região do Aluno</Text>
              </View>
              <View style={styles.chipsRowWrap}>
                {localizacoes.map((item, idx) => {
                  const isSelected = localizacao === item;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setLocalizacao(item)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* 4. COMPETÊNCIAS / TECNOLOGIAS (MULTI-SELECT) */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="code-slash-outline" size={17} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              {isAluno ? 'Tecnologias Exigidas na Vaga' : 'Competências do Candidato'}
            </Text>
          </View>
          <Text style={styles.sectionHelp}>
            Toque para selecionar múltiplas tecnologias para filtrar resultados.
          </Text>
          <View style={styles.chipsRowWrap}>
            {techSkills.map((skill, idx) => {
              const isSelected = competencias.includes(skill);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, isSelected && styles.chipSkillSelected]}
                  onPress={() => toggleCompetencia(skill)}
                  activeOpacity={0.75}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* BARRA INFERIOR FIXA DE AÇÃO COM CONTADOR */}
      <View style={styles.bottomBar}>
        <View style={styles.counterRow}>
          <Ionicons
            name={isAluno ? 'briefcase' : 'people'}
            size={16}
            color={matchingCount > 0 ? '#10B981' : '#EF4444'}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.counterText}>
            {matchingCount > 0
              ? `${matchingCount} ${isAluno ? (matchingCount === 1 ? 'vaga encontrada' : 'vagas encontradas') : (matchingCount === 1 ? 'candidato encontrado' : 'candidatos encontrados')}`
              : `Nenhuma correspondência com os filtros atuais`}
          </Text>
        </View>

        <View style={styles.footerInner}>
          <TouchableOpacity
            style={[styles.applyButton, matchingCount === 0 && styles.applyButtonDisabled]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Ionicons name="filter" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.applyButtonText}>
              APLICAR FILTROS ({matchingCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 110,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  activePillBadge: {
    backgroundColor: 'rgba(217, 30, 24, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activePillBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSection: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionHelp: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
  },
  chipsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipSkillSelected: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sortChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  sortChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  footerInner: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 24,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  applyButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
