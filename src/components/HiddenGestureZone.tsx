import { useRef } from 'react';
import type { ReactNode } from 'react';
import { GestureResponderEvent, View } from 'react-native';

type Direction = 'up' | 'down' | 'left' | 'right';

// ↑↑↓↓→←→← — a sequence of separate swipes, not one continuous drag.
const TARGET_PATTERN: Direction[] = ['up', 'up', 'down', 'down', 'right', 'left', 'right', 'left'];
const SWIPE_MIN_DISTANCE = 40;
const SEQUENCE_TIMEOUT_MS = 2500;

export function HiddenGestureZone({
  children,
  onUnlock,
  onProgress,
}: {
  children: ReactNode;
  onUnlock: () => void;
  onProgress?: (step: number, total: number) => void;
}) {
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const sequence = useRef<Direction[]>([]);
  const lastSwipeTime = useRef(0);

  function report() {
    onProgress?.(sequence.current.length, TARGET_PATTERN.length);
  }

  function handleGrant(event: GestureResponderEvent) {
    const { pageX, pageY } = event.nativeEvent;
    startPoint.current = { x: pageX, y: pageY };
  }

  function handleRelease(event: GestureResponderEvent) {
    const start = startPoint.current;
    startPoint.current = null;
    if (!start) return;

    const { pageX, pageY } = event.nativeEvent;
    const dx = pageX - start.x;
    const dy = pageY - start.y;
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE && Math.abs(dy) < SWIPE_MIN_DISTANCE) {
      return; // too small to count as a swipe — a plain tap, ignore it
    }

    const direction: Direction =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

    const now = Date.now();
    if (now - lastSwipeTime.current > SEQUENCE_TIMEOUT_MS) {
      sequence.current = [];
    }
    lastSwipeTime.current = now;

    const expected = TARGET_PATTERN[sequence.current.length];
    if (direction === expected) {
      sequence.current = [...sequence.current, direction];
      if (sequence.current.length === TARGET_PATTERN.length) {
        sequence.current = [];
        report();
        onUnlock();
        return;
      }
    } else {
      // Forgiving restart: if this wrong swipe happens to be the pattern's
      // first direction, treat it as a fresh attempt starting now.
      sequence.current = direction === TARGET_PATTERN[0] ? [direction] : [];
    }
    report();
  }

  return (
    <View
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderRelease={handleRelease}
      onResponderTerminate={() => {
        startPoint.current = null;
      }}
    >
      {children}
    </View>
  );
}
