
import React from 'react';
import { axialToPixel } from '../utils/hexUtils';
import { ModifierType } from '../types';

interface HexTileProps {
  q: number;
  r: number;
  size: number;
  letter?: string;
  value?: number;
  modifier?: ModifierType;
  isTentative?: boolean;
  isCenter?: boolean;
  onClick?: () => void;
  onDrop?: (letter: string) => void;
  isHighlighted?: boolean;
}

const HexTile: React.FC<HexTileProps> = ({
  q, r, size, letter, value, modifier, isTentative, isCenter, onClick, isHighlighted
}) => {
  const { x, y } = axialToPixel(q, r, size);
  
  // Create the hexagon points
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i + 30);
    points.push(`${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`);
  }

  const getModifierColor = () => {
    switch (modifier) {
      case ModifierType.DOUBLE_LETTER: return '#3b82f6'; // blue
      case ModifierType.TRIPLE_LETTER: return '#1d4ed8'; // darker blue
      case ModifierType.DOUBLE_WORD: return '#f43f5e'; // rose
      case ModifierType.TRIPLE_WORD: return '#be123c'; // darker rose
      default: return isCenter ? '#475569' : '#1e293b';
    }
  };

  const getModifierLabel = () => {
    switch (modifier) {
      case ModifierType.DOUBLE_LETTER: return '2L';
      case ModifierType.TRIPLE_LETTER: return '3L';
      case ModifierType.DOUBLE_WORD: return '2W';
      case ModifierType.TRIPLE_WORD: return '3W';
      default: return isCenter ? '★' : '';
    }
  };

  return (
    <g 
      className={`cursor-pointer transition-all duration-200 ${isHighlighted ? 'scale-110' : ''}`}
      onClick={onClick}
    >
      <polygon
        points={points.join(' ')}
        fill={letter ? (isTentative ? '#86efac' : '#fef3c7') : getModifierColor()}
        stroke={isHighlighted ? '#fde047' : '#334155'}
        strokeWidth={isHighlighted ? 3 : 1}
        className="transition-colors"
      />
      
      {!letter && getModifierLabel() && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.4}
          fontWeight="bold"
          className="select-none pointer-events-none opacity-50"
        >
          {getModifierLabel()}
        </text>
      )}

      {letter && (
        <>
          <text
            x={x}
            y={y + (size * 0.1)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#1e293b"
            fontSize={size * 0.8}
            fontWeight="bold"
            className="select-none pointer-events-none"
          >
            {letter}
          </text>
          <text
            x={x + (size * 0.4)}
            y={y + (size * 0.45)}
            textAnchor="end"
            dominantBaseline="baseline"
            fill="#475569"
            fontSize={size * 0.25}
            className="select-none pointer-events-none"
          >
            {value}
          </text>
        </>
      )}
    </g>
  );
};

export default HexTile;
