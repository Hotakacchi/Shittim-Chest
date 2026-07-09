import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsTablet } from './src/hooks/useIsTablet';
import { BootScreen } from './src/screens/BootScreen';
import { OSHomeScreen } from './src/screens/OSHomeScreen';
import { RejectionScreen } from './src/screens/RejectionScreen';
import { STORAGE_KEYS } from './src/lib/storageKeys';
import { colors } from './src/theme/colors';

export default function App() {
  const isTablet = useIsTablet();
  const [booted, setBooted] = useState(false);
  const [skipBoot, setSkipBoot] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.skipBootAnimation).then((value) => {
      setSkipBoot(value === 'true');
    });
  }, []);

  if (skipBoot === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }
  if (!booted && !skipBoot) {
    return <BootScreen onFinish={() => setBooted(true)} />;
  }
  return isTablet ? <OSHomeScreen /> : <RejectionScreen />;
}
