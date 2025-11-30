import { CubeState, Move } from './types';

interface MoveTable {
    perm: number[];
    orient: number[];
}

const MOVES: Record<Move, MoveTable> = {
    'U':  { perm: [3, 0, 1, 2, 4, 5, 6, 7], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    "U'": { perm: [1, 2, 3, 0, 4, 5, 6, 7], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    'U2': { perm: [2, 3, 0, 1, 4, 5, 6, 7], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    
    'D':  { perm: [0, 1, 2, 3, 5, 6, 7, 4], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    "D'": { perm: [0, 1, 2, 3, 7, 4, 5, 6], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    'D2': { perm: [0, 1, 2, 3, 6, 7, 4, 5], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    
    'R':  { perm: [4, 1, 2, 0, 7, 5, 6, 3], orient: [2, 0, 0, 1, 1, 0, 0, 2] },
    "R'": { perm: [3, 1, 2, 7, 0, 5, 6, 4], orient: [2, 0, 0, 1, 1, 0, 0, 2] },
    'R2': { perm: [7, 1, 2, 4, 3, 5, 6, 0], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    
    'L':  { perm: [0, 5, 1, 3, 4, 6, 2, 7], orient: [0, 1, 2, 0, 0, 2, 1, 0] },
    "L'": { perm: [0, 2, 6, 3, 4, 1, 5, 7], orient: [0, 1, 2, 0, 0, 2, 1, 0] },
    'L2': { perm: [0, 6, 5, 3, 4, 2, 1, 7], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    
    'F':  { perm: [1, 5, 2, 3, 0, 4, 6, 7], orient: [1, 2, 0, 0, 2, 1, 0, 0] },
    "F'": { perm: [4, 0, 2, 3, 5, 1, 6, 7], orient: [1, 2, 0, 0, 2, 1, 0, 0] },
    'F2': { perm: [5, 4, 2, 3, 1, 0, 6, 7], orient: [0, 0, 0, 0, 0, 0, 0, 0] },
    
    'B':  { perm: [0, 1, 3, 7, 4, 5, 2, 6], orient: [0, 0, 1, 2, 0, 0, 2, 1] },
    "B'": { perm: [0, 1, 6, 2, 4, 5, 7, 3], orient: [0, 0, 1, 2, 0, 0, 2, 1] },
    'B2': { perm: [0, 1, 7, 6, 4, 5, 3, 2], orient: [0, 0, 0, 0, 0, 0, 0, 0] }
};

export const ALL_MOVES: Move[] = Object.keys(MOVES) as Move[];

export function applyMove(state: CubeState, move: Move): CubeState {
    const table = MOVES[move];
    const newCp: number[] = [];
    const newCo: number[] = [];
    
    for (let i = 0; i < 8; i++) {
        const src = table.perm[i];
        newCp[i] = state.cp[src];
        newCo[i] = (state.co[src] + table.orient[i]) % 3;
    }
    
    return { cp: newCp, co: newCo };
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
    let result = state;
    for (const m of moves) {
        result = applyMove(result, m);
    }
    return result;
}

export function getFace(move: Move): string {
    return move[0];
}

export function canFollow(last: Move | null, next: Move): boolean {
    if (!last) return true;
    const lastFace = getFace(last);
    const nextFace = getFace(next);
    
    if (lastFace === nextFace) return false;
    
    const opposites: Record<string, string> = { U:'D', D:'U', R:'L', L:'R', F:'B', B:'F' };
    if (opposites[lastFace] === nextFace && lastFace > nextFace) return false;
    
    return true;
}

export function getValidMoves(lastMove: Move | null): Move[] {
    return ALL_MOVES.filter(m => canFollow(lastMove, m));
}

export function invertMove(move: Move): Move {
    if (move.endsWith('2')) return move;
    if (move.endsWith("'")) return move[0] as Move;
    return (move + "'") as Move;
}

export function invertSequence(moves: Move[]): Move[] {
    return moves.map(invertMove).reverse();
}

export function movesToString(moves: Move[]): string {
    return moves.join(' ');
}

export function parseScramble(str: string): Move[] {
    return str.trim().split(/\s+/).filter(s => s) as Move[];
}

export function randomScramble(length: number): Move[] {
    const moves: Move[] = [];
    let lastMove: Move | null = null;
    
    for (let i = 0; i < length; i++) {
        const valid = getValidMoves(lastMove);
        const move = valid[Math.floor(Math.random() * valid.length)];
        moves.push(move);
        lastMove = move;
    }
    
    return moves;
}
