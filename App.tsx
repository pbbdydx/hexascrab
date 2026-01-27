
import React, { useState, useCallback } from 'react';
import { Player, Tile, BoardTile, ModifierType, GameState } from './types';
import { BOARD_RADIUS, LETTER_DISTRIBUTION, MODIFIER_PROBABILITIES, RACK_SIZE, HEX_DIRECTIONS } from './constants';
import { coordToKey, areInLine } from './utils/hexUtils';
import GameBoard from './components/GameBoard';
import TileRack from './components/TileRack';
import GameHUD from './components/GameHUD';
import { validateWords } from './services/geminiService';

const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<'LOBBY' | 'PLAYING' | 'FINISHED'>('LOBBY');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerInputs, setPlayerInputs] = useState<string[]>(['Player 1', 'Player 2']);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [tentativeMoves, setTentativeMoves] = useState<Record<string, BoardTile>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleAddPlayer = () => {
    if (playerInputs.length < 4) {
      setPlayerInputs([...playerInputs, `Player ${playerInputs.length + 1}`]);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (playerInputs.length > 2) {
      const newInputs = [...playerInputs];
      newInputs.splice(index, 1);
      setPlayerInputs(newInputs);
    }
  };

  const handleNameChange = (index: number, name: string) => {
    const newInputs = [...playerInputs];
    newInputs[index] = name;
    setPlayerInputs(newInputs);
  };

  const startGame = () => {
    // Generate Tile Bag
    const bag: Tile[] = [];
    Object.entries(LETTER_DISTRIBUTION).forEach(([letter, data]) => {
      for (let i = 0; i < data.count; i++) {
        bag.push({
          id: `${letter}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          letter,
          value: data.value,
        });
      }
    });

    // Shuffle Bag
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }

    // Generate Modifiers
    const modifiers: Record<string, ModifierType> = {};
    for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) {
      const r1 = Math.max(-BOARD_RADIUS, -q - BOARD_RADIUS);
      const r2 = Math.min(BOARD_RADIUS, -q + BOARD_RADIUS);
      for (let r = r1; r <= r2; r++) {
        if (q === 0 && r === 0) continue;
        const rand = Math.random();
        let cumulative = 0;
        for (const mod of MODIFIER_PROBABILITIES) {
          cumulative += mod.weight;
          if (rand < cumulative) {
            modifiers[coordToKey(q, r)] = mod.type;
            break;
          }
        }
      }
    }

    // Initial Players
    const players: Player[] = playerInputs.map((name, idx) => ({
      id: `p${idx + 1}`,
      name: name.trim() || `Player ${idx + 1}`,
      score: 0,
      rack: bag.splice(0, RACK_SIZE),
      isAi: false
    }));

    setGameState({
      board: {},
      modifiers,
      players,
      currentPlayerIndex: 0,
      tileBag: bag,
      status: 'PLAYING',
      history: ['Game started!']
    });
    setAppStatus('PLAYING');
    setMessage(`${players[0].name}'s turn!`);
  };

  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];

  const handleTileSelect = (tileId: string) => {
    setSelectedTileId(selectedTileId === tileId ? null : tileId);
  };

  const handleCellClick = (q: number, r: number) => {
    if (!gameState) return;
    const key = coordToKey(q, r);
    if (gameState.board[key]) return;

    if (tentativeMoves[key]) {
      const tileToReturn = tentativeMoves[key];
      const newTentative = { ...tentativeMoves };
      delete newTentative[key];
      setTentativeMoves(newTentative);
      const newPlayers = [...gameState.players];
      newPlayers[gameState.currentPlayerIndex].rack.push({
        id: tileToReturn.id,
        letter: tileToReturn.letter,
        value: tileToReturn.value
      });
      setGameState({ ...gameState, players: newPlayers });
      return;
    }

    if (selectedTileId) {
      const tileIndex = currentPlayer?.rack.findIndex(t => t.id === selectedTileId);
      if (tileIndex !== undefined && tileIndex !== -1) {
        const tile = currentPlayer!.rack[tileIndex];
        const newPlayers = [...gameState.players];
        newPlayers[gameState.currentPlayerIndex].rack.splice(tileIndex, 1);
        setTentativeMoves({
          ...tentativeMoves,
          [key]: { ...tile, q, r, isTentative: true }
        });
        setGameState({ ...gameState, players: newPlayers });
        setSelectedTileId(null);
      }
    }
  };

  const extractWords = useCallback((board: Record<string, BoardTile>, newTiles: Record<string, BoardTile>) => {
    const allPlaced = Object.values(newTiles) as BoardTile[];
    if (allPlaced.length === 0) return [];
    const findWord = (startQ: number, startR: number, dq: number, dr: number) => {
      let q = startQ, r = startR;
      let wordTiles: BoardTile[] = [];
      while (board[coordToKey(q - dq, r - dr)] || newTiles[coordToKey(q - dq, r - dr)]) {
        q -= dq; r -= dr;
      }
      let current;
      while ((current = board[coordToKey(q, r)] || newTiles[coordToKey(q, r)])) {
        wordTiles.push(current);
        q += dq; r += dr;
      }
      return wordTiles;
    };
    const wordsSet = new Set<string>();
    const fullWordTiles: BoardTile[][] = [];
    const lineDirs = [{ dq: 1, dr: 0 }, { dq: 0, dr: 1 }, { dq: -1, dr: 1 }];
    allPlaced.forEach(tile => {
      lineDirs.forEach(dir => {
        const word = findWord(tile.q, tile.r, dir.dq, dir.dr);
        if (word.length > 1) {
          const wordKey = word.map(t => `${t.q},${t.r}`).sort().join('|');
          if (!wordsSet.has(wordKey)) {
            wordsSet.add(wordKey);
            fullWordTiles.push(word);
          }
        }
      });
    });
    return fullWordTiles;
  }, []);

  const calculateScore = (wordTiles: BoardTile[], modifiers: Record<string, ModifierType>, existingBoard: Record<string, BoardTile>) => {
    let wordScore = 0, wordMultiplier = 1;
    wordTiles.forEach(tile => {
      let letterValue = tile.value;
      const key = coordToKey(tile.q, tile.r);
      const mod = modifiers[key];
      if (!existingBoard[key] && mod) {
        if (mod === ModifierType.DOUBLE_LETTER) letterValue *= 2;
        if (mod === ModifierType.TRIPLE_LETTER) letterValue *= 3;
        if (mod === ModifierType.DOUBLE_WORD) wordMultiplier *= 2;
        if (mod === ModifierType.TRIPLE_WORD) wordMultiplier *= 3;
      }
      wordScore += letterValue;
    });
    return wordScore * wordMultiplier;
  };

  const handlePass = () => {
    if (!gameState) return;
    const newRack = [...gameState.players[gameState.currentPlayerIndex].rack];
    (Object.values(tentativeMoves) as BoardTile[]).forEach(t => {
      newRack.push({ id: t.id, letter: t.letter, value: t.value });
    });
    const nextIdx = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    const newPlayers = [...gameState.players];
    newPlayers[gameState.currentPlayerIndex].rack = newRack;
    setTentativeMoves({});
    setGameState({
      ...gameState,
      players: newPlayers,
      currentPlayerIndex: nextIdx,
      history: [...gameState.history, `${gameState.players[gameState.currentPlayerIndex].name} passed.`]
    });
    setMessage(`${newPlayers[nextIdx].name}'s turn!`);
  };

  const handleSubmit = async () => {
    if (!gameState || Object.keys(tentativeMoves).length === 0) return;
    setIsSubmitting(true);
    setMessage("Validating words...");
    const placedCoords = Object.values(tentativeMoves) as BoardTile[];
    if (!areInLine(placedCoords)) {
      setMessage("Tiles must be in a line!");
      setIsSubmitting(false); return;
    }
    const isFirstMove = Object.keys(gameState.board).length === 0;
    if (isFirstMove) {
      if (!tentativeMoves[coordToKey(0, 0)]) {
        setMessage("First word must hit center!");
        setIsSubmitting(false); return;
      }
    } else {
      const isConnected = placedCoords.some(tile => 
        HEX_DIRECTIONS.some(dir => gameState.board[coordToKey(tile.q + dir.q, tile.r + dir.r)])
      );
      if (!isConnected) {
        setMessage("Must connect to existing tiles!");
        setIsSubmitting(false); return;
      }
    }
    const wordGroups = extractWords(gameState.board, tentativeMoves);
    const wordsToValidate = wordGroups.map(group => group.map(t => t.letter).join(''));
    if (wordsToValidate.length === 0) {
      setMessage("No valid words formed!");
      setIsSubmitting(false); return;
    }
    const isValid = await validateWords(wordsToValidate);
    
    // Use functional state update to ensure we have the correct previous state and avoid spread issues with nullable gameState after an async call.
    setGameState(prev => {
      if (!prev) return null;
      
      if (!isValid) {
        setMessage(`Invalid word(s): ${wordsToValidate.join(', ')}`);
        setIsSubmitting(false);
        return prev;
      }

      let turnScore = 0;
      wordGroups.forEach(group => {
        turnScore += calculateScore(group, prev.modifiers, prev.board);
      });

      const newBoard = { ...prev.board };
      Object.entries(tentativeMoves).forEach(([key, tile]) => {
        newBoard[key] = { ...tile, isTentative: false };
      });

      const newPlayers = [...prev.players];
      const playerIndex = prev.currentPlayerIndex;
      newPlayers[playerIndex].score += turnScore;
      
      const bag = [...prev.tileBag];
      const tilesNeeded = RACK_SIZE - newPlayers[playerIndex].rack.length;
      const drawn = bag.splice(0, tilesNeeded);
      newPlayers[playerIndex].rack.push(...drawn);

      const nextIdx = (playerIndex + 1) % prev.players.length;
      
      setTentativeMoves({});
      setMessage(`Great! ${turnScore} points. ${newPlayers[nextIdx].name}'s turn.`);
      setIsSubmitting(false);

      return {
        ...prev,
        board: newBoard,
        players: newPlayers,
        tileBag: bag,
        currentPlayerIndex: nextIdx,
        history: [...prev.history, `${newPlayers[playerIndex].name} played ${wordsToValidate.join(', ')} for ${turnScore} pts.`]
      };
    });
  };

  const handleShuffle = () => {
    if (!gameState) return;
    const newPlayers = [...gameState.players];
    const rack = newPlayers[gameState.currentPlayerIndex].rack;
    for (let i = rack.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rack[i], rack[j]] = [rack[j], rack[i]];
    }
    setGameState({ ...gameState, players: newPlayers });
  };

  if (appStatus === 'LOBBY') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-6 overflow-auto">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full flex flex-col gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-indigo-500 tracking-tight">HEXA-SCRABBLE</h1>
            <p className="text-slate-400 font-medium">Configure your game</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Players</label>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">2 - 4 Friends</span>
            </div>
            
            <div className="space-y-3">
              {playerInputs.map((name, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    placeholder={`Player ${idx + 1} name`}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                  {playerInputs.length > 2 && (
                    <button 
                      onClick={() => handleRemovePlayer(idx)}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-3 rounded-xl transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {playerInputs.length < 4 && (
              <button 
                onClick={handleAddPlayer}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border-2 border-dashed border-slate-700 font-bold transition-all"
              >
                + Add Player
              </button>
            )}
          </div>

          <button 
            onClick={startGame}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/20 transition-all transform active:scale-[0.98]"
          >
            START GAME
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  return (
    <div className="flex flex-col h-screen md:flex-row p-4 gap-6 bg-slate-900 text-white font-sans overflow-hidden">
      <div className="flex flex-col gap-6 md:w-80 shrink-0">
        <GameHUD 
          players={gameState.players}
          currentPlayerIndex={gameState.currentPlayerIndex}
          tileBagCount={gameState.tileBag.length}
          onPass={handlePass}
          onSubmit={handleSubmit}
          onShuffle={handleShuffle}
          canSubmit={Object.keys(tentativeMoves).length > 0 && !isSubmitting}
        />

        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 h-full overflow-hidden flex flex-col shadow-xl">
          <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Game Log</h4>
          <div className="flex-1 overflow-y-auto space-y-2 text-sm scrollbar-thin scrollbar-thumb-slate-600">
            {gameState.history.slice().reverse().map((entry, idx) => (
              <div key={idx} className="text-slate-300 border-l-2 border-indigo-500/50 pl-3 py-1">
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 items-center justify-center relative bg-slate-950/50 rounded-3xl border border-slate-800 shadow-inner overflow-hidden">
        {message && (
          <div className="absolute top-6 z-10 bg-indigo-900/90 backdrop-blur-md px-8 py-3 rounded-full border border-indigo-500 shadow-xl animate-bounce">
            <p className="font-black text-indigo-100 tracking-tight">{message}</p>
          </div>
        )}

        <div className="w-full h-full max-h-[calc(100vh-250px)] flex items-center justify-center">
          <GameBoard 
            board={gameState.board}
            modifiers={gameState.modifiers}
            tentativeMoves={tentativeMoves}
            onCellClick={handleCellClick}
          />
        </div>

        <div className="absolute bottom-6 flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{currentPlayer?.name}'s Rack</p>
          <TileRack 
            tiles={currentPlayer?.rack || []}
            selectedTileId={selectedTileId}
            onTileSelect={handleTileSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
