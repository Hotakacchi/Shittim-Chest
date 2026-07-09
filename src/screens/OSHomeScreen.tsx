import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { GradientTriangleBackground } from '../components/GradientTriangleBackground';
import { SystemHeader } from '../components/SystemHeader';
import { ClockDisplay } from '../components/ClockDisplay';
import { TabBar, TabKey } from '../components/TabBar';

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'おはようございます、先生。';
  if (hour >= 11 && hour < 18) return 'お疲れ様です、先生。';
  if (hour >= 18 && hour < 23) return 'おかえりなさい、先生。';
  return '夜遅くまでお疲れ様です……先生。';
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{label}（準備中）</Text>
    </View>
  );
}

export function OSHomeScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('SCHEDULE');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <GradientTriangleBackground />
      <SystemHeader />

      <View style={styles.body}>
        {activeTab === 'SCHEDULE' && (
          <View style={styles.schedulePanel}>
            <ClockDisplay />
            <Text style={styles.greeting}>{getGreeting(new Date().getHours())}</Text>
          </View>
        )}
        {activeTab === 'TASK' && <TabPlaceholder label="TASK" />}
        {activeTab === 'SYSTEM' && <TabPlaceholder label="SYSTEM" />}
      </View>

      <TabBar active={activeTab} onChange={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientTop,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  schedulePanel: {
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    color: colors.inkDim,
    fontSize: 16,
    letterSpacing: 1,
  },
  placeholder: {
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: colors.panelOnLight,
  },
  placeholderText: {
    color: colors.inkDim,
    fontSize: 14,
    letterSpacing: 2,
  },
});
