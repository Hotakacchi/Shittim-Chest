import characters from '../data/characters.json';

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Deterministic pick from the date alone — same result all day, changes the
// next day, and needs no storage since it's just recomputed each time.
// If ownedImages is given and non-empty, only picks from that subset (so
// the duty student is always someone the player actually has); otherwise
// falls back to the full roster.
export function getTodaysDutyStudent(date: Date, ownedImages?: string[]) {
  const pool =
    ownedImages && ownedImages.length > 0
      ? characters.filter((c) => ownedImages.includes(c.image))
      : characters;
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const index = hashString(dateKey) % pool.length;
  return pool[index];
}
