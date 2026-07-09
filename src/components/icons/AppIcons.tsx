import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

export type IconProps = {
  size?: number;
  color?: string;
};

export function ClockIcon({ size = 28, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7.5v4.8l3.2 1.9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 28, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={15} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M3 9.5h18" stroke={color} strokeWidth={1.8} />
      <Path d="M8 3v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M16 3v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function ChecklistIcon({ size = 28, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} strokeWidth={1.8} />
      <Path
        d="M7.5 12.2l2 2 4.2-4.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7.5 16h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const GEAR_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function GearIcon({ size = 28, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {GEAR_ANGLES.map((angle) => (
        <Rect
          key={angle}
          x={10.6}
          y={1.4}
          width={2.8}
          height={4.2}
          rx={1}
          fill={color}
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <Circle cx={12} cy={12} r={4.2} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}
