import { StyleSheet, Text, View } from 'react-native';
import { HiddenGestureZone } from '../components/HiddenGestureZone';
import { useGlitchText } from '../hooks/useGlitchText';
import { useSystemError } from '../lib/systemErrorScreen';
import { colors } from '../theme/colors';

const TITLE = 'SYSTEM LOCKED';
const SUBTITLE = 'ERROR CODE E0xDEAD';

export function SystemErrorScreen() {
  const { active, deactivate } = useSystemError();
  const title = useGlitchText(TITLE, active);
  const subtitle = useGlitchText(SUBTITLE, active);

  if (!active) return null;

  return (
    <HiddenGestureZone onUnlock={deactivate}>
      <View style={styles.overlay}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.message}>この端末は現在ロックされています。</Text>
      </View>
    </HiddenGestureZone>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a0000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 999,
    elevation: 999,
  },
  title: {
    color: colors.danger,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  subtitle: {
    color: colors.danger,
    fontSize: 14,
    letterSpacing: 2,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  message: {
    color: colors.textDim,
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 12,
  },
});
