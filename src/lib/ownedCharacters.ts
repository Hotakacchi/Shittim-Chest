import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

export async function getOwnedCharacters(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.ownedCharacters);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function setOwnedCharacters(images: string[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ownedCharacters, JSON.stringify(images));
}

export async function toggleOwnedCharacter(image: string): Promise<string[]> {
  const owned = await getOwnedCharacters();
  const next = owned.includes(image) ? owned.filter((i) => i !== image) : [...owned, image];
  await setOwnedCharacters(next);
  return next;
}
