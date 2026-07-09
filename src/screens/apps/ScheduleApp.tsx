import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { STORAGE_KEYS } from '../../lib/storageKeys';
import { WEEKDAYS_JA, toDateKey } from '../../lib/dateUtils';
import { MonthCalendar } from '../../components/MonthCalendar';

type EventItem = {
  id: string;
  title: string;
};

type EventsByDate = Record<string, EventItem[]>;

function formatSelectedDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAYS_JA[date.getDay()];
  return `${m}月${d}日 (${w})`;
}

export function ScheduleApp() {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [eventsByDate, setEventsByDate] = useState<EventsByDate>({});
  const [draft, setDraft] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.scheduleEvents).then((raw) => {
      if (raw) {
        try {
          setEventsByDate(JSON.parse(raw));
        } catch {
          setEventsByDate({});
        }
      }
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.scheduleEvents, JSON.stringify(eventsByDate));
  }, [eventsByDate]);

  const selectedKey = toDateKey(selectedDate);
  const selectedEvents = eventsByDate[selectedKey] ?? [];
  const markedDateKeys = new Set(
    Object.keys(eventsByDate).filter((key) => (eventsByDate[key]?.length ?? 0) > 0),
  );

  function addEvent() {
    const title = draft.trim();
    if (!title) return;
    setEventsByDate((prev) => ({
      ...prev,
      [selectedKey]: [...(prev[selectedKey] ?? []), { id: Date.now().toString(), title }],
    }));
    setDraft('');
  }

  function removeEvent(id: string) {
    setEventsByDate((prev) => ({
      ...prev,
      [selectedKey]: (prev[selectedKey] ?? []).filter((e) => e.id !== id),
    }));
  }

  function shiftMonth(delta: number) {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <View style={styles.container}>
      <MonthCalendar
        month={viewMonth}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        markedDateKeys={markedDateKeys}
      />

      <View style={styles.divider} />

      <Text style={styles.selectedLabel}>{formatSelectedDate(selectedDate)}の予定</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addEvent}
          placeholder="予定を入力…"
          placeholderTextColor={colors.inkDim}
          style={styles.input}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={addEvent}>
          <Text style={styles.addLabel}>追加</Text>
        </Pressable>
      </View>

      <FlatList
        data={selectedEvents}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>予定はありません</Text>}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <Text style={styles.eventText}>{item.title}</Text>
            <Pressable onPress={() => removeEvent(item.id)} hitSlop={8}>
              <Text style={styles.deleteLabel}>✕</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.panelBorderOnLight,
    marginVertical: 16,
  },
  selectedLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.ink,
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
  },
  addLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  empty: {
    color: colors.inkDim,
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eventText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  deleteLabel: {
    color: colors.inkDim,
    fontSize: 13,
  },
});
