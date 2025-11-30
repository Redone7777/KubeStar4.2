import { CubeState, Move, SolveResult, createSolved, clone, isSolved } from './types';
import { applyMove, applyMoves, movesToString, parseScramble, randomScramble } from './moves';

export type { CubeState, Move, SolveResult };
export { createSolved, clone, isSolved };
export { applyMove, applyMoves, movesToString, parseScramble, randomScramble };

export function scramble(moves: string | Move[]): CubeState {
    const state = createSolved();
    const moveList = typeof moves === 'string' ? parseScramble(moves) : moves;
    return applyMoves(state, moveList);
}

export function solve(state: CubeState, debug = false): SolveResult | null {
    console.log ("[Solve] Fonction solve non implémentée");

    return null;
}

export function solveScramble(moves: string | Move[], debug = false): SolveResult | null {
        console.log ("[Solve] Fonction solve non implémentée");

    return null;
}

export function verify(initial: CubeState, solution: Move[]): boolean {
    const result = applyMoves(initial, solution);
    return isSolved(result);
}

export const solver = {
    createSolved,
    scramble,
    randomScramble,
    solve,
    solveScramble,
    verify,
    applyMove,
    applyMoves,
    movesToString,
    parseScramble,
    isSolved
};

export default solver;
