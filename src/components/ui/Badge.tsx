import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing } from '../../theme/spacing';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  showDot?: boolean;
  onRemove?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon,
  showDot = false,
  onRemove,
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: Colors.primaryLight, text: Colors.primaryDark, dot: Colors.primary };
      case 'secondary':
        return { bg: Colors.secondaryLight, text: Colors.secondaryDark, dot: Colors.secondary };
      case 'success':
        return { bg: Colors.successLight, text: Colors.successDark, dot: Colors.success };
      case 'warning':
        return { bg: Colors.warningLight, text: Colors.warningDark, dot: Colors.warning };
      case 'danger':
        return { bg: Colors.errorLight, text: Colors.errorDark, dot: Colors.error };
      case 'info':
        return { bg: Colors.infoLight, text: Colors.infoDark, dot: Colors.info };
      case 'neutral':
      default:
        return { bg: Colors.surfaceSecondary, text: Colors.textSecondary, dot: Colors.textMuted };
    }
  };

  const colors = getColors();

  const iconSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;

  return (
    <View
      style={[
        styles.base,
        styles[size],
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      )}

      {icon && (
        <Ionicons
          name={icon}
          size={iconSize}
          color={colors.text}
          style={styles.icon}
        />
      )}

      <Text
        style={[
          styles.textBase,
          styles[`text_${size}`],
          { color: colors.text },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={styles.removeBtn}
          accessibilityRole="button"
          accessibilityLabel={`Remover ${label}`}
        >
          <Ionicons name="close" size={iconSize + 2} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
  },
  lg: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  textBase: {
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 10,
    lineHeight: 14,
  },
  text_md: {
    fontSize: 12,
    lineHeight: 16,
  },
  text_lg: {
    fontSize: 14,
    lineHeight: 18,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  icon: {
    marginRight: 4,
  },
  removeBtn: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

