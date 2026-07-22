import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { colors } from '../theme/colors';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { GradientTriangleBackground } from '../components/GradientTriangleBackground';
import { SchaleBadge } from '../components/SchaleBadge';
import { AppWindow } from '../components/AppWindow';
import { HomeAppGrid } from '../components/HomeAppGrid';
import { TapEffectsLayer } from '../components/TapEffectsLayer';
import { APP_REGISTRY } from '../apps/registry';

export function OSHomeScreen() {
  const insets = useSafeAreaInsets();
  const [openApp, setOpenApp] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.keepAwake).then((value) => {
      if (value === 'true') activateKeepAwakeAsync();
    });
  }, []);

  // Android's hardware/gesture back action has no on-screen equivalent at
  // the home screen otherwise — closing the open app window mirrors what
  // its own ✕ button already does, so this just gives Android users the
  // navigation they expect.
  useEffect(() => {
    if (!openApp) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpenApp(null);
      return true;
    });
    return () => sub.remove();
  }, [openApp]);

  const AppScreen = openApp ? APP_REGISTRY.find((a) => a.key === openApp)?.Screen : null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <GradientTriangleBackground />

      <TapEffectsLayer>
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            },
          ]}
        >
          {AppScreen ? (
            <AppWindow title={openApp!} onClose={() => setOpenApp(null)}>
              <AppScreen />
            </AppWindow>
          ) : (
            <View style={styles.home}>
              <View style={styles.centerLayer} pointerEvents="none">
                <SchaleBadge />
              </View>
              <View style={[styles.centerLayer, styles.gridLayer]}>
                <HomeAppGrid apps={APP_REGISTRY} onLaunch={setOpenApp} />
              </View>
            </View>
          )}
        </View>
      </TapEffectsLayer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientTop,
  },
  content: {
    flex: 1,
  },
  home: {
    flex: 1,
  },
  centerLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLayer: {
    zIndex: 1,
    padding: 24,
  },
});
