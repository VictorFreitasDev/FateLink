import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Radii, Spacing } from '../../theme/spacing';

export type SkeletonVariant = 'rectangular' | 'circular' | 'text' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> & {
  Card: React.FC<{ style?: StyleProp<ViewStyle> }>;
  TextRow: React.FC<{ lines?: number; style?: StyleProp<ViewStyle> }>;
} = ({
  variant = 'rectangular',
  width,
  height,
  borderRadius,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circular': {
        const size = (width || height || 40) as number;
        return {
          width: size,
          height: size,
          borderRadius: typeof size === 'number' ? size / 2 : Radii.full,
        };
      }
      case 'text':
        return {
          width: width || '100%',
          height: height || 16,
          borderRadius: borderRadius ?? Radii.xs,
          marginVertical: 4,
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || 180,
          borderRadius: borderRadius ?? Radii.lg,
        };
      case 'rectangular':
      default:
        return {
          width: width || '100%',
          height: height || 40,
          borderRadius: borderRadius ?? Radii.md,
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        getVariantStyles(),
        { opacity: opacityAnim },
        style,
      ]}
    />
  );
};

const SkeletonCard: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.cardContainer, style]}>
    <View style={styles.cardHeader}>
      <Skeleton variant="circular" width={48} height={48} />
      <View style={styles.cardHeaderText}>
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="text" width="40%" height={12} />
      </View>
    </View>
    <Skeleton variant="text" width="95%" height={14} />
    <Skeleton variant="text" width="80%" height={14} />
    <View style={styles.badgeRow}>
      <Skeleton width={60} height={22} borderRadius={11} />
      <Skeleton width={70} height={22} borderRadius={11} />
      <Skeleton width={50} height={22} borderRadius={11} />
    </View>
  </View>
);

const SkeletonTextRow: React.FC<{ lines?: number; style?: StyleProp<ViewStyle> }> = ({
  lines = 3,
  style,
}) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, idx) => (
      <Skeleton
        key={idx}
        variant="text"
        width={idx === lines - 1 ? '60%' : '100%'}
        height={14}
      />
    ))}
  </View>
);

Skeleton.Card = SkeletonCard;
Skeleton.TextRow = SkeletonTextRow;

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: Colors.border,
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
});

