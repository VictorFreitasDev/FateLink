import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Radii, Spacing, Shadows } from '../../theme/spacing';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  style?: ViewStyle;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  style,
}) => {
  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          bg: Colors.successLight,
          border: Colors.success,
          text: Colors.successDark,
          icon: 'checkmark-circle-outline' as const,
        };
      case 'error':
        return {
          bg: Colors.errorLight,
          border: Colors.error,
          text: Colors.errorDark,
          icon: 'alert-circle-outline' as const,
        };
      case 'warning':
        return {
          bg: Colors.warningLight,
          border: Colors.warning,
          text: Colors.warningDark,
          icon: 'warning-outline' as const,
        };
      case 'info':
      default:
        return {
          bg: Colors.infoLight,
          border: Colors.info,
          text: Colors.infoDark,
          icon: 'information-circle-outline' as const,
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderLeftColor: config.border,
        },
        Shadows.sm,
        style,
      ]}
      accessibilityRole="alert"
    >
      <Ionicons
        name={config.icon}
        size={22}
        color={config.text}
        style={styles.icon}
      />

      <View style={styles.content}>
        <Text style={[styles.title, { color: config.text }]}>{title}</Text>
        {message && (
          <Text style={[styles.message, { color: config.text }]}>
            {message}
          </Text>
        )}
      </View>

      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Fechar notificação"
        >
          <Ionicons name="close" size={18} color={config.text} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    width: '100%',
  },
  icon: {
    marginRight: Spacing.sm,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  message: {
    ...Typography.caption,
    marginTop: 2,
    lineHeight: 16,
    opacity: 0.9,
  },
  closeBtn: {
    marginLeft: Spacing.sm,
    padding: 2,
  },
});

