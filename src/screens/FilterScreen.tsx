import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { UserRole } from '../types';

interface FilterScreenProps {
  role: UserRole;
  onApplyFilters: (filters: any) => void;
  onClose?: () => void;
}

export const FilterScreen: React.FC<FilterScreenProps> = ({
  role,
  onApplyFilters,
}) => {
  const isAluno = role === 'aluno';

  // Opções de Cursos FATEC
  const cursosFatec = [
    'Todos os Cursos',
    'Análise e Desenvolvimento de Sistemas (ADS)',
    'Desenvolvimento de Software Multiplataforma (DSM)',
    'Gestão Empresarial',
    'Banco de Dados / Big Data',
    'Gestão da Tecnologia da Informação (GTI)',
    'Logística',
    'Comércio Exterior',
  ];

  // Modalidades
  const modalidades = ['Todas', 'Remoto', 'Híbrido', 'Presencial'];

  // Tipos de Contrato
  const tiposContrato = ['Todos', 'Estágio', 'Júnior', 'Trainee'];

  // Faixa de Bolsa
  const faixasBolsa = [
    'Qualquer valor',
    'A partir de R$ 1.500',
    'A partir de R$ 2.000',
    'A partir de R$ 2.500+',
  ];

  const [selectedCurso, setSelectedCurso] = useState('Todos os Cursos');
  const [selectedModalidade, setSelectedModalidade] = useState('Todas');
  const [selectedTipo, setSelectedTipo] = useState('Todos');
  const [selectedFaixa, setSelectedFaixa] = useState('Qualquer valor');

  const handleApply = () => {
    onApplyFilters({
      curso: selectedCurso,
      modalidade: selectedModalidade,
      tipo: selectedTipo,
      faixa: selectedFaixa,
    });
  };

  const handleClear = () => {
    setSelectedCurso('Todos os Cursos');
    setSelectedModalidade('Todas');
    setSelectedTipo('Todos');
    setSelectedFaixa('Qualquer valor');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>FILTRAR</Text>
          <Text style={styles.subtitle}>
            {isAluno
              ? 'Personalize as oportunidades que melhor combinam com seus estudos na FATEC.'
              : 'Defina os critérios para filtrar estudantes e candidatos ideais.'}
          </Text>
        </View>

        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Seção Cursos FATEC */}
      <View style={styles.filterSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="school-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Curso de Graduação FATEC</Text>
        </View>
        <View style={styles.chipsContainer}>
          {cursosFatec.map((curso, idx) => {
            const isSelected = selectedCurso === curso;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedCurso(curso)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {curso}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção Modalidade de Trabalho */}
      <View style={styles.filterSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="laptop-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Modalidade de Trabalho</Text>
        </View>
        <View style={styles.chipsRow}>
          {modalidades.map((mod, idx) => {
            const isSelected = selectedModalidade === mod;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedModalidade(mod)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {mod}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção Tipo de Contrato */}
      <View style={styles.filterSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase-outline" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Tipo de Oportunidade</Text>
        </View>
        <View style={styles.chipsRow}>
          {tiposContrato.map((tipo, idx) => {
            const isSelected = selectedTipo === tipo;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedTipo(tipo)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {tipo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Seção Faixa de Bolsa */}
      <View style={styles.filterSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={18} color={Colors.like} />
          <Text style={styles.sectionTitle}>Faixa de Bolsa-Auxílio</Text>
        </View>
        <View style={styles.chipsContainer}>
          {faixasBolsa.map((faixa, idx) => {
            const isSelected = selectedFaixa === faixa;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedFaixa(faixa)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {faixa}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Botão Aplicar Filtro do Figma */}
      <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.85}>
        <Ionicons name="filter" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.applyButtonText}>APLICAR FILTROS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    maxWidth: '85%',
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.dislike,
    fontWeight: '700',
  },
  filterSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.inputBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 26,
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

