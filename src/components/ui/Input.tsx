import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, Radii } from '../../theme/spacing';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  onPressIconRight?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  iconLeft,
  iconRight,
  onPressIconRight,
  containerStyle,
  inputStyle,
  required,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);

  const getBorderColor = () => {
    if (hasError) return Colors.error;
    if (isFocused) return Colors.primary;
    return Colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {iconLeft && (
          <Ionicons
            name={iconLeft}
            size={18}
            color={hasError ? Colors.error : isFocused ? Colors.primary : Colors.textMuted}
            style={styles.iconLeft}
          />
        )}

        <TextInput
          style={[styles.input, !editable && styles.inputTextDisabled, inputStyle]}
          placeholderTextColor={Colors.placeholder}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {iconRight && (
          <TouchableOpacity
            disabled={!onPressIconRight}
            onPress={onPressIconRight}
            style={styles.iconRightTouch}
            accessibilityRole={onPressIconRight ? 'button' : undefined}
          >
            <Ionicons
              name={iconRight}
              size={18}
              color={hasError ? Colors.error : Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {hasError ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
  },
  requiredAsterisk: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderRadius: Radii.md,
    minHeight: 46,
    paddingHorizontal: Spacing.md,
  },
  inputContainerFocused: {
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderWidth: 1.5,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.sm,
  },
  inputTextDisabled: {
    color: Colors.textMuted,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRightTouch: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '500',
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});

