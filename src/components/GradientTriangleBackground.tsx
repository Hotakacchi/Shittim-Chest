import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Pattern,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/colors';

const TILE_W = 70;
const TILE_H = 61;

export function GradientTriangleBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.gradientTop} />
            <Stop offset="1" stopColor={colors.gradientBottom} />
          </LinearGradient>
          <RadialGradient id="bg-glow" cx="0%" cy="100%" r="75%">
            <Stop offset="0" stopColor="#ffd9c2" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#ffd9c2" stopOpacity={0} />
          </RadialGradient>
          <Pattern
            id="bg-triangles"
            width={TILE_W}
            height={TILE_H}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M0,${TILE_H} L${TILE_W / 2},0 L${TILE_W},${TILE_H} Z`}
              fill="rgba(255,255,255,0.10)"
            />
            <Path
              d={`M0,0 L${TILE_W / 2},${TILE_H} L${TILE_W},0 Z`}
              fill="rgba(255,255,255,0.04)"
            />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-grad)" />
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-triangles)" />
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-glow)" />
      </Svg>
    </View>
  );
}
