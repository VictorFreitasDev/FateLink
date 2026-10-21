import React from 'react';
import { View, Text, Modal, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Opportunity, Candidate } from '../types';

interface ModalDetailsProps {
  visible: boolean;
  onClose: () => void;
  opportunity?: Opportunity | null;
  candidate?: Candidate | null;
  onAction: () => void;
  actionLabel: string;
}

const { height } = Dimensions.get('window');

export const ModalDetails: React.FC<ModalDetailsProps> = ({
  visible,
  onClose,
  opportunity,
  candidate,
  onAction,
  actionLabel,
}) => {
  if (!opportunity && !candidate) return null;

  const isOpportunity = !!opportunity;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header do Modal com botão fechar */}
          <View style={styles.sheetHeader}>
            <View style={styles.handleBar} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Foto de Destaque */}
            <Image
              source={{ uri: isOpportunity ? opportunity!.imagemUrl : candidate!.imagemUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />

            {/* Conteúdo Oportunidade */}
            {isOpportunity && opportunity && (
              <View style={styles.contentBody}>
                <View style={styles.titleSection}>
                  <Text style={styles.badgeTextTop}>{opportunity.nomeFantasia}</Text>
                  <Text style={styles.mainTitle}>{opportunity.cargo}</Text>
                  <Text style={styles.companySub}>{opportunity.empresa} • {opportunity.localizacao}</Text>
                </View>

                {/* Métricas rápidas */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Bolsa-Auxílio</Text>
                    <Text style={[styles.metricValue, { color: Colors.like }]}>{opportunity.bolsa}</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Modalidade</Text>
                    <Text style={styles.metricValue}>{opportunity.modalidade}</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Tipo</Text>
                    <Text style={styles.metricValue}>{opportunity.tipo}</Text>
                  </View>
                </View>

                {/* Diagnóstico do Match Real com Justificativas */}
                {opportunity.matchExplanations && opportunity.matchExplanations.length > 0 && (
                  <View style={styles.matchExplBox}>
                    <View style={styles.matchExplHeader}>
                      <Ionicons name="sparkles" size={16} color={Colors.primary} />
                      <Text style={styles.matchExplTitle}>Diagnóstico de Afinidade FATEC ({opportunity.matchScore}%)</Text>
                    </View>
                    {opportunity.matchExplanations.map((exp, idx) => (
                      <View key={idx} style={styles.matchExplRow}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.like} style={{ marginTop: 2 }} />
                        <Text style={styles.matchExplText}>{exp}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Descrição */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Sobre a Oportunidade</Text>
                  <Text style={styles.bodyText}>{opportunity.descricao}</Text>
                </View>

                {/* Requisitos */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Requisitos & Competências</Text>
                  {opportunity.requisitos.map((req, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={{ marginTop: 2 }} />
                      <Text style={styles.bulletText}>{req}</Text>
                    </View>
                  ))}
                </View>

                {/* Benefícios */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Benefícios Oferecidos</Text>
                  {opportunity.beneficios.map((ben, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="gift-outline" size={18} color={Colors.like} style={{ marginTop: 2 }} />
                      <Text style={styles.bulletText}>{ben}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Conteúdo Candidato */}
            {!isOpportunity && candidate && (
              <View style={styles.contentBody}>
                <View style={styles.titleSection}>
                  <Text style={styles.badgeTextTop}>{candidate.unidadeFatec}</Text>
                  <Text style={styles.mainTitle}>{candidate.nome}, {candidate.idade} anos</Text>
                  <Text style={styles.companySub}>{candidate.curso} • {candidate.semestre}</Text>
                </View>

                {/* Métricas rápidas */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Disponibilidade</Text>
                    <Text style={styles.metricValue}>{candidate.disponibilidade}</Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Match Fatec</Text>
                    <Text style={[styles.metricValue, { color: Colors.primary }]}>{candidate.matchScore}%</Text>
                  </View>
                </View>

                {/* Biografia / Sobre */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Apresentação</Text>
                  <Text style={styles.bodyText}>{candidate.sobre}</Text>
                </View>

                {/* Competências */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>Competências Técnicas</Text>
                  <View style={styles.tagsGrid}>
                    {candidate.competencias.map((comp, i) => (
                      <View key={i} style={styles.badgeItem}>
                        <Text style={styles.badgeItemText}>{comp}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Experiências Profissionais */}
                {Array.isArray(candidate.experiencias) && candidate.experiencias.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Experiência Profissional</Text>
                    {candidate.experiencias.map((exp, i) => (
                      <View key={i} style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{exp.cargo}</Text>
                          <Text style={styles.itemPeriod}>{exp.periodo}</Text>
                        </View>
                        <Text style={styles.itemSubtitle}>{exp.empresa}</Text>
                        {exp.descricao ? <Text style={styles.itemDesc}>{exp.descricao}</Text> : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Projetos em Destaque */}
                {Array.isArray(candidate.projetos) && candidate.projetos.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Projetos Relevantes</Text>
                    {candidate.projetos.map((proj, i) => (
                      <View key={i} style={styles.itemCard}>
                        <Text style={styles.itemTitle}>{proj.titulo}</Text>
                        <Text style={styles.itemDesc}>{proj.descricao}</Text>
                        {proj.link ? (
                          <Text style={styles.itemLink}>🔗 {proj.link}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Certificações */}
                {Array.isArray(candidate.certificacoes) && candidate.certificacoes.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Certificações & Cursos</Text>
                    {candidate.certificacoes.map((cert, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Ionicons name="ribbon-outline" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.bulletText}>{cert}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Links */}
                {(candidate.github || candidate.linkedin) && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>Links Profissionais</Text>
                    {candidate.github && (
                      <View style={styles.linkRow}>
                        <Ionicons name="logo-github" size={18} color={Colors.textPrimary} />
                        <Text style={styles.linkText}>{candidate.github}</Text>
                      </View>
                    )}
                    {candidate.linkedin && (
                      <View style={styles.linkRow}>
                        <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
                        <Text style={styles.linkText}>{candidate.linkedin}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Rodapé fixo de Ação */}
          <View style={styles.footerAction}>
            <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.85}>
              <Text style={styles.actionBtnText}>{actionLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.88,
    minHeight: height * 0.65,
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E2E8F0',
  },
  contentBody: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  badgeTextTop: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  companySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  matchExplBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  matchExplHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  matchExplTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  matchExplRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  matchExplText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeItem: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeItemText: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.inputBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  linkText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemPeriod: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  itemLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  footerAction: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

