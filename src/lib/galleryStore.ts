import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storageKeys';

export type GalleryPhoto = {
  id: string;
  uri: string;
  createdAt: number;
};

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.galleryPhotos);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addGalleryPhoto(uri: string): Promise<GalleryPhoto[]> {
  const photos = await getGalleryPhotos();
  const next = [{ id: Date.now().toString(), uri, createdAt: Date.now() }, ...photos];
  await AsyncStorage.setItem(STORAGE_KEYS.galleryPhotos, JSON.stringify(next));
  return next;
}

export async function removeGalleryPhoto(id: string): Promise<GalleryPhoto[]> {
  const photos = await getGalleryPhotos();
  const next = photos.filter((p) => p.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.galleryPhotos, JSON.stringify(next));
  return next;
}
