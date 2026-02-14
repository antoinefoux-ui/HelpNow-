import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const base = styles.button;
    const variantStyle = styles[`${variant}Button` as keyof typeof styles] as ViewStyle;
    const sizeStyle = styles[`${size}Button` as keyof typeof styles] as ViewStyle;
    const disabledStyle = (disabled || loading) ? styles.disabledButton : {};
    
    return { ...base, ...variantStyle, ...sizeStyle, ...disabledStyle, ...style };
  };

  const getTextStyle = (): TextStyle => {
    const base = styles.buttonText;
    const variantStyle = styles[`${variant}ButtonText` as keyof typeof styles] as TextStyle;
    const sizeStyle = styles[`${size}ButtonText` as keyof typeof styles] as TextStyle;
    
    return { ...base, ...variantStyle, ...sizeStyle };
  };

  const getIconColor = (): string => {
    if (variant === 'outline') return '#E53E3E';
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getIconColor()} />
      ) : (
        <>
          {icon && <Icon name={icon} size={20} color={getIconColor()} style={styles.icon} />}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  // Variant styles
  primaryButton: {
    backgroundColor: '#E53E3E',
  },
  secondaryButton: {
    backgroundColor: '#3B82F6',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E53E3E',
  },
  // Size styles
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mediumButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  largeButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  // Disabled style
  disabledButton: {
    opacity: 0.5,
  },
  // Text styles
  buttonText: {
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  successButtonText: {
    color: '#FFFFFF',
  },
  outlineButtonText: {
    color: '#E53E3E',
  },
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
  icon: {
    marginRight: 8,
  },
});
