import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Opportunity } from '../types';

const { width } = Dimensions.get('window');

interface OpportunityCardProps {
  opportunity: Opportunity;
  onLike: () => void;
  onDislike: () => void;
  onPressDetails: () => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onLike,
  onDislike,
  onPressDetails,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Imagem / Foto Empresa */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: opportunity.imagemUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.gradientOverlay} />

        {/* Tag de Match / Compatibilidade */}
        <View style={styles.matchBadge}>
          <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.matchScoreText}>{opportunity.matchScore}% Compatível</Text>
        </View>

        {/* Modalidade */}
        <View style={styles.modalityBadge}>
          <Text style={styles.modalityText}>{opportunity.modalidade}</Text>
        </View>
      </View>

      {/* Conteúdo do Card */}
      <TouchableOpacity
        style={styles.infoSection}
        onPress={onPressDetails}
        activeOpacity={0.9}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.companyName}>{opportunity.nomeFantasia}</Text>
          <Text style={styles.roleTitle}>{opportunity.cargo}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{opportunity.localizacao}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.like} />
            <Text style={[styles.metaText, { color: Colors.like, fontWeight: '700' }]}>
              {opportunity.bolsa}
            </Text>
          </View>
        </View>

        {/* Descrição resumida */}
        <Text style={styles.description} numberOfLines={2}>
          {opportunity.descricao}
        </Text>

        {/* Requisitos / Tags */}
        <View style={styles.tagsContainer}>
          {opportunity.requisitos.slice(0, 2).map((req, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>{req}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Botões de Ação do Figma: "NÃO TENHO INTERESSE" e "TENHO INTERESSE" */}
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
          style={styles.likeButton}
          onPress={onLike}
          activeOpacity={0.8}
        >
          <Ionicons name="heart" size={22} color="#FFFFFF" />
          <Text style={styles.likeText}>TENHO INTERESSE</Text>
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
  modalityBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalityText: {
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
  companyName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginVertical: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '90%',
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
  likeButton: {
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
  likeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
