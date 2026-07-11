import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';
import characters from '../data/characters.json';

type Character = (typeof characters)[number];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function todayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function pickDeterministic(dateKey: string, ownedImages: string[]): Character {
  const pool =
    ownedImages.length > 0 ? characters.filter((c) => ownedImages.includes(c.image)) : characters;
  const index = hashString(dateKey) % pool.length;
  return pool[index];
}

// Picked once per calendar day and locked in via storage — editing the
// owned-character list mid-day no longer reshuffles who's on duty; the
// pick only changes the next time a new day rolls around.
export async function getOrCreateTodaysDutyStudent(ownedImages: string[]): Promise<Character> {
  const dateKey = todayKey(new Date());
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.dutyStudent);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as { dateKey: string; image: string };
      if (stored.dateKey === dateKey) {
        const found = characters.find((c) => c.image === stored.image);
        if (found) return found;
      }
    } catch {
      // fall through and repick
    }
  }

  const picked = pickDeterministic(dateKey, ownedImages);
  await AsyncStorage.setItem(STORAGE_KEYS.dutyStudent, JSON.stringify({ dateKey, image: picked.image }));
  return picked;
}
