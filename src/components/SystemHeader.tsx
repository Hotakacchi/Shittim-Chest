import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function SystemHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <View style={styles.dot} />
        <Text style={styles.label}>SCHALE OS</Text>
      </View>
      <Text style={styles.title}>シッテムの箱</Text>
      <View style={[styles.side, styles.sideRight]}>
        <Text style={styles.label}>ONLINE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.panelBorder,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 110,
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBright,
  },
  label: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    letterSpacing: 4,
  },
});
