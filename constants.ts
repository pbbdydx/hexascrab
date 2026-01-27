
import { ModifierType, Tile } from './types';

export const BOARD_RADIUS = 7;
export const RACK_SIZE = 7;

export const LETTER_DISTRIBUTION: Record<string, { count: number; value: number }> = {
  'A': { count: 9, value: 1 },
  'B': { count: 2, value: 3 },
  'C': { count: 2, value: 3 },
  'D': { count: 4, value: 2 },
  'E': { count: 12, value: 1 },
  'F': { count: 2, value: 4 },
  'G': { count: 3, value: 2 },
  'H': { count: 2, value: 4 },
  'I': { count: 9, value: 1 },
  'J': { count: 1, value: 8 },
  'K': { count: 1, value: 5 },
  'L': { count: 4, value: 1 },
  'M': { count: 2, value: 3 },
  'N': { count: 6, value: 1 },
  'O': { count: 8, value: 1 },
  'P': { count: 2, value: 3 },
  'Q': { count: 1, value: 10 },
  'R': { count: 6, value: 1 },
  'S': { count: 4, value: 1 },
  'T': { count: 6, value: 1 },
  'U': { count: 4, value: 1 },
  'V': { count: 2, value: 4 },
  'W': { count: 2, value: 4 },
  'X': { count: 1, value: 8 },
  'Y': { count: 2, value: 4 },
  'Z': { count: 1, value: 10 },
};

export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

export const MODIFIER_PROBABILITIES: Array<{ type: ModifierType; weight: number }> = [
  { type: ModifierType.DOUBLE_LETTER, weight: 0.1 },
  { type: ModifierType.TRIPLE_LETTER, weight: 0.05 },
  { type: ModifierType.DOUBLE_WORD, weight: 0.05 },
  { type: ModifierType.TRIPLE_WORD, weight: 0.02 },
];
