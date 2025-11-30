export interface CubeState {
    cp: number[];  // corner permutation [0-7]
    co: number[];  // corner orientation [0-2]
}

export type Move = 'U' | "U'" | 'U2' | 'D' | "D'" | 'D2' | 
                   'R' | "R'" | 'R2' | 'L' | "L'" | 'L2' | 
                   'F' | "F'" | 'F2' | 'B' | "B'" | 'B2';

export interface SolveResult {
    moves: Move[];
    nodesExplored: number;
    timeMs: number;
}

export function createSolved(): CubeState {
    return {
        cp: [0, 1, 2, 3, 4, 5, 6, 7],
        co: [0, 0, 0, 0, 0, 0, 0, 0]
    };
}

export function clone(state: CubeState): CubeState {
    return { cp: [...state.cp], co: [...state.co] };
}

export function isSolved(state: CubeState): boolean {
    for (let i = 0; i < 8; i++) {
        if (state.cp[i] !== i || state.co[i] !== 0) return false;
    }
    return true;
}

export function equals(a: CubeState, b: CubeState): boolean {
    for (let i = 0; i < 8; i++) {
        if (a.cp[i] !== b.cp[i] || a.co[i] !== b.co[i]) return false;
    }
    return true;
}
