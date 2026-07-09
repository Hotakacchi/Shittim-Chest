import { useIsTablet } from './src/hooks/useIsTablet';
import { OSHomeScreen } from './src/screens/OSHomeScreen';
import { RejectionScreen } from './src/screens/RejectionScreen';

export default function App() {
  const isTablet = useIsTablet();
  return isTablet ? <OSHomeScreen /> : <RejectionScreen />;
}
