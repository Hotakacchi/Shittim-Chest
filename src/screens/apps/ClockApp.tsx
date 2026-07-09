import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { ClockDisplay } from '../../components/ClockDisplay';

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'おはようございます、先生。';
  if (hour >= 11 && hour < 18) return 'お疲れ様です、先生。';
  if (hour >= 18 && hour < 23) return 'おかえりなさい、先生。';
  return '夜遅くまでお疲れ様です……先生。';
}

export function ClockApp() {
  return (
    <View style={styles.container}>
      <ClockDisplay />
      <Text style={styles.greeting}>{getGreeting(new Date().getHours())}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  greeting: {
    color: colors.inkDim,
    fontSize: 16,
    letterSpacing: 1,
  },
});
