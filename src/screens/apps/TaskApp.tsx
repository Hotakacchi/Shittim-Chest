import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { STORAGE_KEYS } from '../../lib/storageKeys';

type Task = {
  id: string;
  text: string;
  done: boolean;
};

export function TaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.tasks).then((raw) => {
      if (raw) {
        try {
          setTasks(JSON.parse(raw));
        } catch {
          setTasks([]);
        }
      }
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    const text = draft.trim();
    if (!text) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), text, done: false }]);
    setDraft('');
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        本日の任務 — 残り{remaining}件 / 全{tasks.length}件
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addTask}
          placeholder="新しい任務を入力…"
          placeholderTextColor={colors.inkDim}
          style={styles.input}
          returnKeyType="done"
        />
        <Pressable style={styles.addButton} onPress={addTask}>
          <Text style={styles.addLabel}>追加</Text>
        </Pressable>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>任務はまだありません</Text>}
        renderItem={({ item }) => (
          <View style={styles.taskRow}>
            <Pressable
              style={[styles.checkbox, item.done && styles.checkboxDone]}
              onPress={() => toggleTask(item.id)}
              hitSlop={8}
            >
              {item.done && <Text style={styles.checkMark}>✓</Text>}
            </Pressable>
            <Text style={[styles.taskText, item.done && styles.taskTextDone]}>{item.text}</Text>
            <Pressable onPress={() => removeTask(item.id)} hitSlop={8}>
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
    gap: 16,
  },
  summary: {
    color: colors.inkDim,
    fontSize: 13,
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
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
    marginTop: 24,
    textAlign: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.accent,
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  taskText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  taskTextDone: {
    color: colors.inkDim,
    textDecorationLine: 'line-through',
  },
  deleteLabel: {
    color: colors.inkDim,
    fontSize: 13,
  },
});
