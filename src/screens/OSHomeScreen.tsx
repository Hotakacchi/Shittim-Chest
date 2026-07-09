import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { GradientTriangleBackground } from '../components/GradientTriangleBackground';
import { SchaleBadge } from '../components/SchaleBadge';
import { ClockDisplay } from '../components/ClockDisplay';
import { AppWindow } from '../components/AppWindow';
import { HomeAppGrid, AppDef } from '../components/HomeAppGrid';
import { ClockIcon, CalendarIcon, ChecklistIcon, GearIcon } from '../components/icons/AppIcons';

const APP_DEFS: AppDef[] = [
  { key: 'CLOCK', label: 'CLOCK', Icon: ClockIcon },
  { key: 'SCHEDULE', label: 'SCHEDULE', Icon: CalendarIcon },
  { key: 'TASK', label: 'TASK', Icon: ChecklistIcon },
  { key: 'SYSTEM', label: 'SYSTEM', Icon: GearIcon },
];

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'おはようございます、先生。';
  if (hour >= 11 && hour < 18) return 'お疲れ様です、先生。';
  if (hour >= 18 && hour < 23) return 'おかえりなさい、先生。';
  return '夜遅くまでお疲れ様です……先生。';
}

export function OSHomeScreen() {
  const [openApp, setOpenApp] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <GradientTriangleBackground />

      {openApp === 'CLOCK' ? (
        <AppWindow title="CLOCK" onClose={() => setOpenApp(null)}>
          <ClockDisplay />
          <Text style={styles.greeting}>{getGreeting(new Date().getHours())}</Text>
        </AppWindow>
      ) : openApp ? (
        <AppWindow title={openApp} onClose={() => setOpenApp(null)} />
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
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLayer: {
    zIndex: 1,
    padding: 24,
  },
  greeting: {
    marginTop: 12,
    color: colors.inkDim,
    fontSize: 16,
    letterSpacing: 1,
  },
});
