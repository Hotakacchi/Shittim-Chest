import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

// Kept in a plain module variable (not React state) so HomeAppGrid can read
// the current value synchronously right before playing a sound, without
// needing to be re-rendered whenever SystemApp changes it elsewhere in the
// tree.
let currentVolume = 1;

export function getTapVolume(): number {
  return currentVolume;
}

export function setTapVolume(value: number): void {
  currentVolume = value;
  AsyncStorage.setItem(STORAGE_KEYS.tapVolume, String(value));
}

export async function loadTapVolume(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.tapVolume);
  if (raw !== null) {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) currentVolume = parsed;
  }
  return currentVolume;
}
