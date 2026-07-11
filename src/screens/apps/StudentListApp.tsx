import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { CHARACTER_IMAGES } from '../../data/characterImageMap';
import { getTodaysDutyStudent } from '../../lib/dutyStudent';
import { getOwnedCharacters, setOwnedCharacters, toggleOwnedCharacter } from '../../lib/ownedCharacters';
import { StudentDetailModal } from '../../components/StudentDetailModal';
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

export function StudentListApp() {
  const [selected, setSelected] = useState<Character | null>(null);
  const [owned, setOwned] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    getOwnedCharacters().then(setOwned);
  }, []);

  const dutyStudent = getTodaysDutyStudent(new Date(), owned);

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

  return (
    <>
      <View style={styles.toolbar}>
        <Text style={styles.hint}>
          {editMode
            ? 'タップして持っているキャラを選択'
            : '★編集で持っているキャラを選ぶと、本日の当番はその中から選ばれます'}
        </Text>
        <View style={styles.toolbarButtons}>
          {editMode && (
            <>
              <Pressable style={styles.toolbarButton} onPress={handleSelectAll}>
                <Text style={styles.toolbarButtonLabel}>すべて選択</Text>
              </Pressable>
              <Pressable style={styles.toolbarButton} onPress={handleDeselectAll}>
                <Text style={styles.toolbarButtonLabel}>すべて解除</Text>
              </Pressable>
            </>
          )}
          <Pressable
            style={[styles.toolbarButton, editMode && styles.toolbarButtonActive]}
            onPress={() => setEditMode((v) => !v)}
          >
            <Text style={[styles.toolbarButtonLabel, editMode && styles.toolbarButtonLabelActive]}>
              {editMode ? '完了' : '編集'}
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
        renderItem={({ item }) => {
          if ('filler' in item) {
            return <View style={styles.filler} />;
          }
          const isDuty = item.image === dutyStudent.image;
          const isOwned = owned.includes(item.image);
          return (
            <Pressable
              style={[
                styles.card,
                isDuty && styles.cardDuty,
                editMode && !isOwned && styles.cardUnowned,
              ]}
              onPress={() => (editMode ? handleToggleOwned(item.image) : setSelected(item))}
            >
              {isDuty && (
                <View style={styles.dutyBadge}>
                  <Text style={styles.dutyBadgeLabel}>当番</Text>
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
        }}
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
