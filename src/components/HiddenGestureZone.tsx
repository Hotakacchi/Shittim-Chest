import { useRef } from 'react';
import type { ReactNode } from 'react';
import { GestureResponderEvent, View } from 'react-native';

type Direction = 'up' | 'down' | 'left' | 'right';

// ↑↑↓↓→←→← — held and dragged as one continuous press, not tapped.
const TARGET_PATTERN: Direction[] = ['up', 'up', 'down', 'down', 'right', 'left', 'right', 'left'];
const MOVE_THRESHOLD = 35;

export function HiddenGestureZone({ children, onUnlock }: { children: ReactNode; onUnlock: () => void }) {
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const sequence = useRef<Direction[]>([]);

  function reset() {
    lastPoint.current = null;
    sequence.current = [];
  }

  function handleGrant(event: GestureResponderEvent) {
    const { pageX, pageY } = event.nativeEvent;
    lastPoint.current = { x: pageX, y: pageY };
    sequence.current = [];
  }

  function handleMove(event: GestureResponderEvent) {
    if (!lastPoint.current) return;
    const { pageX, pageY } = event.nativeEvent;
    const dx = pageX - lastPoint.current.x;
    const dy = pageY - lastPoint.current.y;
    if (Math.abs(dx) < MOVE_THRESHOLD && Math.abs(dy) < MOVE_THRESHOLD) return;

    const direction: Direction =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    lastPoint.current = { x: pageX, y: pageY };

    const expected = TARGET_PATTERN[sequence.current.length];
    if (direction === expected) {
      sequence.current = [...sequence.current, direction];
      if (sequence.current.length === TARGET_PATTERN.length) {
        sequence.current = [];
        onUnlock();
      }
    } else {
      // Forgiving restart: if this wrong move happens to be the pattern's
      // first direction, treat it as a fresh attempt starting now.
      sequence.current = direction === TARGET_PATTERN[0] ? [direction] : [];
    }
  }

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={reset}
      onResponderTerminate={reset}
    >
      {children}
    </View>
  );
}
