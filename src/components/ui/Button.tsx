import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Shadows } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base, styles[size]];

    switch (variant) {
      case 'primary':
        list.push(styles.primary, Shadows.sm);
        break;
      case 'secondary':
        list.push(styles.secondary);
        break;
      case 'outline':
        list.push(styles.outline);
        break;
      case 'ghost':
        list.push(styles.ghost);
        break;
      case 'danger':
        list.push(styles.danger, Shadows.sm);
        break;
      case 'success':
        list.push(styles.success, Shadows.sm);
        break;
    }

    if (fullWidth) list.push(styles.fullWidth);
    if (disabled || loading) list.push(styles.disabled);
    if (style) list.push(style);

    return list;
  };

  const getTextColor = (): string => {
    if (disabled) return Colors.placeholder;
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return '#FFFFFF';
      case 'secondary':
        return Colors.primaryDark;
      case 'outline':
      case 'ghost':
        return Colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {iconLeft && (
            <Ionicons
              name={iconLeft}
              size={iconSize}
              color={textColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={[Typography.button, { color: textColor }, textStyle]}>
            {label}
          </Text>
          {iconRight && (
            <Ionicons
              name={iconRight}
              size={iconSize}
              color={textColor}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // WCAG touch target
    minWidth: 44,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  // Tamanhos
  sm: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
  },
  md: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: Radii.md,
  },
  lg: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: Radii.lg,
  },
  // Variantes
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  success: {
    backgroundColor: Colors.success,
  },
  disabled: {
    opacity: 0.55,
  },
});

