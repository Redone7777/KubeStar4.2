import { CubeState, Move, SolveResult, isSolved } from './types';
import { applyMove, getValidMoves } from './moves';

/**
 * Convertit un état du cube en une chaîne unique pour le stockage dans un ensemble (Set).
 * C'est essentiel pour suivre efficacement les états visités.
 * @param state L'état du cube.
 * @returns Une chaîne de caractères représentant l'état.
 */
function serializeState(state: CubeState): string {
    return state.cp.join('') + state.co.join('');
}

interface QueueItem {
    state: CubeState;
    moves: Move[];
    lastMove: Move | null;
}

/**
 * Résout un Pocket Cube en utilisant l'algorithme de recherche en largeur (BFS).
 * @param startState L'état de départ du cube à résoudre.
 * @returns Un objet SolveResult contenant la solution, ou null si aucune solution n'est trouvée.
 */
export function solveBFS(startState: CubeState): SolveResult | null {
    const startTime = performance.now();
    let nodesExplored = 0;

    const queue: QueueItem[] = [];
    const visited = new Set<string>();

    // 1. Vérifier si le cube est déjà résolu
    if (isSolved(startState)) {
        return { moves: [], nodesExplored: 1, timeMs: performance.now() - startTime };
    }

    // 2. Initialiser la file d'attente et l'ensemble des états visités
    const startKey = serializeState(startState);
    queue.push({ state: startState, moves: [], lastMove: null });
    visited.add(startKey);
    nodesExplored++;

    // 3. Boucle principale de l'algorithme BFS
    while (queue.length > 0) {
        // '!' est utilisé car on sait que la file n'est pas vide à ce stade.
        const { state, moves, lastMove } = queue.shift()!; 

        // 4. Obtenir les mouvements valides suivants en utilisant la contrainte de "pruning"
        const validMoves = getValidMoves(lastMove);

        for (const move of validMoves) {
            const newState = applyMove(state, move);
            nodesExplored++;

            // 5. Vérifier si le nouvel état est la solution
            if (isSolved(newState)) {
                const finalMoves = [...moves, move];
                return {
                    moves: finalMoves,
                    nodesExplored,
                    timeMs: performance.now() - startTime,
                };
            }

            // 6. Ajouter le nouvel état à la file d'attente s'il n'a pas été visité
            const newStateKey = serializeState(newState);
            if (!visited.has(newStateKey)) {
                visited.add(newStateKey);
                const newMoves = [...moves, move];
                queue.push({ state: newState, moves: newMoves, lastMove: move });
            }
        }
    }

    // 7. Retourner null si aucune solution n'est trouvée (ne devrait pas arriver pour un cube valide)
    return null;
}
