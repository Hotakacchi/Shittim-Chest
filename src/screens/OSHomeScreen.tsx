import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { GradientTriangleBackground } from '../components/GradientTriangleBackground';
import { ClockDisplay } from '../components/ClockDisplay';
import { AppTile } from '../components/AppTile';
import { AppWindow } from '../components/AppWindow';

const APPS = ['SCHEDULE', 'TASK', 'SYSTEM'] as const;
type AppKey = (typeof APPS)[number];

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'おはようございます、先生。';
  if (hour >= 11 && hour < 18) return 'お疲れ様です、先生。';
  if (hour >= 18 && hour < 23) return 'おかえりなさい、先生。';
  return '夜遅くまでお疲れ様です……先生。';
}

export function OSHomeScreen() {
  const [openApp, setOpenApp] = useState<AppKey | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <GradientTriangleBackground />

      {openApp ? (
        <AppWindow title={openApp} onClose={() => setOpenApp(null)} />
      ) : (
        <View style={styles.home}>
          <View style={styles.clockArea}>
            <ClockDisplay />
            <Text style={styles.greeting}>{getGreeting(new Date().getHours())}</Text>
          </View>

          <View style={styles.dock}>
            {APPS.map((app) => (
              <AppTile key={app} label={app} onPress={() => setOpenApp(app)} />
            ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 96,
    paddingBottom: 64,
  },
  clockArea: {
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    color: colors.inkDim,
    fontSize: 16,
    letterSpacing: 1,
  },
  dock: {
    flexDirection: 'row',
    gap: 20,
  },
});
