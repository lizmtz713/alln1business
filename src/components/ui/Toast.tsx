import { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../lib/constants';

type ToastType = 'success' | 'error' | 'info';

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: (_msg: string, _type?: ToastType) => {},
    };
  }
  return ctx;
}

type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  const show = useCallback((msg: string, t: ToastType = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }, []);

  const bgColor = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.primary;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <View style={[styles.toast, { backgroundColor: bgColor }]} pointerEvents="none">
          <Text style={styles.text} numberOfLines={2}>
            {message}
          </Text>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xxl,
    right: spacing.xxl,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
