import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  label: string;
  onPress: () => void;
};

export function AppTile({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 128,
    height: 128,
    borderRadius: 24,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  tilePressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
