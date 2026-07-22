import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { colors } from '../../theme/colors';
import { GalleryPhoto, getGalleryPhotos, removeGalleryPhoto } from '../../lib/galleryStore';
import { useLanguage } from '../../i18n';

const NUM_COLUMNS = 4;

export function GalleryApp() {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [viewing, setViewing] = useState<GalleryPhoto | null>(null);

  const load = useCallback(() => {
    getGalleryPhotos().then(setPhotos);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(photo: GalleryPhoto) {
    try {
      new File(photo.uri).delete();
    } catch {
      // file may already be gone; ignore
    }
    const next = await removeGalleryPhoto(photo.id);
    setPhotos(next);
    setViewing(null);
  }

  async function handleSaveToDevice(photo: GalleryPhoto) {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) {
      Alert.alert(t('gallery.saveDeniedTitle'), t('gallery.saveDeniedMessage'));
      return;
    }
    try {
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      Alert.alert(t('gallery.savedTitle'), t('gallery.savedMessage'));
    } catch {
      Alert.alert(t('gallery.saveDeniedTitle'), t('gallery.saveErrorMessage'));
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        removeClippedSubviews
        ListEmptyComponent={<Text style={styles.empty}>{t('gallery.empty')}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.thumbWrap} onPress={() => setViewing(item)}>
            <Image source={{ uri: item.uri }} style={styles.thumb} />
          </Pressable>
        )}
      />

      <Modal
        visible={!!viewing}
        transparent
        animationType="fade"
        onRequestClose={() => setViewing(null)}
      >
        <View style={styles.modalBackdrop}>
          {viewing && (
            <Image source={{ uri: viewing.uri }} style={styles.fullImage} resizeMode="contain" />
          )}
          <View style={styles.modalControls}>
            <Pressable style={styles.modalButton} onPress={() => setViewing(null)}>
              <Text style={styles.modalButtonLabel}>{t('common.close')}</Text>
            </Pressable>
            {viewing && (
              <Pressable
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => handleSaveToDevice(viewing)}
              >
                <Text style={styles.modalButtonLabel}>{t('gallery.saveToDevice')}</Text>
              </Pressable>
            )}
            {viewing && (
              <Pressable
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => handleDelete(viewing)}
              >
                <Text style={styles.modalButtonLabel}>{t('common.delete')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  grid: {
    gap: 8,
  },
  empty: {
    color: colors.inkDim,
    fontSize: 13,
    letterSpacing: 1,
    marginTop: 24,
    textAlign: 'center',
    width: '100%',
  },
  thumbWrap: {
    flex: 1 / NUM_COLUMNS,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.panelOnLight,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '78%',
  },
  modalControls: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  saveButton: {
    backgroundColor: 'rgba(94,200,128,0.35)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255,93,108,0.35)',
  },
  modalButtonLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
