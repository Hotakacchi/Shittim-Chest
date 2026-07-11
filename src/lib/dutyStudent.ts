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
export function getTodaysDutyStudent(date: Date) {
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const index = hashString(dateKey) % characters.length;
  return characters[index];
}
