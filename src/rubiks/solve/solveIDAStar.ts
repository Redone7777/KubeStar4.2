import { CubeState, SolveResult } from './types';
import { getHeuristic } from './pdb';
import { SearchState } from './searchState';

let nodesExplored = 0;

/**
 * The recursive search function for the IDA* algorithm.
 * @param node The current search node.
 * @param depth The current depth in the search tree (g).
 * @param maxDepth The current depth limit for this iteration.
 * @returns The solution path if found, or the new minimum depth limit.
 */
function search(node: SearchState, depth: number, maxDepth: number): SolveResult | number {
    nodesExplored++;
    const f = depth + getHeuristic(node.state);

    if (f > maxDepth) {
        return f;
    }

    if (node.isGoal()) {
        return {
            moves: node.getMoves(),
            nodesExplored,
            timeMs: 0 // Will be calculated in the main function
        };
    }

    let min = Infinity;
    const successors = node.expand();

    for (const successor of successors) {
        const result = search(successor, depth + 1, maxDepth);
        if (typeof result !== 'number') {
            return result; // Solution found
        }
        if (result < min) {
            min = result;
        }
    }

    return min;
}

/**
 * Solves a Pocket Cube using the IDA* (Iterative Deepening A*) algorithm.
 * @param startState The initial state of the cube.
 * @returns A SolveResult object containing the solution, or null if no solution is found.
 */
export function solveIDAStar(startState: CubeState): SolveResult | null {
    const startTime = performance.now();
    nodesExplored = 0;

    const startNode = new SearchState(startState);
    let maxDepth = getHeuristic(startNode.state);

    while (true) {
        const result = search(startNode, 0, maxDepth);
        
        if (typeof result !== 'number') {
            // Success! Solution found.
            result.timeMs = performance.now() - startTime;
            result.nodesExplored = nodesExplored;
            return result;
        }
        
        if (result === Infinity) {
            // No solution found within any depth (should not happen for a valid cube)
            return null;
        }
        
        maxDepth = result; // Increase depth for the next iteration
        
        if (maxDepth > 11) { // 2x2 cube can be solved in max 11 moves
            console.error("IDA* depth exceeded maximum possible for 2x2. Aborting.");
            return null;
        }
    }
}
