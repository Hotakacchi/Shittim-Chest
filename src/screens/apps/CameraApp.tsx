import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Directory, File, Paths } from 'expo-file-system';
import { colors } from '../../theme/colors';
import { addGalleryPhoto } from '../../lib/galleryStore';

export function CameraApp() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashVisible, setFlashVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>権限を確認しています…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>写真を撮るにはカメラへのアクセスを許可してください</Text>
        <Pressable style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonLabel}>許可する</Text>
        </Pressable>
      </View>
    );
  }

  async function takePhoto() {
    const photo = await cameraRef.current?.takePictureAsync();
    if (!photo) return;

    const galleryDir = new Directory(Paths.document, 'gallery');
    if (!galleryDir.exists) galleryDir.create({ intermediates: true });

    const dest = new File(galleryDir, `${Date.now()}.jpg`);
    new File(photo.uri).copy(dest);
    await addGalleryPhoto(dest.uri);

    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 150);
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      {flashVisible && <View style={styles.flash} pointerEvents="none" />}

      <View style={styles.controls}>
        <Pressable
          style={styles.flipButton}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        >
          <Text style={styles.flipLabel}>反転</Text>
        </Pressable>
        <Pressable style={styles.shutter} onPress={takePhoto} />
        <View style={styles.flipButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
  },
  controls: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  flipButton: {
    width: 56,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  message: {
    color: colors.inkDim,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1,
  },
  permButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
  },
  permButtonLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});
