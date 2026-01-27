
import React from 'react';
import { Tile } from '../types';

interface TileRackProps {
  tiles: Tile[];
  selectedTileId: string | null;
  onTileSelect: (tileId: string) => void;
}

const TileRack: React.FC<TileRackProps> = ({ tiles, selectedTileId, onTileSelect }) => {
  return (
    <div className="flex gap-2 p-4 bg-slate-800 rounded-xl shadow-lg border border-slate-700 min-h-[80px] items-center">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          onClick={() => onTileSelect(tile.id)}
          className={`
            w-12 h-14 flex flex-col items-center justify-center rounded-lg shadow-md transition-all
            ${selectedTileId === tile.id ? 'bg-yellow-300 -translate-y-2 ring-4 ring-yellow-500' : 'bg-amber-100 hover:bg-amber-50'}
          `}
        >
          <span className="text-xl font-bold text-slate-800">{tile.letter}</span>
          <span className="text-[10px] text-slate-600 font-bold self-end pr-1">{tile.value}</span>
        </button>
      ))}
      {tiles.length === 0 && (
        <div className="text-slate-500 italic px-4">Your rack is empty...</div>
      )}
    </div>
  );
};

export default TileRack;
