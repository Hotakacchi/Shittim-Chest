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

// Tracked separately from the running per-question accuracy above — this is
// the best score achieved specifically when playing a category's full
// question pool in one round (the "全問" round-size option), not any
// smaller 5/10/20 round.
export async function loadFullRoundBest(): Promise<QuizStats> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.fullRoundBest);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function recordFullRoundResult(
  categoryKey: string,
  correct: number,
  total: number,
): Promise<QuizStats> {
  const stats = await loadFullRoundBest();
  const prev = stats[categoryKey];
  if (prev && prev.correct >= correct) return stats;
  const next: QuizStats = { ...stats, [categoryKey]: { correct, total } };
  await AsyncStorage.setItem(STORAGE_KEYS.fullRoundBest, JSON.stringify(next));
  return next;
}
