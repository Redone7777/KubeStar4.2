import { CubeState, Move, isSolved } from './types';
import { applyMove, getValidMoves } from './moves';

/**
 * Represents a node in the IDA* search tree.
 */
export class SearchState {
    public readonly state: CubeState;
    public readonly moves: Move[];
    public readonly lastMove: Move | null;

    constructor(state: CubeState, moves: Move[] = [], lastMove: Move | null = null) {
        this.state = state;
        this.moves = moves;
        this.lastMove = lastMove;
    }

    /**
     * Checks if the current state is the goal (solved) state.
     */
    isGoal(): boolean {
        return isSolved(this.state);
    }

    /**
     * Generates all valid successor states from the current state.
     */
    expand(): SearchState[] {
        const successors: SearchState[] = [];
        const validMoves = getValidMoves(this.lastMove);

        for (const move of validMoves) {
            const newState = applyMove(this.state, move);
            const newMoves = [...this.moves, move];
            successors.push(new SearchState(newState, newMoves, move));
        }

        return successors;
    }
    
    /**
     * Returns the sequence of moves to reach this state.
     */
    getMoves(): Move[] {
        return this.moves;
    }
}
