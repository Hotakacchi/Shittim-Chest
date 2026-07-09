import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export const TABS = ['SCHEDULE', 'TASK', 'SYSTEM'] as const;
export type TabKey = (typeof TABS)[number];

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

export function TabBar({ active, onChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.panelBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabActive: {
    borderTopColor: colors.accentBright,
    backgroundColor: colors.panel,
  },
  label: {
    color: colors.textDim,
    fontSize: 13,
    letterSpacing: 2,
  },
  labelActive: {
    color: colors.accentBright,
  },
});
