import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { GradientTriangleBackground } from '../components/GradientTriangleBackground';
import { ProgressRing, PROGRESS_RING_SIZE } from '../components/ProgressRing';
import { useGlitchText } from '../hooks/useGlitchText';

const haloIcon = require('../../assets/boot/arona-halo.png');
const heartIcon = require('../../assets/boot/arona-heart.png');
const schaleMark = require('../../assets/boot/schale-mark.png');

const SUBTITLE_LINE_1 = 'WE THIRST FOR IMAGININGS';
const SUBTITLE_LINE_2 = 'WE ARE THE KOAN OF JERICHO';

function animate(
  value: Animated.Value,
  toValue: number,
  duration: number,
  useNativeDriver = false,
): Promise<void> {
  return new Promise((resolve) => {
    Animated.timing(value, {
      toValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start(() => resolve());
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Props = {
  onFinish: () => void;
};

export function BootScreen({ onFinish }: Props) {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const completeOpacity = useRef(new Animated.Value(0)).current;
  const loaderGroupOpacity = useRef(new Animated.Value(1)).current;
  const logoGroupOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const blackout = useRef(new Animated.Value(0)).current;
  const spinA = useRef(new Animated.Value(0)).current;
  const spinB = useRef(new Animated.Value(0)).current;

  const [percent, setPercent] = useState(0);
  const [iconMode, setIconMode] = useState<'halo' | 'heart'>('halo');
  const [glitchActive, setGlitchActive] = useState(false);

  const subtitle1 = useGlitchText(SUBTITLE_LINE_1, glitchActive);
  const subtitle2 = useGlitchText(SUBTITLE_LINE_2, glitchActive);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setPercent(Math.round(value)));
    return () => progress.removeListener(id);
  }, [progress]);

  // Silently check for an OTA update while the boot animation plays. If one
  // is found, fetch and apply it immediately — this restarts the app, so any
  // in-progress boot visuals are simply replaced by the fresh launch.
  useEffect(() => {
    if (!Updates.isEnabled) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        if (cancelled) return;
        await Updates.reloadAsync();
      } catch {
        // Offline, dev mode, etc. — proceed with the normal boot.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinA, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.timing(spinB, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinA, spinB]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      await animate(iconOpacity, 1, 400, true);
      await wait(120);
      if (cancelled) return;

      animate(bgOpacity, 1, 800, true);
      await animate(progress, 100, 1400);
      if (cancelled) return;

      setIconMode('heart');
      await animate(completeOpacity, 1, 300, true);
      await wait(450);
      if (cancelled) return;

      animate(loaderGroupOpacity, 0, 400, true);
      await wait(150);
      if (cancelled) return;

      await Promise.all([
        animate(logoGroupOpacity, 1, 550, true),
        animate(logoScale, 1, 550, true),
      ]);
      if (cancelled) return;

      setGlitchActive(true);
      await animate(subtitleOpacity, 1, 450, true);
      await wait(900);
      if (cancelled) return;

      await animate(blackout, 1, 500, true);
      if (!cancelled) onFinish();
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spinDeg = spinA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinDeg2 = spinB.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <GradientTriangleBackground />
      </Animated.View>

      <Animated.View style={[styles.center, { opacity: loaderGroupOpacity }]}>
        <Animated.View style={{ opacity: iconOpacity, alignItems: 'center' }}>
          <View style={styles.ringWrap}>
            <ProgressRing progress={progress} />
            <View style={styles.ringContent}>
              <Image
                source={iconMode === 'halo' ? haloIcon : heartIcon}
                style={styles.icon}
                resizeMode="contain"
              />
              {iconMode === 'halo' ? (
                <Text style={styles.percentText}>{percent}%</Text>
              ) : (
                <Animated.Text style={[styles.completeText, { opacity: completeOpacity }]}>
                  Complete!
                </Animated.Text>
              )}
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.center,
          { opacity: logoGroupOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoStack}>
          <Animated.View
            style={[styles.spinRing, styles.spinRingOuter, { transform: [{ rotate: spinDeg }] }]}
          />
          <Animated.View
            style={[styles.spinRing, styles.spinRingInner, { transform: [{ rotate: spinDeg2 }] }]}
          />
          <Image source={schaleMark} style={styles.schaleMark} resizeMode="contain" />
        </View>
        <Animated.View style={{ opacity: subtitleOpacity, marginTop: 22 }}>
          <Text style={styles.subtitleLine}>{subtitle1}</Text>
          <Text style={styles.subtitleLine}>{subtitle2}</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.blackout, { opacity: blackout }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringWrap: {
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 78,
    height: 122,
  },
  percentText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  completeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  logoStack: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinRing: {
    position: 'absolute',
    borderRadius: 999,
    borderColor: 'rgba(30, 58, 82, 0.4)',
  },
  spinRingOuter: {
    width: 220,
    height: 220,
    borderWidth: 1.5,
  },
  spinRingInner: {
    width: 188,
    height: 188,
    borderWidth: 1,
    borderColor: 'rgba(30, 58, 82, 0.28)',
  },
  schaleMark: {
    width: 96,
    height: 141,
  },
  subtitleLine: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 3,
    textAlign: 'center',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  blackout: {
    backgroundColor: '#000000',
  },
});
