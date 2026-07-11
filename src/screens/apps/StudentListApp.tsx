import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { CHARACTER_IMAGES } from '../../data/characterImageMap';
import { getTodaysDutyStudent } from '../../lib/dutyStudent';
import characters from '../../data/characters.json';

const NUM_COLUMNS = 6;

type Character = { name: string; image: string };
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
  const dutyStudent = getTodaysDutyStudent(new Date());

  return (
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
        return (
          <View style={[styles.card, isDuty && styles.cardDuty]}>
            {isDuty && (
              <View style={styles.dutyBadge}>
                <Text style={styles.dutyBadgeLabel}>当番</Text>
              </View>
            )}
            <View style={styles.imageWrap}>
              <Image source={CHARACTER_IMAGES[item.image]} style={styles.image} resizeMode="contain" />
            </View>
            <View style={[styles.nameBar, isDuty && styles.nameBarDuty]}>
              <Text style={styles.nameText} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
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
