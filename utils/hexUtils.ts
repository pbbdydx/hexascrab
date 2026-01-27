
import { HexCoord } from '../types';

export const coordToKey = (q: number, r: number) => `${q},${r}`;
export const keyToCoord = (key: string): HexCoord => {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
};

export const getHexDistance = (a: HexCoord, b: HexCoord) => {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - (b.q + b.r)) + Math.abs(a.r - b.r)) / 2;
};

// Check if three hexes are in a line
export const areInLine = (coords: HexCoord[]) => {
  if (coords.length <= 1) return true;
  const first = coords[0];
  const second = coords[1];
  
  // Directions of line
  const dq = second.q - first.q;
  const dr = second.r - first.r;
  const ds = ( -second.q - second.r ) - ( -first.q - first.r );

  for (let i = 2; i < coords.length; i++) {
    const curr = coords[i];
    const cdq = curr.q - first.q;
    const cdr = curr.r - first.r;
    const cds = ( -curr.q - curr.r ) - ( -first.q - first.r );

    // A line in hex grid must maintain at least one constant axial ratio or zero diff
    // More simply: they share a q, r, or s coordinate
    const shareQ = coords.every(c => c.q === first.q);
    const shareR = coords.every(c => c.r === first.r);
    const shareS = coords.every(c => (-c.q - c.r) === (-first.q - first.r));
    
    if (!(shareQ || shareR || shareS)) return false;
  }
  return true;
};

export const axialToPixel = (q: number, r: number, size: number) => {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * (3 / 2) * r;
  return { x, y };
};
