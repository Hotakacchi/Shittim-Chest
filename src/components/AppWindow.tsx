import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
};

export function AppWindow({ title, onClose, children }: Props) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: enter,
          transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
          <Text style={styles.closeLabel}>✕</Text>
        </Pressable>
      </View>
      <View style={styles.body}>{children ?? <Text style={styles.placeholder}>準備中</Text>}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.panelBorderOnLight,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.panelOnLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLabel: {
    color: colors.ink,
    fontSize: 14,
  },
  body: {
    flex: 1,
  },
  placeholder: {
    color: colors.inkDim,
    fontSize: 14,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 48,
  },
});
