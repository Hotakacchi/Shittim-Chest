import { useWindowDimensions } from 'react-native';

// Android's own breakpoint for "tablet" is a shortest-side of 600dp (sw600dp).
// react-native's width/height are already density-independent, so this
// threshold applies directly without extra PixelRatio math.
const TABLET_SHORTEST_SIDE_DP = 600;

export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);
  return shortestSide >= TABLET_SHORTEST_SIDE_DP;
}
