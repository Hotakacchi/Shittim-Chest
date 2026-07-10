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
import { colors } from '../theme/colors';
import { STORAGE_KEYS } from '../lib/storageKeys';
import type { IconProps } from './icons/AppIcons';

const TILE_SIZE = 86;
const GRID_GAP = TILE_SIZE;
const LABEL_AREA = 32;
const CELL_W = TILE_SIZE + GRID_GAP;
const CELL_H = TILE_SIZE + LABEL_AREA + GRID_GAP;
const LONG_PRESS_MS = 420;
const DRAG_SLOP = 8;

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
        onPanResponderRelease: (_evt, gesture) => {
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
            onLaunch(key);
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

  // Rotation can fire onLayout several times in quick succession as the
  // frame animates through intermediate sizes. Debounce so only the size it
  // settles on drives seeding/persisting icon positions — acting on a
  // transient mid-rotation size would seed apps into the wrong cell and that
  // cell then gets persisted, leaving icons stuck off-grid after the layout
  // itself has corrected.
  const layoutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
    layoutDebounceRef.current = setTimeout(() => {
      setContainerSize({ width, height });
    }, 150);
  };

  return (
    <Pressable
      style={styles.container}
      onLayout={handleLayout}
      onPress={() => {
        if (editModeRef.current) setEditMode(false);
      }}
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
});
