import { useState } from 'react';
import { useIsTablet } from './src/hooks/useIsTablet';
import { BootScreen } from './src/screens/BootScreen';
import { OSHomeScreen } from './src/screens/OSHomeScreen';
import { RejectionScreen } from './src/screens/RejectionScreen';

export default function App() {
  const isTablet = useIsTablet();
  const [booted, setBooted] = useState(false);

  if (!booted) {
    return <BootScreen onFinish={() => setBooted(true)} />;
  }
  return isTablet ? <OSHomeScreen /> : <RejectionScreen />;
}
