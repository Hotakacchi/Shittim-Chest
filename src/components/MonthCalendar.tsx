import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { getMonthMatrix, isSameDay, isSameMonth, toDateKey } from '../lib/dateUtils';
import { useLanguage, WEEKDAYS } from '../i18n';

type Props = {
  month: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  markedDateKeys: Set<string>;
};

export function MonthCalendar({
  month,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  markedDateKeys,
}: Props) {
  const { t, language } = useLanguage();
  const weeks = getMonthMatrix(month.getFullYear(), month.getMonth());
  const today = new Date();

  return (
    <View>
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={onPrevMonth} hitSlop={8}>
          <Text style={styles.navLabel}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {t('common.monthLabel', { year: month.getFullYear(), month: month.getMonth() + 1 })}
        </Text>
        <Pressable style={styles.navButton} onPress={onNextMonth} hitSlop={8}>
          <Text style={styles.navLabel}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS[language].map((w, i) => (
          <Text
            key={w}
            style={[
              styles.weekdayLabel,
              i === 0 && styles.sunday,
              i === 6 && styles.saturday,
            ]}
          >
            {w}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((date) => {
            const inMonth = isSameMonth(date, month);
            const selected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const marked = markedDateKeys.has(toDateKey(date));
            return (
              <Pressable
                key={date.toISOString()}
                style={styles.dayCell}
                onPress={() => onSelectDate(date)}
              >
                <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                  <Text
                    style={[
                      styles.dayLabel,
                      !inMonth && styles.dayLabelMuted,
                      selected && styles.dayLabelSelected,
                      isToday && !selected && styles.dayLabelToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {marked && <View style={[styles.dot, selected && styles.dotSelected]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.panelOnLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
  },
  monthLabel: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.inkDim,
    fontSize: 12,
    paddingVertical: 6,
  },
  sunday: {
    color: '#d9718a',
  },
  saturday: {
    color: '#5a8fc2',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: colors.accent,
  },
  dayLabel: {
    color: colors.ink,
    fontSize: 14,
  },
  dayLabelMuted: {
    color: colors.inkDim,
    opacity: 0.4,
  },
  dayLabelSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  dayLabelToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  dotSelected: {
    backgroundColor: '#ffffff',
  },
});
