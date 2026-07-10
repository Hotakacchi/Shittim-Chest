import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
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

const AnimatedPattern = Animated.createAnimatedComponent(Pattern);

export function GradientTriangleBackground() {
  // react-native-svg on iOS fails to render an <Svg> given large explicit
  // numeric width/height (confirmed by direct on-device testing: a
  // percentage-sized Svg always fills correctly, but a same-structured Svg
  // sized to window dimensions + tile padding in pixels renders short in
  // portrait and clipped in landscape). So the scrolling tile effect is done
  // by animating the <Pattern>'s own x/y origin instead of translating an
  // oversized absolutely-positioned Svg layer — every Svg here stays at a
  // plain 100%/100%.
  const scroll = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scroll, {
        toValue: 1,
        duration: SCROLL_DURATION_MS,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [scroll]);

  const patternX = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -TILE_W] });
  const patternY = scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -TILE_H] });

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

      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <AnimatedPattern
            id="bg-triangles"
            x={patternX}
            y={patternY}
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
          </AnimatedPattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-triangles)" />
      </Svg>

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
