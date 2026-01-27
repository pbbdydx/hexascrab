
export interface HexCoord {
  q: number;
  r: number;
}

export enum ModifierType {
  NONE = 'NONE',
  DOUBLE_LETTER = 'DL',
  TRIPLE_LETTER = 'TL',
  DOUBLE_WORD = 'DW',
  TRIPLE_WORD = 'TW'
}

export interface Tile {
  id: string;
  letter: string;
  value: number;
  ownerId?: string;
}

export interface BoardTile extends Tile {
  q: number;
  r: number;
  isTentative?: boolean;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  rack: Tile[];
  isAi: boolean;
}

export interface GameState {
  board: Record<string, BoardTile>;
  modifiers: Record<string, ModifierType>;
  players: Player[];
  currentPlayerIndex: number;
  tileBag: Tile[];
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  history: string[];
}
