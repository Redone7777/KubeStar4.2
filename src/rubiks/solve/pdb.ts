import { CubeState, createSolved } from './types';
import { applyMove, ALL_MOVES } from './moves';

// Configuration : 'MEMORY' (Table complète combinée, ~88Mo RAM) ou 'CODE' (Tables disjointes, légères)
const METHOD: 'MEMORY' | 'CODE' = 'MEMORY';

const ORIENTATION_SIZE = 2187; // 3^7
const PERMUTATION_SIZE = 40320; // 8!
const FULL_SIZE = PERMUTATION_SIZE * ORIENTATION_SIZE; 
const FACTORIALS = [1, 1, 2, 6, 24, 120, 720, 5040];

let orientationPDB: Int8Array | null = null;
let permutationPDB: Int8Array | null = null;
let combinedPDB: Int8Array | null = null;

function getOrientationIndex(state: CubeState): number {
    let index = 0;
    for (let i = 0; i < 7; i++) {
        index = index * 3 + state.co[i];
    }
    return index;
}

function getPermutationIndex(state: CubeState): number {
    let index = 0;
    const cp = state.cp; 
    for (let i = 0; i < 7; i++) {
        let count = 0;
        for (let j = i + 1; j < 8; j++) {
            if (cp[j] < cp[i]) count++;
        }
        index += count * FACTORIALS[7 - i];
    }
    return index;
}

function getCombinedIndex(state: CubeState): number {
    return getPermutationIndex(state) * ORIENTATION_SIZE + getOrientationIndex(state);
}

// Génération des tables disjointes (Mode CODE)
function generateDisjointPDBs() {
    console.log("Génération PDB (Mode Disjoint)...");
    
    // 1. Orientation
    orientationPDB = new Int8Array(ORIENTATION_SIZE).fill(-1);
    let queue: { state: CubeState; depth: number }[] = [];
    let solved = createSolved();
    
    orientationPDB[getOrientationIndex(solved)] = 0;
    queue.push({ state: solved, depth: 0 });
    
    let head = 0;
    while(head < queue.length) {
        const { state, depth } = queue[head++];
        if (depth >= 11) continue;

        for (const move of ALL_MOVES) {
            const ns = applyMove(state, move);
            const idx = getOrientationIndex(ns);
            if (orientationPDB[idx] === -1) {
                orientationPDB[idx] = depth + 1;
                queue.push({ state: ns, depth: depth + 1 });
            }
        }
    }

    // 2. Permutation
    permutationPDB = new Int8Array(PERMUTATION_SIZE).fill(-1);
    queue = [];
    permutationPDB[getPermutationIndex(solved)] = 0;
    queue.push({ state: solved, depth: 0 });
    
    head = 0;
    let filled = 1;
    while(head < queue.length) {
        const { state, depth } = queue[head++];
        if (filled >= PERMUTATION_SIZE) break;

        for (const move of ALL_MOVES) {
            const ns = applyMove(state, move);
            const idx = getPermutationIndex(ns);
            if (permutationPDB[idx] === -1) {
                permutationPDB[idx] = depth + 1;
                filled++;
                queue.push({ state: ns, depth: depth + 1 });
            }
        }
    }
}

// Génération de la table complète (Mode MEMORY)
function generateCombinedPDB() {
    console.log("Génération PDB (Mode Complet)...");
    
    try {
        combinedPDB = new Int8Array(FULL_SIZE).fill(-1);
    } catch (e) {
        console.warn("Mémoire insuffisante, fallback sur mode Disjoint.");
        generateDisjointPDBs();
        return;
    }

    const queue: { state: CubeState; depth: number }[] = [];
    const solved = createSolved();
    
    combinedPDB[getCombinedIndex(solved)] = 0;
    queue.push({ state: solved, depth: 0 });

    let head = 0;
    while(head < queue.length) {
        const { state, depth } = queue[head++];
        if (depth >= 11) continue;

        for (const move of ALL_MOVES) {
            const newState = applyMove(state, move);
            const newIndex = getCombinedIndex(newState);

            if (combinedPDB[newIndex] === -1) {
                combinedPDB[newIndex] = depth + 1;
                queue.push({ state: newState, depth: depth + 1 });
            }
        }
    }
}

export function getHeuristic(state: CubeState): number {
    if (METHOD === 'MEMORY') {
        if (!combinedPDB) {
            if (!orientationPDB) generateCombinedPDB();
            // Fallback si échec mémoire
            if (!combinedPDB && orientationPDB) {
                return Math.max(
                    orientationPDB![getOrientationIndex(state)], 
                    permutationPDB![getPermutationIndex(state)]
                );
            }
        }
        
        const val = combinedPDB![getCombinedIndex(state)];
        return val === -1 ? 11 : val;

    } else {
        if (!orientationPDB || !permutationPDB) {
            generateDisjointPDBs();
        }
        return Math.max(
            orientationPDB![getOrientationIndex(state)], 
            permutationPDB![getPermutationIndex(state)]
        );
    }
}