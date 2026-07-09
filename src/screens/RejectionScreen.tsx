import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';

export function RejectionScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.panel}>
        <Text style={styles.errorCode}>ACCESS DENIED — E0x600</Text>
        <Text style={styles.message}>
          先生、申し訳ありませんが……{'\n'}
          「シッテムの箱」はタブレット専用端末です。
        </Text>
        <Text style={styles.sub}>
          このOSはより大きな画面でしか起動できません。{'\n'}
          お手持ちのタブレット端末でお試しください。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: 'rgba(255, 93, 108, 0.06)',
    maxWidth: 420,
  },
  errorCode: {
    color: colors.danger,
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 12,
  },
  sub: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
