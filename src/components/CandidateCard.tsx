import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  onPropose: () => void;
  onDislike: () => void;
  onPressDetails: () => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onPropose,
  onDislike,
  onPressDetails,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Imagem / Foto do Candidato */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: candidate.imagemUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.gradientOverlay} />

        {/* Tag de Match / Compatibilidade */}
        <View style={styles.matchBadge}>
          <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.matchScoreText}>{candidate.matchScore}% Compatível</Text>
        </View>

        {/* Unidade Fatec */}
        <View style={styles.fatecBadge}>
          <Ionicons name="school-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.fatecText}>{candidate.unidadeFatec}</Text>
        </View>
      </View>

      {/* Conteúdo do Card */}
      <TouchableOpacity
        style={styles.infoSection}
        onPress={onPressDetails}
        activeOpacity={0.9}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.candidateName}>
            {candidate.nome}, {candidate.idade} anos
          </Text>
          <Text style={styles.courseTitle}>{candidate.curso}</Text>
          <Text style={styles.semesterText}>{candidate.semestre} • Disp: {candidate.disponibilidade}</Text>
        </View>

        {/* Sobre resumido */}
        <Text style={styles.description} numberOfLines={2}>
          {candidate.sobre}
        </Text>

        {/* Competências / Tags */}
        <View style={styles.tagsContainer}>
          {candidate.competencias.slice(0, 4).map((comp, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{comp}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Botões de Ação do Figma: "NÃO TENHO INTERESSE" e "ENVIAR PROPOSTA" */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.dislikeButton}
          onPress={onDislike}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color={Colors.dislike} />
          <Text style={styles.dislikeText}>NÃO TENHO INTERESSE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.proposeButton}
          onPress={onPropose}
          activeOpacity={0.8}
        >
          <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
          <Text style={styles.proposeText}>ENVIAR PROPOSTA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  imageContainer: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  matchScoreText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  fatecBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fatecText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
  },
  headerInfo: {
    marginBottom: 6,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  semesterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginVertical: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 10,
  },
  dislikeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dislikeBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 6,
  },
  dislikeText: {
    color: Colors.dislike,
    fontSize: 12,
    fontWeight: '800',
  },
  proposeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    gap: 6,
  },
  proposeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
