import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Radii, Spacing, Shadows } from '../../theme/spacing';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Card: React.FC<CardProps> & {
  Header: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }>;
  Content: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }>;
  Footer: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }>;
} = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  testID,
}) => {
  const getContainerStyles = (): ViewStyle[] => {
    const list: ViewStyle[] = [styles.base];

    // Variant
    switch (variant) {
      case 'default':
        list.push(styles.variantDefault, Shadows.sm);
        break;
      case 'elevated':
        list.push(styles.variantElevated, Shadows.md);
        break;
      case 'outlined':
        list.push(styles.variantOutlined);
        break;
      case 'flat':
        list.push(styles.variantFlat);
        break;
    }

    // Padding
    switch (padding) {
      case 'none':
        list.push(styles.paddingNone);
        break;
      case 'sm':
        list.push(styles.paddingSm);
        break;
      case 'md':
        list.push(styles.paddingMd);
        break;
      case 'lg':
        list.push(styles.paddingLg);
        break;
    }

    if (style) {
      list.push(style as ViewStyle);
    }

    return list;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={getContainerStyles()}
        testID={testID}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={getContainerStyles()} testID={testID}>
      {children}
    </View>
  );
};

const CardHeader: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style,
}) => <View style={[styles.cardHeader, style]}>{children}</View>;

const CardContent: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style,
}) => <View style={[styles.cardContent, style]}>{children}</View>;

const CardFooter: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({
  children,
  style,
}) => <View style={[styles.cardFooter, style]}>{children}</View>;

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  variantDefault: {
    borderColor: Colors.border,
    borderWidth: 1,
  },
  variantElevated: {
    borderWidth: 0,
  },
  variantOutlined: {
    borderColor: Colors.border,
    borderWidth: 1.5,
  },
  variantFlat: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 0,
  },
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: Spacing.sm,
  },
  paddingMd: {
    padding: Spacing.md,
  },
  paddingLg: {
    padding: Spacing.lg,
  },
  cardHeader: {
    marginBottom: Spacing.sm,
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

