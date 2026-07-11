import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { ClockDisplay } from '../../components/ClockDisplay';
import { CHARACTER_IMAGES } from '../../data/characterImageMap';
import { getTodaysDutyStudent } from '../../lib/dutyStudent';

// Checked before the regular time-of-day greeting — month/day is enough
// since these recur every year, no need to track by full date.
const SPECIAL_DAY_GREETINGS: { month: number; day: number; greeting: string }[] = [
  { month: 1, day: 1, greeting: '新年明けましておめでとうございます、先生。' },
  { month: 1, day: 2, greeting: 'お正月はゆっくりできていますか、先生。' },
  { month: 1, day: 3, greeting: '三が日も終わりですね、先生。' },
  { month: 2, day: 14, greeting: 'ハッピーバレンタイン、先生。' },
  { month: 3, day: 14, greeting: 'ハッピーホワイトデー、先生。' },
  { month: 10, day: 31, greeting: 'ハッピーハロウィン、先生。' },
  { month: 12, day: 24, greeting: 'メリークリスマス・イブ、先生。' },
  { month: 12, day: 25, greeting: 'メリークリスマス、先生。' },
  { month: 12, day: 31, greeting: '今年も一年お疲れ様でした、先生。' },
];

function getSpecialDayGreeting(date: Date): string | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const match = SPECIAL_DAY_GREETINGS.find((s) => s.month === month && s.day === day);
  return match?.greeting ?? null;
}

function getTimeGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'おはようございます、先生。';
  if (hour >= 11 && hour < 18) return 'お疲れ様です、先生。';
  if (hour >= 18 && hour < 23) return 'おかえりなさい、先生。';
  return '夜遅くまでお疲れ様です……先生。';
}

function getGreeting(date: Date): string {
  return getSpecialDayGreeting(date) ?? getTimeGreeting(date.getHours());
}

export function ClockApp() {
  const dutyStudent = getTodaysDutyStudent(new Date());

  return (
    <View style={styles.container}>
      <ClockDisplay />
      <Text style={styles.greeting}>{getGreeting(new Date())}</Text>

      <View style={styles.dutyCard}>
        <Image source={CHARACTER_IMAGES[dutyStudent.image]} style={styles.dutyImage} resizeMode="contain" />
        <View>
          <Text style={styles.dutyLabel}>本日の当番</Text>
          <Text style={styles.dutyName}>{dutyStudent.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  greeting: {
    color: colors.inkDim,
    fontSize: 16,
    letterSpacing: 1,
  },
  dutyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dutyImage: {
    width: 44,
    height: 50,
  },
  dutyLabel: {
    color: colors.inkDim,
    fontSize: 11,
    letterSpacing: 1,
  },
  dutyName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
});
