import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { MatchBreakdown } from '../types';

interface MatchBreakdownCardProps {
  score: number;
  nivel?: 'excelente' | 'alto' | 'moderado' | 'baixo';
  breakdown?: MatchBreakdown;
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  improvements?: string[];
  explanations?: string[];
  isBlocked?: boolean;
  blockReasons?: string[];
  initialExpanded?: boolean;
}

export const MatchBreakdownCard: React.FC<MatchBreakdownCardProps> = ({
  score,
  nivel,
  breakdown,
  matchedSkills = [],
  missingSkills = [],
  strengths = [],
  improvements = [],
  explanations = [],
  isBlocked = false,
  blockReasons = [],
  initialExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  // Paleta dinâmica por nível de afinidade
  const getBadgeConfig = () => {
    if (score >= 80) {
      return {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        label: 'Match Excelente',
        icon: 'sparkles',
      };
    }
    if (score >= 65) {
      return {
        color: '#0EA5E9',
        bg: 'rgba(14, 165, 233, 0.12)',
        border: 'rgba(14, 165, 233, 0.3)',
        label: 'Match Alto',
        icon: 'ribbon-outline',
      };
    }
    if (score >= 45) {
      return {
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        label: 'Match Moderado',
        icon: 'trending-up-outline',
      };
    }
    return {
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
      label: 'Match Baixo',
      icon: 'alert-circle-outline',
    };
  };

  const badge = getBadgeConfig();

  // Categorias de pontuação máxima
  const categories = [
    {
      key: 'competencias',
      label: 'Competências Técnicas',
      value: breakdown?.competencias ?? Math.round(score * 0.35),
      max: 35,
      icon: 'code-slash-outline',
    },
    {
      key: 'formacao',
      label: 'Curso FATEC & Semestre',
      value: breakdown?.formacao ?? Math.round(score * 0.2),
      max: 20,
      icon: 'school-outline',
    },
    {
      key: 'experiencia',
      label: 'Projetos & Portfólio',
      value: breakdown?.experiencia ?? Math.round(score * 0.15),
      max: 15,
      icon: 'briefcase-outline',
    },
    {
      key: 'disponibilidade',
      label: 'Disponibilidade de Turno',
      value: breakdown?.disponibilidade ?? Math.round(score * 0.15),
      max: 15,
      icon: 'time-outline',
    },
    {
      key: 'localizacao',
      label: 'Modalidade & Localização',
      value: breakdown?.localizacao ?? Math.round(score * 0.15),
      max: 15,
      icon: 'location-outline',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Cabeçalho do Diagnóstico com Score */}
      <View style={styles.headerRow}>
        <View style={styles.scoreCircleCol}>
          <View style={[styles.scoreBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.scoreText, { color: badge.color }]}>{score}%</Text>
          </View>
        </View>

        <View style={styles.headerInfoCol}>
          <View style={styles.badgePillRow}>
            <View style={[styles.badgePill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Ionicons name={badge.icon as any} size={13} color={badge.color} style={{ marginRight: 4 }} />
              <Text style={[styles.badgePillText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>
          <Text style={styles.headerSummary} numberOfLines={2}>
            {explanations[0] || 'Diagnóstico de compatibilidade baseado no perfil acadêmico FATEC.'}
          </Text>
        </View>
      </View>

      {/* Alerta de Critério Eliminatório / Bloqueador */}
      {isBlocked && blockReasons.length > 0 && (
        <View style={styles.blockerAlertBox}>
          <Ionicons name="warning-outline" size={16} color="#EF4444" style={{ marginTop: 2, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.blockerAlertTitle}>Atenção ao Requisito Eliminatório</Text>
            <Text style={styles.blockerAlertDesc}>{blockReasons[0]}</Text>
          </View>
        </View>
      )}

      {/* Botão de Expandir / Recolher para não poluir a tela */}
      <TouchableOpacity
        style={styles.toggleDetailsBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleDetailsText}>
          {expanded ? 'Ocultar Diagnóstico Detalhado' : 'Ver Diagnóstico Completo por Categoria'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Colors.primary}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      {/* Conteúdo Expandido */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* 1. Barras de Progresso por Categoria */}
          <Text style={styles.sectionSubtitle}>PONTUAÇÃO POR CATEGORIA</Text>
          <View style={styles.barsList}>
            {categories.map((cat) => {
              const pct = Math.min(100, Math.max(0, Math.round((cat.value / cat.max) * 100)));
              return (
                <View key={cat.key} style={styles.barItemRow}>
                  <View style={styles.barLabelRow}>
                    <View style={styles.barIconTitleGroup}>
                      <Ionicons name={cat.icon as any} size={14} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.barTitleText}>{cat.label}</Text>
                    </View>
                    <Text style={styles.barPointsText}>
                      {cat.value}/{cat.max} pts
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: pct >= 75 ? '#10B981' : pct >= 50 ? '#0EA5E9' : '#F59E0B',
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* 2. Competências Compatíveis */}
          {matchedSkills.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.sectionSubtitle}>COMPETÊNCIAS COMPATÍVEIS ({matchedSkills.length})</Text>
              <View style={styles.chipsWrap}>
                {matchedSkills.map((skill, i) => (
                  <View key={i} style={styles.matchedChip}>
                    <Ionicons name="checkmark-circle" size={13} color="#10B981" style={{ marginRight: 4 }} />
                    <Text style={styles.matchedChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 3. Competências Desejáveis / Requisitos Ausentes */}
          {missingSkills.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.sectionSubtitle}>DIFERENCIAIS A DESENVOLVER</Text>
              <View style={styles.chipsWrap}>
                {missingSkills.map((skill, i) => (
                  <View key={i} style={styles.missingChip}>
                    <Ionicons name="bulb-outline" size={13} color="#F59E0B" style={{ marginRight: 4 }} />
                    <Text style={styles.missingChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 4. Pontos Fortes e Dicas */}
          {(strengths.length > 0 || improvements.length > 0) && (
            <View style={styles.insightsSection}>
              {strengths.slice(0, 2).map((str, i) => (
                <View key={`str-${i}`} style={styles.insightRow}>
                  <Ionicons name="star" size={13} color="#10B981" style={{ marginTop: 2, marginRight: 6 }} />
                  <Text style={styles.insightText}>{str}</Text>
                </View>
              ))}
              {improvements.slice(0, 2).map((imp, i) => (
                <View key={`imp-${i}`} style={styles.insightRow}>
                  <Ionicons name="arrow-forward-circle-outline" size={13} color="#0EA5E9" style={{ marginTop: 2, marginRight: 6 }} />
                  <Text style={styles.insightText}>{imp}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircleCol: {
    marginRight: 14,
  },
  scoreBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerInfoCol: {
    flex: 1,
  },
  badgePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSummary: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  blockerAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  blockerAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 2,
  },
  blockerAlertDesc: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 16,
  },
  toggleDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  toggleDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  expandedContent: {
    marginTop: 14,
    paddingTop: 6,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  barsList: {
    gap: 10,
    marginBottom: 14,
  },
  barItemRow: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barIconTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  barPointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  skillsSection: {
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  matchedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  missingChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  insightsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },
});

