import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

export type CategoryStats = { correct: number; total: number };
export type QuizStats = Record<string, CategoryStats>;

export async function loadQuizStats(): Promise<QuizStats> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.quizStats);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function recordAnswer(categoryKey: string, isCorrect: boolean): Promise<QuizStats> {
  const stats = await loadQuizStats();
  const prev = stats[categoryKey] ?? { correct: 0, total: 0 };
  const next: QuizStats = {
    ...stats,
    [categoryKey]: { correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 },
  };
  await AsyncStorage.setItem(STORAGE_KEYS.quizStats, JSON.stringify(next));
  return next;
}
