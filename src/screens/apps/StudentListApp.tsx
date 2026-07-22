import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { CHARACTER_IMAGES } from '../../data/characterImageMap';
import { getOrCreateTodaysDutyStudent } from '../../lib/dutyStudent';
import { getOwnedCharacters, setOwnedCharacters, toggleOwnedCharacter } from '../../lib/ownedCharacters';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { useLanguage } from '../../i18n';
import characters from '../../data/characters.json';

const NUM_COLUMNS = 6;

type Character = (typeof characters)[number];
type ListEntry = Character | { filler: true; key: string };

// FlatList grid rows stretch their cards with flex:1 to fill the row width
// — fine for full rows, but the last row (when the count doesn't divide
// evenly by NUM_COLUMNS) has fewer cards, so they'd stretch to fill the
// leftover space and look oversized. Padding with invisible filler entries
// keeps every row's card count (and therefore card width) consistent.
function buildListData(): ListEntry[] {
  const remainder = characters.length % NUM_COLUMNS;
  if (remainder === 0) return characters;
  const fillerCount = NUM_COLUMNS - remainder;
  const fillers: ListEntry[] = Array.from({ length: fillerCount }, (_, i) => ({
    filler: true,
    key: `filler-${i}`,
  }));
  return [...characters, ...fillers];
}

const LIST_DATA = buildListData();

// Memoized so a state change elsewhere (owned/editMode/dutyStudent) only
// re-renders the cards whose own props actually changed, instead of all
// ~200 cards on every toggle — the FlatList re-render cost was the main
// source of the choppy scrolling reported on Android.
const StudentCard = memo(function StudentCard({
  item,
  isDuty,
  isOwned,
  editMode,
  dutyLabel,
  onPress,
}: {
  item: Character;
  isDuty: boolean;
  isOwned: boolean;
  editMode: boolean;
  dutyLabel: string;
  onPress: (item: Character) => void;
}) {
  return (
    <Pressable
      style={[styles.card, isDuty && styles.cardDuty, editMode && !isOwned && styles.cardUnowned]}
      onPress={() => onPress(item)}
    >
      {isDuty && (
        <View style={styles.dutyBadge}>
          <Text style={styles.dutyBadgeLabel}>{dutyLabel}</Text>
        </View>
      )}
      <View style={styles.ownedBadge}>
        <Text style={[styles.ownedBadgeLabel, isOwned && styles.ownedBadgeLabelActive]}>
          {isOwned ? '★' : '☆'}
        </Text>
      </View>
      <View style={styles.imageWrap}>
        <Image source={CHARACTER_IMAGES[item.image]} style={styles.image} resizeMode="contain" />
      </View>
      <View style={[styles.nameBar, isDuty && styles.nameBarDuty]}>
        <Text style={styles.nameText} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </Pressable>
  );
});

export function StudentListApp() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<Character | null>(null);
  const [owned, setOwned] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [dutyStudent, setDutyStudent] = useState<Character | null>(null);
  const editModeRef = useRef(editMode);

  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);

  useEffect(() => {
    getOwnedCharacters().then((initialOwned) => {
      setOwned(initialOwned);
      // Resolved once per day and locked in — later edits to `owned` in this
      // session (via toggling/select-all/deselect-all below) intentionally
      // don't re-trigger this, so today's duty pick doesn't shift underfoot.
      getOrCreateTodaysDutyStudent(initialOwned).then(setDutyStudent);
    });
  }, []);

  useEffect(() => {
    if (!editMode) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setEditMode(false);
      return true;
    });
    return () => sub.remove();
  }, [editMode]);

  function handleToggleOwned(image: string) {
    toggleOwnedCharacter(image).then(setOwned);
  }

  function handleSelectAll() {
    const all = characters.map((c) => c.image);
    setOwnedCharacters(all).then(() => setOwned(all));
  }

  function handleDeselectAll() {
    setOwnedCharacters([]).then(() => setOwned([]));
  }

  // Stable across renders (empty deps) so it doesn't defeat StudentCard's
  // memoization — editMode is read via a ref instead of a closure variable.
  const handleCardPress = useCallback((item: Character) => {
    if (editModeRef.current) {
      handleToggleOwned(item.image);
    } else {
      setSelected(item);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dutyLabel = t('students.dutyBadge');

  const renderItem = useCallback(
    ({ item }: { item: ListEntry }) => {
      if ('filler' in item) {
        return <View style={styles.filler} />;
      }
      return (
        <StudentCard
          item={item}
          isDuty={item.image === dutyStudent?.image}
          isOwned={owned.includes(item.image)}
          editMode={editMode}
          dutyLabel={dutyLabel}
          onPress={handleCardPress}
        />
      );
    },
    [dutyStudent, owned, editMode, dutyLabel, handleCardPress],
  );

  return (
    <>
      <View style={styles.toolbar}>
        <Text style={styles.hint}>
          {editMode ? t('students.hintEdit') : t('students.hintNormal')}
        </Text>
        <View style={styles.toolbarButtons}>
          {editMode && (
            <>
              <Pressable style={styles.toolbarButton} onPress={handleSelectAll}>
                <Text style={styles.toolbarButtonLabel}>{t('common.selectAll')}</Text>
              </Pressable>
              <Pressable style={styles.toolbarButton} onPress={handleDeselectAll}>
                <Text style={styles.toolbarButtonLabel}>{t('common.deselectAll')}</Text>
              </Pressable>
            </>
          )}
          <Pressable
            style={[styles.toolbarButton, editMode && styles.toolbarButtonActive]}
            onPress={() => setEditMode((v) => !v)}
          >
            <Text style={[styles.toolbarButtonLabel, editMode && styles.toolbarButtonLabelActive]}>
              {editMode ? t('common.done') : t('common.edit')}
            </Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={LIST_DATA}
        keyExtractor={(item) => ('filler' in item ? item.key : item.image)}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        removeClippedSubviews
        maxToRenderPerBatch={12}
        windowSize={7}
        initialNumToRender={24}
      />
      <StudentDetailModal student={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  hint: {
    flex: 1,
    color: colors.inkDim,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  toolbarButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarButton: {
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toolbarButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toolbarButtonLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
  toolbarButtonLabelActive: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.panelOnLight,
    borderWidth: 1,
    borderColor: colors.panelBorderOnLight,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filler: {
    flex: 1,
  },
  cardDuty: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  cardUnowned: {
    opacity: 0.45,
  },
  dutyBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dutyBadgeLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  ownedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 1,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownedBadgeLabel: {
    color: colors.inkDim,
    fontSize: 16,
  },
  ownedBadgeLabelActive: {
    color: colors.warning,
  },
  imageWrap: {
    aspectRatio: 200 / 226,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  nameBar: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  nameBarDuty: {
    backgroundColor: 'rgba(94, 200, 224, 0.2)',
  },
  nameText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '600',
  },
});
