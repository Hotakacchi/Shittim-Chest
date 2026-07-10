import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { colors } from '../theme/colors';
import { STORAGE_KEYS } from '../lib/storageKeys';
import type { IconProps } from './icons/AppIcons';

const tapSfx = require('../../assets/sfx/tap.wav');
const RIPPLE_SIZE = 68;
const RIPPLE_DURATION_MS = 480;

const TILE_SIZE = 86;
const GRID_GAP = TILE_SIZE;
const LABEL_AREA = 32;
const CELL_W = TILE_SIZE + GRID_GAP;
const CELL_H = TILE_SIZE + LABEL_AREA + GRID_GAP;
const LONG_PRESS_MS = 420;
const DRAG_SLOP = 8;
const DOUBLE_TAP_MS = 300;

export type AppDef = {
  key: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
};

type Point = { x: number; y: number };
type Cell = { col: number; row: number };
type Orientation = 'portrait' | 'landscape';
type PositionsBySize = Record<Orientation, Record<string, Cell>>;

const EMPTY_POSITIONS: PositionsBySize = { portrait: {}, landscape: {} };

type Ripple = { id: number; x: number; y: number; anim: Animated.Value };

type Props = {
  apps: AppDef[];
  onLaunch: (key: string) => void;
};

export function HomeAppGrid({ apps, onLaunch }: Props) {
  const [positionsBySize, setPositionsBySize] = useState<PositionsBySize>(EMPTY_POSITIONS);
  const [savedPositionsBySize, setSavedPositionsBySize] = useState<PositionsBySize | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [iconsHidden, setIconsHidden] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const iconsOpacity = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);
  const rippleIdRef = useRef(0);
  const tapSound = useAudioPlayer(tapSfx);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  function playTapEffects(center: Point) {
    tapSound.seekTo(0);
    tapSound.play();

    const id = rippleIdRef.current++;
    const anim = new Animated.Value(0);
    setRipples((prev) => [...prev, { id, x: center.x, y: center.y, anim }]);
    Animated.timing(anim, {
      toValue: 1,
      duration: RIPPLE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    });
  }

  const orientation: Orientation = containerSize.width >= containerSize.height ? 'landscape' : 'portrait';
  const positions = positionsBySize[orientation];

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.iconPositions).then((raw) => {
      if (!raw) {
        setSavedPositionsBySize(EMPTY_POSITIONS);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setSavedPositionsBySize({
          portrait: parsed.portrait ?? {},
          landscape: parsed.landscape ?? {},
        });
      } catch {
        setSavedPositionsBySize(EMPTY_POSITIONS);
      }
    });
  }, []);

  const editModeRef = useRef(editMode);
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);

  const columns = Math.max(1, Math.floor((containerSize.width + GRID_GAP) / CELL_W));
  const rows = Math.max(1, Math.floor((containerSize.height + GRID_GAP) / CELL_H));
  const gridWidth = columns * CELL_W - GRID_GAP;
  const gridHeight = rows * CELL_H - GRID_GAP;
  const offsetX = Math.max(0, (containerSize.width - gridWidth) / 2);
  const offsetY = Math.max(0, (containerSize.height - gridHeight) / 2);

  function cellPosition(cell: Cell): Point {
    return { x: offsetX + cell.col * CELL_W, y: offsetY + cell.row * CELL_H };
  }

  function clampCell(cell: Cell): Cell {
    return {
      col: Math.min(Math.max(cell.col, 0), columns - 1),
      row: Math.min(Math.max(cell.row, 0), rows - 1),
    };
  }

  // Seed initial placement for the current orientation once the container is
  // measured and any saved layout has been loaded: restore a saved cell per
  // app for this orientation, or drop apps that have never been placed in it
  // before (e.g. newly added apps) into the next free cell. When the grid
  // starts out empty, apps are laid out as a centered block that wraps onto
  // additional rows once there are more apps than columns — a single-row
  // assumption would push overflow apps out to whatever the "find first free
  // cell" fallback scan hits first (the top-left corner), which is exactly
  // what happens in portrait once 6 apps no longer fit in one row.
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;
    if (savedPositionsBySize === null) return;
    setPositionsBySize((prev) => {
      const current = prev[orientation];
      const missing = apps.filter((a) => !current[a.key]);
      if (missing.length === 0) return prev;

      const occupied = new Set(Object.values(current).map((c) => `${c.col},${c.row}`));
      const appsPerRow = Math.max(1, Math.min(columns, apps.length));
      const rowsNeeded = Math.ceil(apps.length / appsPerRow);
      const startRow = Math.max(0, Math.floor((rows - rowsNeeded) / 2));
      const startCol = Math.max(0, Math.floor((columns - appsPerRow) / 2));

      function findFreeCell(preferred: Cell): Cell {
        if (!occupied.has(`${preferred.col},${preferred.row}`)) return preferred;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < columns; col++) {
            if (!occupied.has(`${col},${row}`)) return { col, row };
          }
        }
        return preferred;
      }

      const nextForOrientation = { ...current };
      missing.forEach((app) => {
        const index = apps.indexOf(app);
        const saved = savedPositionsBySize[orientation][app.key];
        const preferred = saved
          ? clampCell(saved)
          : clampCell({
              col: startCol + (index % appsPerRow),
              row: startRow + Math.floor(index / appsPerRow),
            });
        const cell = findFreeCell(preferred);
        occupied.add(`${cell.col},${cell.row}`);
        nextForOrientation[app.key] = cell;
      });
      return { ...prev, [orientation]: nextForOrientation };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerSize.width, containerSize.height, apps, savedPositionsBySize, orientation, columns, rows]);

  // Persist layout changes (skips the initial empty state before seeding).
  useEffect(() => {
    if (
      Object.keys(positionsBySize.portrait).length === 0 &&
      Object.keys(positionsBySize.landscape).length === 0
    ) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEYS.iconPositions, JSON.stringify(positionsBySize));
  }, [positionsBySize]);

  const animsRef = useRef<Record<string, Animated.ValueXY>>({});
  const currentRef = useRef<Record<string, Point>>({});
  const scaleRef = useRef<Record<string, Animated.Value>>({});
  const jiggleRef = useRef<Record<string, Animated.Value>>({});

  apps.forEach((app) => {
    if (!animsRef.current[app.key]) animsRef.current[app.key] = new Animated.ValueXY({ x: 0, y: 0 });
    if (!scaleRef.current[app.key]) scaleRef.current[app.key] = new Animated.Value(1);
    if (!jiggleRef.current[app.key]) jiggleRef.current[app.key] = new Animated.Value(0);
  });

  useEffect(() => {
    Object.entries(positions).forEach(([key, cell]) => {
      const pos = cellPosition(cell);
      currentRef.current[key] = pos;
      if (key === draggingKey) return;
      Animated.spring(animsRef.current[key], {
        toValue: pos,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, columns, rows, containerSize, draggingKey]);

  useEffect(() => {
    const loops: Animated.CompositeAnimation[] = [];
    if (editMode) {
      apps.forEach((app, i) => {
        const val = jiggleRef.current[app.key];
        val.setValue(0);
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: 1,
              duration: 120,
              delay: i * 45,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(val, { toValue: -1, duration: 240, easing: Easing.linear, useNativeDriver: false }),
            Animated.timing(val, { toValue: 0, duration: 120, easing: Easing.linear, useNativeDriver: false }),
          ]),
        );
        loops.push(loop);
        loop.start();
      });
    } else {
      apps.forEach((app) => jiggleRef.current[app.key].setValue(0));
    }
    return () => loops.forEach((loop) => loop.stop());
  }, [editMode, apps]);

  const panResponders = useMemo(() => {
    const map: Record<string, ReturnType<typeof PanResponder.create>> = {};
    apps.forEach((app) => {
      const key = app.key;
      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      let moved = false;
      let dragging = false;

      map[key] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          moved = false;
          dragging = editModeRef.current;
          if (dragging) {
            setDraggingKey(key);
            Animated.spring(scaleRef.current[key], { toValue: 1.12, useNativeDriver: false }).start();
          } else {
            longPressTimer = setTimeout(() => {
              if (!moved) {
                dragging = true;
                setEditMode(true);
                setDraggingKey(key);
                Animated.spring(scaleRef.current[key], { toValue: 1.12, useNativeDriver: false }).start();
              }
            }, LONG_PRESS_MS);
          }
        },
        onPanResponderMove: (_evt, gesture) => {
          if (Math.abs(gesture.dx) > DRAG_SLOP || Math.abs(gesture.dy) > DRAG_SLOP) {
            moved = true;
          }
          if (dragging) {
            const base = currentRef.current[key] ?? { x: 0, y: 0 };
            animsRef.current[key].setValue({ x: base.x + gesture.dx, y: base.y + gesture.dy });
          }
        },
        onPanResponderRelease: (evt, gesture) => {
          if (longPressTimer) clearTimeout(longPressTimer);
          if (dragging) {
            const base = currentRef.current[key] ?? { x: 0, y: 0 };
            const dropCenterX = base.x + gesture.dx + TILE_SIZE / 2;
            const dropCenterY = base.y + gesture.dy + TILE_SIZE / 2;

            const targetCell = clampCell({
              col: Math.round((dropCenterX - offsetX - TILE_SIZE / 2) / CELL_W),
              row: Math.round((dropCenterY - offsetY - TILE_SIZE / 2) / CELL_H),
            });

            setPositionsBySize((prev) => {
              const current = prev[orientation];
              const next = { ...current };
              const occupant = Object.entries(current).find(
                ([otherKey, cell]) =>
                  otherKey !== key && cell.col === targetCell.col && cell.row === targetCell.row,
              );
              if (occupant) {
                next[occupant[0]] = current[key];
              }
              next[key] = targetCell;
              return { ...prev, [orientation]: next };
            });

            Animated.spring(scaleRef.current[key], { toValue: 1, useNativeDriver: false }).start();
            setDraggingKey(null);
          } else if (!moved) {
            const base = currentRef.current[key] ?? { x: 0, y: 0 };
            const { locationX, locationY } = evt.nativeEvent;
            playTapEffects({ x: base.x + locationX, y: base.y + locationY });
            // Give the ripple a moment on screen before the app takes over —
            // launching immediately covers it before it's ever visible.
            setTimeout(() => onLaunch(key), 140);
          }
        },
        onPanResponderTerminate: () => {
          if (longPressTimer) clearTimeout(longPressTimer);
          if (dragging) {
            Animated.spring(scaleRef.current[key], { toValue: 1, useNativeDriver: false }).start();
            setDraggingKey(null);
            setPositionsBySize((prev) => ({ ...prev, [orientation]: { ...prev[orientation] } }));
          }
        },
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, onLaunch, columns, rows, offsetX, offsetY, orientation]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  useEffect(() => {
    Animated.timing(iconsOpacity, {
      toValue: iconsHidden ? 0 : 1,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [iconsHidden, iconsOpacity]);

  function handleBackgroundPress(event: { nativeEvent: { locationX: number; locationY: number } }) {
    playTapEffects({ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY });

    if (editModeRef.current) {
      setEditMode(false);
      return;
    }
    if (iconsHidden) {
      setIconsHidden(false);
      lastTapRef.current = 0;
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      setIconsHidden(true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  return (
    <Pressable style={styles.container} onLayout={handleLayout} onPress={handleBackgroundPress}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: iconsOpacity }]}
        pointerEvents={iconsHidden ? 'none' : 'auto'}
      >
      {editMode && (
        <View style={styles.doneRow}>
          <Pressable style={styles.doneButton} onPress={() => setEditMode(false)}>
            <Text style={styles.doneLabel}>完了</Text>
          </Pressable>
        </View>
      )}
      {apps.map((app) => {
        if (!positions[app.key]) return null;
        const anim = animsRef.current[app.key];
        const scale = scaleRef.current[app.key];
        const jiggle = jiggleRef.current[app.key];
        const rotate = jiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-2.2deg', '2.2deg'] });
        const Icon = app.Icon;
        return (
          <Animated.View
            key={app.key}
            {...panResponders[app.key].panHandlers}
            style={[
              styles.tileWrap,
              {
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  { scale },
                  { rotate: editMode ? rotate : '0deg' },
                ],
                zIndex: draggingKey === app.key ? 10 : 1,
              },
            ]}
          >
            <View style={styles.tile}>
              <Icon size={44} />
            </View>
            <Text style={styles.label}>{app.label}</Text>
          </Animated.View>
        );
      })}
      </Animated.View>
      {ripples.map((ripple) => {
        const scale = ripple.anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
        const opacity = ripple.anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  doneRow: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 20,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
  },
  doneLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tileWrap: {
    position: 'absolute',
    width: TILE_SIZE,
    alignItems: 'center',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 24,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    backgroundColor: '#3fa9ff',
  },
});
