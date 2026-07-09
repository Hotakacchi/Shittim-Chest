import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { colors } from '../theme/colors';
import { STORAGE_KEYS } from '../lib/storageKeys';
import { GradientTriangleBackground } from '../components/GradientTriangleBackground';
import { SchaleBadge } from '../components/SchaleBadge';
import { AppWindow } from '../components/AppWindow';
import { HomeAppGrid, AppDef } from '../components/HomeAppGrid';
import { ClockIcon, CalendarIcon, ChecklistIcon, GearIcon } from '../components/icons/AppIcons';
import { ClockApp } from './apps/ClockApp';
import { ScheduleApp } from './apps/ScheduleApp';
import { TaskApp } from './apps/TaskApp';
import { SystemApp } from './apps/SystemApp';

const APP_DEFS: AppDef[] = [
  { key: 'CLOCK', label: 'CLOCK', Icon: ClockIcon },
  { key: 'SCHEDULE', label: 'SCHEDULE', Icon: CalendarIcon },
  { key: 'TASK', label: 'TASK', Icon: ChecklistIcon },
  { key: 'SYSTEM', label: 'SYSTEM', Icon: GearIcon },
];

const APP_SCREENS: Record<string, React.ComponentType> = {
  CLOCK: ClockApp,
  SCHEDULE: ScheduleApp,
  TASK: TaskApp,
  SYSTEM: SystemApp,
};

export function OSHomeScreen() {
  const [openApp, setOpenApp] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.keepAwake).then((value) => {
      if (value === 'true') activateKeepAwakeAsync();
    });
  }, []);

  const AppScreen = openApp ? APP_SCREENS[openApp] : null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <GradientTriangleBackground />

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
            <HomeAppGrid apps={APP_DEFS} onLaunch={setOpenApp} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientTop,
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
