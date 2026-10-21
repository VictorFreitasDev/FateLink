import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { Colors } from '../../theme/colors';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface AvatarProps {
  source?: ImageSourcePropType | { uri: string };
  name?: string;
  size?: AvatarSize;
  showOnline?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
  xxl: 96,
};

const FONT_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 15,
  lg: 20,
  xl: 26,
  xxl: 34,
};

// Deterministic pastel color palette for initials
const BG_PALETTE = [
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#7C3AED', // Violet
  '#D97706', // Amber
  '#DC2626', // Red
  '#059669', // Emerald
  '#4F46E5', // Indigo
  '#DB2777', // Pink
];

function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getBgColor(name?: string): string {
  if (!name) return Colors.primary;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BG_PALETTE.length;
  return BG_PALETTE[index];
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  showOnline = false,
  isOnline = false,
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const px = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const initials = getInitials(name);
  const bgColor = getBgColor(name);

  const hasValidUri =
    Boolean(source) &&
    typeof source === 'object' &&
    'uri' in source &&
    Boolean(source.uri && source.uri.trim());

  const canShowImage = Boolean(source) && !imageError && (hasValidUri || typeof source === 'number');

  const indicatorSize = Math.max(8, Math.round(px * 0.26));

  return (
    <View style={[styles.container, { width: px, height: px, borderRadius: px / 2 }, style]}>
      {canShowImage ? (
        <Image
          source={source!}
          style={[styles.image, { width: px, height: px, borderRadius: px / 2 }]}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallbackContainer,
            {
              width: px,
              height: px,
              borderRadius: px / 2,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {showOnline && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              backgroundColor: isOnline ? Colors.success : Colors.textMuted,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: Colors.surfaceSecondary,
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

