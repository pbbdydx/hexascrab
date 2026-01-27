
import React, { useMemo } from 'react';
import HexTile from './HexTile';
import { BOARD_RADIUS } from '../constants';
import { BoardTile, ModifierType } from '../types';
import { coordToKey } from '../utils/hexUtils';

interface GameBoardProps {
  board: Record<string, BoardTile>;
  modifiers: Record<string, ModifierType>;
  tentativeMoves: Record<string, BoardTile>;
  onCellClick: (q: number, r: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ board, modifiers, tentativeMoves, onCellClick }) => {
  const size = 30; // Radius of a single hex in pixels

  const hexes = useMemo(() => {
    const results = [];
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
      const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
      for (let r = r1; r <= r2; r++) {
        const key = coordToKey(q, r);
        const tile = board[key] || tentativeMoves[key];
        results.push({
          q, r,
          tile,
          modifier: modifiers[key],
          isCenter: q === 0 && r === 0
        });
      }
    }
    return results;
  }, [board, modifiers, tentativeMoves]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg 
        viewBox="-400 -400 800 800" 
        className="w-full h-full max-w-[min(80vh,800px)] aspect-square drop-shadow-2xl"
        style={{ touchAction: 'none' }}
      >
        <g>
          {hexes.map(({ q, r, tile, modifier, isCenter }) => (
            <HexTile
              key={`${q}-${r}`}
              q={q}
              r={r}
              size={size}
              letter={tile?.letter}
              value={tile?.value}
              modifier={modifier}
              isTentative={tile?.isTentative}
              isCenter={isCenter}
              onClick={() => onCellClick(q, r)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default GameBoard;
