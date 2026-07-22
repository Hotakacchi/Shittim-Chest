import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useIsTablet } from './src/hooks/useIsTablet';
import { BootScreen } from './src/screens/BootScreen';
import { OSHomeScreen } from './src/screens/OSHomeScreen';
import { RejectionScreen } from './src/screens/RejectionScreen';
import { SystemErrorScreen } from './src/screens/SystemErrorScreen';
import { SystemErrorProvider } from './src/lib/systemErrorScreen';
import { LanguageProvider } from './src/i18n';
import { STORAGE_KEYS } from './src/lib/storageKeys';
import { colors } from './src/theme/colors';

function AppContent() {
  const isTablet = useIsTablet();
  const [booted, setBooted] = useState(false);
  const [skipBoot, setSkipBoot] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.skipBootAnimation),
      AsyncStorage.getItem(STORAGE_KEYS.skipBootOnce),
    ]).then(([persistent, once]) => {
      setSkipBoot(persistent === 'true' || once === 'true');
      if (once === 'true') {
        AsyncStorage.removeItem(STORAGE_KEYS.skipBootOnce);
      }
    });
    ScreenOrientation.unlockAsync();
  }, []);

  if (skipBoot === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  if (!booted && !skipBoot) {
    return <BootScreen onFinish={() => setBooted(true)} />;
  }
  return isTablet ? <OSHomeScreen /> : <RejectionScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <SystemErrorProvider>
          <AppContent />
          <SystemErrorScreen />
        </SystemErrorProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
