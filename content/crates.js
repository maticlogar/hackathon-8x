// Crate type configs for the Shop. Odds are out of 100, must sum to 100.
export const CRATE_TYPES = [
  {
    id: 'basic',
    name: 'Osnovni zaboj',
    nameEn: 'Basic Crate',
    cost: 100,
    image: require('../assets/mascots/chest-basic.png'),
    imageOpen: require('../assets/mascots/basic-chest-open.png'),
    odds: { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 },
  },
  {
    id: 'premium',
    name: 'Premium zaboj',
    nameEn: 'Premium Crate',
    cost: 300,
    image: require('../assets/mascots/chest-premium.png'),
    imageOpen: require('../assets/mascots/basic-chest-open.png'),
    odds: { common: 35, uncommon: 30, rare: 20, epic: 11, legendary: 4 },
  },
];

export const getCrateType = (id) => CRATE_TYPES.find((c) => c.id === id);
