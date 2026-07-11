import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, Easing, GestureResponderEvent, StyleSheet, View } from 'react-native';

const RIPPLE_SIZE = 68;
const RIPPLE_DURATION_MS = 340;

type Ripple = { id: number; x: number; y: number; anim: Animated.Value };

// Wraps the whole app (mounted at the screen root, so pageX/pageY lines up
// directly with this layer's own coordinate space) to give every tap —
// home-screen icons, background, or anything inside an open app — the same
// blue ripple feedback, in one place instead of each screen reimplementing
// it. No sound playback here — expo-audio/tap.wav were removed while we
// isolate whether they were behind the launch crash.
export function TapEffectsLayer({ children }: { children: ReactNode }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);

  function handleTouchEnd(event: GestureResponderEvent) {
    const { pageX, pageY } = event.nativeEvent;

    const id = rippleIdRef.current++;
    const anim = new Animated.Value(0);
    setRipples((prev) => [...prev, { id, x: pageX, y: pageY, anim }]);
    Animated.timing(anim, {
      toValue: 1,
      duration: RIPPLE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    });
  }

  return (
    <View style={styles.fill} onTouchEnd={handleTouchEnd}>
      {children}
      {ripples.map((ripple) => {
        const scale = ripple.anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
        const opacity = ripple.anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
        return (
          <Animated.View
            key={ripple.id}
            pointerEvents="none"
            style={[
              styles.ripple,
              {
                left: ripple.x - RIPPLE_SIZE / 2,
                top: ripple.y - RIPPLE_SIZE / 2,
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    backgroundColor: '#3fa9ff',
  },
});
