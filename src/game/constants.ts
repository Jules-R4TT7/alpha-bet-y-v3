export const LETTER_TIERS = {
  easy: {
    letters: ["S", "C", "P", "B", "M", "R", "T", "A", "D"],
    minWordLength: 5,
  },
  medium: {
    letters: ["E", "F", "G", "H", "I", "L", "N", "O", "W", "U"],
    minWordLength: 4,
  },
  hard: {
    letters: ["V", "K", "J", "Y"],
    minWordLength: 4,
  },
  brutal: {
    letters: ["Q", "X", "Z"],
    minWordLength: 4,
  },
} as const;

export type LetterTier = keyof typeof LETTER_TIERS;

export const SCORING = {
  short: { maxLength: 5, points: 1 },
  medium: { maxLength: 8, points: 2 },
  long: { minLength: 9, points: 3 },
} as const;

export const GAME_DEFAULTS = {
  roundTimeSeconds: 20,
  totalRounds: 3,
  defaultBid: 5,
  minBid: 1,
  maxBid: 20,
} as const;

export function scoreWord(word: string): number {
  const len = word.length;
  if (len <= SCORING.short.maxLength) return SCORING.short.points;
  if (len <= SCORING.medium.maxLength) return SCORING.medium.points;
  return SCORING.long.points;
}

export function getLetterTier(letter: string): LetterTier {
  const upper = letter.toUpperCase();
  for (const [tier, config] of Object.entries(LETTER_TIERS)) {
    if (config.letters.includes(upper as never)) {
      return tier as LetterTier;
    }
  }
  return "medium";
}

export function getMinWordLength(letter: string): number {
  const tier = getLetterTier(letter);
  return LETTER_TIERS[tier].minWordLength;
}
