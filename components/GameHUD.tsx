
import React from 'react';
import { Player } from '../types';

interface GameHUDProps {
  players: Player[];
  currentPlayerIndex: number;
  tileBagCount: number;
  onPass: () => void;
  onSubmit: () => void;
  onShuffle: () => void;
  canSubmit: boolean;
}

const GameHUD: React.FC<GameHUDProps> = ({ 
  players, 
  currentPlayerIndex, 
  tileBagCount, 
  onPass, 
  onSubmit, 
  onShuffle,
  canSubmit
}) => {
  return (
    <div className="flex flex-col gap-4 bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full max-w-xs shadow-xl">
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-700 pb-3 flex justify-between items-center">
          Leaderboard
          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px]">BAG: {tileBagCount}</span>
        </h3>
        <div className="space-y-2">
          {players.map((player, idx) => (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${idx === currentPlayerIndex ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20 scale-105' : 'bg-slate-700 opacity-60'}`}
            >
              <div className="flex flex-col">
                <span className="font-bold truncate max-w-[120px]">{player.name}</span>
                <span className={`text-[10px] uppercase font-bold ${idx === currentPlayerIndex ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {idx === currentPlayerIndex ? 'Current Turn' : `Player ${idx + 1}`}
                </span>
              </div>
              <div className="text-2xl font-black">{player.score}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-slate-700">
        <button 
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`py-4 px-4 rounded-xl font-black transition-all shadow-lg ${canSubmit ? 'bg-green-600 hover:bg-green-500 active:scale-95 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
        >
          SUBMIT WORD
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={onShuffle}
            className="py-3 px-4 bg-slate-700 hover:bg-slate-650 rounded-xl text-xs font-bold transition-colors text-slate-300"
          >
            SHUFFLE
          </button>
          <button 
            onClick={onPass}
            className="py-3 px-4 bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 rounded-xl text-xs font-bold transition-colors"
          >
            PASS
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;
