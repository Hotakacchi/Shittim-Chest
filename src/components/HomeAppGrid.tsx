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
import { colors } from '../theme/colors';
import type { IconProps } from './icons/AppIcons';

const TILE_SIZE = 104;
const GRID_GAP = 28;
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

type Props = {
  apps: AppDef[];
  onLaunch: (key: string) => void;
};

export function HomeAppGrid({ apps, onLaunch }: Props) {
  const [order, setOrder] = useState(() => apps.map((a) => a.key));
  const [editMode, setEditMode] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const editModeRef = useRef(editMode);
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);
  const orderRef = useRef(order);
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const maxColumns = Math.max(1, Math.floor((containerWidth + GRID_GAP) / CELL_W));
  const columns = Math.min(maxColumns, apps.length);
  const gridWidth = columns * CELL_W - GRID_GAP;
  const offsetX = Math.max(0, (containerWidth - gridWidth) / 2);

  function slotPosition(index: number): Point {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return { x: offsetX + col * CELL_W, y: row * CELL_H };
  }

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
    if (containerWidth === 0) return;
    order.forEach((key, index) => {
      const pos = slotPosition(index);
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
  }, [order, columns, containerWidth, draggingKey]);

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
            const dropCenter = {
              x: base.x + gesture.dx + TILE_SIZE / 2,
              y: base.y + gesture.dy + TILE_SIZE / 2,
            };

            let nearestIndex = 0;
            let nearestDist = Infinity;
            orderRef.current.forEach((_k, idx) => {
              const slot = slotPosition(idx);
              const center = { x: slot.x + TILE_SIZE / 2, y: slot.y + TILE_SIZE / 2 };
              const dist = (center.x - dropCenter.x) ** 2 + (center.y - dropCenter.y) ** 2;
              if (dist < nearestDist) {
                nearestDist = dist;
                nearestIndex = idx;
              }
            });

            const next = [...orderRef.current];
            const fromIndex = next.indexOf(key);
            next.splice(fromIndex, 1);
            next.splice(nearestIndex, 0, key);

            Animated.spring(scaleRef.current[key], { toValue: 1, useNativeDriver: false }).start();
            setDraggingKey(null);
            setOrder(next);
          } else if (!moved) {
            onLaunch(key);
          }
        },
        onPanResponderTerminate: () => {
          if (longPressTimer) clearTimeout(longPressTimer);
          if (dragging) {
            Animated.spring(scaleRef.current[key], { toValue: 1, useNativeDriver: false }).start();
            setDraggingKey(null);
            setOrder((current) => [...current]);
          }
        },
      });
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps, onLaunch]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const rowCount = columns > 0 ? Math.ceil(order.length / columns) : 0;
  const gridHeight = rowCount * CELL_H;

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
      <View style={{ height: gridHeight, width: '100%' }}>
        {apps.map((app) => {
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
                <Icon size={32} />
              </View>
              <Text style={styles.label}>{app.label}</Text>
            </Animated.View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  doneRow: {
    alignItems: 'flex-end',
    marginBottom: 12,
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
