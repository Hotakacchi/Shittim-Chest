import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
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
const SCROLL_DURATION_MS = 9000;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LAYER_W = SCREEN_W + TILE_W * 2;
const LAYER_H = SCREEN_H + TILE_H * 2;

export function GradientTriangleBackground() {
  const scroll = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scroll, {
        toValue: 1,
        duration: SCROLL_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [scroll]);

  const translateX = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -TILE_W] });
  const translateY = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -TILE_H] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.gradientTop} />
            <Stop offset="1" stopColor={colors.gradientBottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-grad)" />
      </Svg>

      <View style={[StyleSheet.absoluteFill, styles.clip]}>
        <Animated.View
          style={{
            position: 'absolute',
            left: -TILE_W,
            top: -TILE_H,
            width: LAYER_W,
            height: LAYER_H,
            transform: [{ translateX }, { translateY }],
          }}
        >
          <Svg width={LAYER_W} height={LAYER_H}>
            <Defs>
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
            <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-triangles)" />
          </Svg>
        </Animated.View>
      </View>

      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg-glow" cx="0%" cy="100%" r="75%">
            <Stop offset="0" stopColor="#ffd9c2" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#ffd9c2" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-glow)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
