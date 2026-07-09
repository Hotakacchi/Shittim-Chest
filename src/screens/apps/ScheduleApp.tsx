import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAYS_JA[date.getDay()];
  return `${y}.${m.toString().padStart(2, '0')}.${d.toString().padStart(2, '0')} (${w})`;
}

export function ScheduleApp() {
  const now = new Date();
  return (
    <View style={styles.container}>
      <Text style={styles.date}>{formatDate(now)}</Text>
      <Text style={styles.empty}>本日の予定はありません</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  date: {
    color: colors.ink,
    fontSize: 28,
    letterSpacing: 2,
  },
  empty: {
    color: colors.inkDim,
    fontSize: 14,
    letterSpacing: 1,
  },
});
