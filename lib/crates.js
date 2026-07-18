import wordpool from '../content/wordpool.json';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function rollRarity(odds) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += odds[rarity] ?? 0;
    if (roll < cumulative) return rarity;
  }
  return RARITY_ORDER[RARITY_ORDER.length - 1];
}

export function pickWordForRarity(rarity) {
  const candidates = wordpool.filter((w) => w.rarity === rarity);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Rolls a crate: picks a rarity from the crate's odds (or a forced rarity in
// demo mode), then a random word of that rarity from the pool.
export function openCrate(crateType, forcedRarity) {
  const rarity = forcedRarity ?? rollRarity(crateType.odds);
  return pickWordForRarity(rarity);
}
