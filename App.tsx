import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useIsTablet } from './src/hooks/useIsTablet';
import { BootScreen } from './src/screens/BootScreen';
import { OSHomeScreen } from './src/screens/OSHomeScreen';
import { RejectionScreen } from './src/screens/RejectionScreen';
import { SystemErrorScreen } from './src/screens/SystemErrorScreen';
import { SystemErrorProvider } from './src/lib/systemErrorScreen';
import { STORAGE_KEYS } from './src/lib/storageKeys';
import { colors } from './src/theme/colors';

function AppContent() {
  const isTablet = useIsTablet();
  const [booted, setBooted] = useState(false);
  const [skipBoot, setSkipBoot] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.skipBootAnimation).then((value) => {
      setSkipBoot(value === 'true');
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
    <SystemErrorProvider>
      <AppContent />
      <SystemErrorScreen />
    </SystemErrorProvider>
  );
}
