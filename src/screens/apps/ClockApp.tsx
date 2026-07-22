import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { ClockDisplay } from '../../components/ClockDisplay';
import { CHARACTER_IMAGES } from '../../data/characterImageMap';
import { getOrCreateTodaysDutyStudent } from '../../lib/dutyStudent';
import { getOwnedCharacters } from '../../lib/ownedCharacters';
import { useLanguage } from '../../i18n';
import characters from '../../data/characters.json';

// Checked before the regular time-of-day greeting — month/day is enough
// since these recur every year, no need to track by full date.
const SPECIAL_DAY_GREETINGS: { month: number; day: number; key: string }[] = [
  { month: 1, day: 1, key: 'clock.greetingNewYear1' },
  { month: 1, day: 2, key: 'clock.greetingNewYear2' },
  { month: 1, day: 3, key: 'clock.greetingNewYear3' },
  { month: 2, day: 14, key: 'clock.greetingValentine' },
  { month: 3, day: 14, key: 'clock.greetingWhiteDay' },
  { month: 10, day: 31, key: 'clock.greetingHalloween' },
  { month: 12, day: 24, key: 'clock.greetingChristmasEve' },
  { month: 12, day: 25, key: 'clock.greetingChristmas' },
  { month: 12, day: 31, key: 'clock.greetingNewYearsEve' },
];

function getSpecialDayGreetingKey(date: Date): string | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const match = SPECIAL_DAY_GREETINGS.find((s) => s.month === month && s.day === day);
  return match?.key ?? null;
}

function getTimeGreetingKey(hour: number): string {
  if (hour >= 5 && hour < 11) return 'clock.greetingMorning';
  if (hour >= 11 && hour < 18) return 'clock.greetingAfternoon';
  if (hour >= 18 && hour < 23) return 'clock.greetingEvening';
  return 'clock.greetingLateNight';
}

function getGreetingKey(date: Date): string {
  return getSpecialDayGreetingKey(date) ?? getTimeGreetingKey(date.getHours());
}

export function ClockApp() {
  const { t } = useLanguage();
  const [dutyStudent, setDutyStudent] = useState<(typeof characters)[number] | null>(null);

  useEffect(() => {
    getOwnedCharacters().then((owned) => {
      getOrCreateTodaysDutyStudent(owned).then(setDutyStudent);
    });
  }, []);

  return (
    <View style={styles.container}>
      <ClockDisplay />
      <Text style={styles.greeting}>{t(getGreetingKey(new Date()))}</Text>

      {dutyStudent && (
        <View style={styles.dutyCard}>
          <Image
            source={CHARACTER_IMAGES[dutyStudent.image]}
            style={styles.dutyImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.dutyLabel}>{t('clock.dutyLabel')}</Text>
            <Text style={styles.dutyName}>{dutyStudent.name}</Text>
          </View>
        </View>
      )}
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
