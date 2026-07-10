import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

// Fixed, generously oversized regardless of device — comfortably larger
// than the longest edge of any iPad in either orientation. The point is to
// never need to reactively resize anything on rotation at all: every
// previous attempt tied the background's size to window/onLayout
// measurements that update on rotation, and something in that update path
// (still not fully understood) left it clamped to roughly the shorter
// screen edge after rotating. A static, oversized, centered layer sidesteps
// the problem entirely — it never needs to change size, so there's nothing
// to get stuck. Only its position/opacity animate (transforms), which is safe.
const OVERSIZE = 1800;
const OFFSET = -300;
const STAR_COUNT = 36;

function makeRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// dir: which way the triangle's point faces (0=up, 1=right, 2=down, 3=left).
function triPath(cx: number, cy: number, size: number, dir: number): string {
  const h = size * 0.866;
  if (dir === 0) return `M${cx - size / 2},${cy + h / 2} L${cx},${cy - h / 2} L${cx + size / 2},${cy + h / 2} Z`;
  if (dir === 2) return `M${cx - size / 2},${cy - h / 2} L${cx},${cy + h / 2} L${cx + size / 2},${cy - h / 2} Z`;
  if (dir === 1) return `M${cx - h / 2},${cy - size / 2} L${cx + h / 2},${cy} L${cx - h / 2},${cy + size / 2} Z`;
  return `M${cx + h / 2},${cy - size / 2} L${cx - h / 2},${cy} L${cx + h / 2},${cy + size / 2} Z`;
}

// Scatters triangles inside one cell, then tiles that cell across the whole
// oversized canvas and groups them into a few opacity tiers (one combined
// <Path> per tier, since a single Path can only have one fill). Tiling the
// same scattered cell means a scroll of exactly one cellSize wraps
// seamlessly, with no visible reset.
function makeScatterTiers(
  seed: number,
  cellSize: number,
  perCell: number,
  sizeRange: [number, number],
  opacityTiers: number[],
): string[] {
  const rand = makeRand(seed);
  const cellShapes = Array.from({ length: perCell }, () => ({
    cx: rand() * cellSize,
    cy: rand() * cellSize,
    size: sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]),
    dir: Math.floor(rand() * 4),
    tier: Math.floor(rand() * opacityTiers.length),
  }));
  const span = Math.ceil(OVERSIZE / cellSize) + 1;
  const tierPaths = opacityTiers.map(() => '');
  const result = [...tierPaths];
  for (let row = 0; row < span; row++) {
    for (let col = 0; col < span; col++) {
      const offX = col * cellSize;
      const offY = row * cellSize;
      cellShapes.forEach((shape) => {
        result[shape.tier] += triPath(shape.cx + offX, shape.cy + offY, shape.size, shape.dir) + ' ';
      });
    }
  }
  return result;
}

type Star = { x: number; y: number; r: number; opacity: number };

function makeStars(seed: number): Star[] {
  const rand = makeRand(seed);
  return Array.from({ length: STAR_COUNT }, () => ({
    x: rand() * OVERSIZE,
    y: rand() * OVERSIZE,
    r: 0.6 + rand() * 1.6,
    opacity: 0.15 + rand() * 0.45,
  }));
}

const GROUPS = [
  { seed: 7, cellSize: 480, perCell: 8, sizeRange: [60, 100] as [number, number], tiers: [0.04, 0.07, 0.11], dirX: 1, dirY: 0.6, duration: 26000 },
  { seed: 23, cellSize: 400, perCell: 7, sizeRange: [40, 68] as [number, number], tiers: [0.05, 0.08, 0.12], dirX: -0.7, dirY: 1, duration: 18000 },
  { seed: 61, cellSize: 320, perCell: 6, sizeRange: [26, 46] as [number, number], tiers: [0.06, 0.1, 0.15], dirX: 0.5, dirY: -1, duration: 12500 },
];

export function GradientTriangleBackground() {
  const anims = useRef(GROUPS.map(() => new Animated.Value(0))).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const stars = useMemo(() => makeStars(42), []);
  const groupTierPaths = useMemo(
    () => GROUPS.map((g) => makeScatterTiers(g.seed, g.cellSize, g.perCell, g.sizeRange, g.tiers)),
    [],
  );

  useEffect(() => {
    const loops = GROUPS.map((g, i) =>
      Animated.loop(
        Animated.timing(anims[i], {
          toValue: 1,
          duration: g.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(twinkle, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loops.forEach((loop) => loop.start());
    twinkleLoop.start();
    return () => {
      loops.forEach((loop) => loop.stop());
      twinkleLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const starOpacity = twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.gradientTop, colors.gradientBottom]}
        start={{ x: 0.5, y: 0.17 }}
        end={{ x: 0.5, y: 0.7 }}
        style={styles.fill}
      />

      {GROUPS.map((g, i) => {
        const translateX = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, g.cellSize * g.dirX] });
        const translateY = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, g.cellSize * g.dirY] });
        return (
          <View key={i} style={styles.clip}>
            <Animated.View style={[styles.fill, { transform: [{ translateX }, { translateY }] }]}>
              <Svg width="100%" height="100%">
                {groupTierPaths[i].map((d, tierIndex) => (
                  <Path key={tierIndex} d={d} fill="#ffffff" fillOpacity={g.tiers[tierIndex]} />
                ))}
              </Svg>
            </Animated.View>
          </View>
        );
      })}

      <Animated.View style={[styles.fill, { opacity: starOpacity }]}>
        <Svg width="100%" height="100%">
          {stars.map((star, i) => (
            <Circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#ffffff" fillOpacity={star.opacity} />
          ))}
        </Svg>
      </Animated.View>

      <View style={styles.fill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="bg-glow" cx="15%" cy="83%" r="45%">
              <Stop offset="0" stopColor="#ffd9c2" stopOpacity={0.35} />
              <Stop offset="1" stopColor="#ffd9c2" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#bg-glow)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: OFFSET,
    left: OFFSET,
    width: OVERSIZE,
    height: OVERSIZE,
  },
  clip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
