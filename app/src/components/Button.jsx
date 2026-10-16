import { Pressable, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Button({ label, onPress, variant = 'primary', icon, loading, disabled, className = '' }) {
  const base = 'flex-row items-center justify-center gap-2 rounded-xl py-3.5 px-5';
  const variants = {
    primary: 'bg-brand-600',
    outline: 'border-2 border-brand-600 bg-white',
    whatsapp: 'bg-green-600',
    danger: 'bg-red-50'
  };
  const textColor = {
    primary: 'text-white',
    outline: 'text-brand-700',
    whatsapp: 'text-white',
    danger: 'text-red-600'
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#1d4ed8' : '#fff'} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={variant === 'outline' ? '#1d4ed8' : variant === 'danger' ? '#dc2626' : '#fff'} />}
          <Text className={`font-semibold text-sm ${textColor[variant]}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
