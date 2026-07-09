import { Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 180;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
  progress: Animated.Value; // 0-100
};

export function ProgressRing({ progress }: Props) {
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
    extrapolate: 'clamp',
  });

  return (
    <Svg width={SIZE} height={SIZE}>
      <Circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={STROKE}
        fill="none"
      />
      <AnimatedCircle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        stroke="#ffffff"
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        strokeDashoffset={strokeDashoffset}
        rotation="-90"
        originX={SIZE / 2}
        originY={SIZE / 2}
      />
    </Svg>
  );
}

export const PROGRESS_RING_SIZE = SIZE;
