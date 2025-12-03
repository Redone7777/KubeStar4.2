/**
 * Couche logique pour Rubik's Cube 2×2 (Pocket Cube)
 * 
 * SCHÉMA DE NUMÉROTATION DES 8 COINS (vue éclatée):
 * 
 *        +----+----+
 *        | 3  | 0  |   ← Face U (haut)
 *        +----+----+
 *        | 2  | 1  |
 *        +----+----+
 * +----+----+----+----+----+----+----+----+
 * | 3  | 2  | 2  | 1  | 1  | 0  | 0  | 3  |
 * +----+----+----+----+----+----+----+----+
 * | 7  | 6  | 6  | 5  | 5  | 4  | 4  | 7  |
 * +----+----+----+----+----+----+----+----+
 *   L        F        R        B
 *        +----+----+
 *        | 6  | 5  |   ← Face D (bas)
 *        +----+----+
 *        | 7  | 4  |
 *        +----+----+
 * 
 * Coins (position → faces):
 *   0 = URF (Up-Right-Front)
 *   1 = UFL (Up-Front-Left)  
 *   2 = ULB (Up-Left-Back)
 *   3 = UBR (Up-Back-Right)
 *   4 = DFR (Down-Front-Right)
 *   5 = DLF (Down-Left-Front)
 *   6 = DBL (Down-Back-Left)
 *   7 = DRB (Down-Right-Back)
 * 
 * Orientation: 0=U/D sticker sur U/D, 1=twist CW, 2=twist CCW
 */

export interface CubeLogic {
    cornerPerm: number[];  // cornerPerm[i] = quel coin (id 0-7) est à la position i
    cornerOri: number[];   // orientation 0..2 pour chaque coin à la position i
}

// Couleurs des faces: U=0, D=1, L=2, R=3, F=4, B=5
export const FACE_COLORS = ['U', 'D', 'L', 'R', 'F', 'B'] as const;
export type FaceColor = typeof FACE_COLORS[number];

// Définition des 3 stickers de chaque coin (dans l'ordre: U/D face, puis CW, puis CCW)
const CORNER_FACELETS: [FaceColor, FaceColor, FaceColor][] = [
    ['U', 'R', 'F'], // 0: URF
    ['U', 'F', 'L'], // 1: UFL
    ['U', 'L', 'B'], // 2: ULB
    ['U', 'B', 'R'], // 3: UBR
    ['D', 'F', 'R'], // 4: DFR
    ['D', 'L', 'F'], // 5: DLF
    ['D', 'B', 'L'], // 6: DBL
    ['D', 'R', 'B'], // 7: DRB
];

export function makeSolvedCube(): CubeLogic {
    return {
        cornerPerm: [0, 1, 2, 3, 4, 5, 6, 7],
        cornerOri: [0, 0, 0, 0, 0, 0, 0, 0]
    };
}

export function cloneLogic(logic: CubeLogic): CubeLogic {
    return {
        cornerPerm: [...logic.cornerPerm],
        cornerOri: [...logic.cornerOri]
    };
}

// Tables de permutation pour chaque mouvement
// Format: [positions affectées, orientation delta]
const MOVE_TABLES: Record<string, { perm: number[], oriDelta: number[] }> = {
    // U: cycle 0→3→2→1→0 (sens horaire vu du haut)
    'U':  { perm: [3, 0, 1, 2, 4, 5, 6, 7], oriDelta: [0, 0, 0, 0, 0, 0, 0, 0] },
    "U'": { perm: [1, 2, 3, 0, 4, 5, 6, 7], oriDelta: [0, 0, 0, 0, 0, 0, 0, 0] },
    
    // D: cycle 4→5→6→7→4 (sens horaire vu du bas)
    'D':  { perm: [0, 1, 2, 3, 5, 6, 7, 4], oriDelta: [0, 0, 0, 0, 0, 0, 0, 0] },
    "D'": { perm: [0, 1, 2, 3, 7, 4, 5, 6], oriDelta: [0, 0, 0, 0, 0, 0, 0, 0] },
    
    // R: cycle 0→4→7→3→0 avec twist
    'R':  { perm: [4, 1, 2, 0, 7, 5, 6, 3], oriDelta: [2, 0, 0, 1, 1, 0, 0, 2] },
    "R'": { perm: [3, 1, 2, 7, 0, 5, 6, 4], oriDelta: [2, 0, 0, 1, 1, 0, 0, 2] },
    
    // L: cycle 1→2→6→5→1 avec twist
    'L':  { perm: [0, 5, 1, 3, 4, 6, 2, 7], oriDelta: [0, 1, 2, 0, 0, 2, 1, 0] },
    "L'": { perm: [0, 2, 6, 3, 4, 1, 5, 7], oriDelta: [0, 1, 2, 0, 0, 2, 1, 0] },
    
    // F: cycle 0→1→5→4→0 avec twist
    'F':  { perm: [1, 5, 2, 3, 0, 4, 6, 7], oriDelta: [1, 2, 0, 0, 2, 1, 0, 0] },
    "F'": { perm: [4, 0, 2, 3, 5, 1, 6, 7], oriDelta: [1, 2, 0, 0, 2, 1, 0, 0] },
    
    // B: cycle 2→3→7→6→2 avec twist
    'B':  { perm: [0, 1, 3, 7, 4, 5, 2, 6], oriDelta: [0, 0, 1, 2, 0, 0, 2, 1] },
    "B'": { perm: [0, 1, 6, 2, 4, 5, 7, 3], oriDelta: [0, 0, 1, 2, 0, 0, 2, 1] }
};

// Ajouter les doubles mouvements (U2, R2, etc.)
for (const face of ['U', 'D', 'R', 'L', 'F', 'B']) {
    const single = MOVE_TABLES[face];
    const perm2 = new Array(8);
    const ori2 = new Array(8);
    for (let i = 0; i < 8; i++) {
        perm2[i] = single.perm[single.perm[i]];
        ori2[i] = (single.oriDelta[i] + single.oriDelta[single.perm[i]]) % 3;
    }
    MOVE_TABLES[face + '2'] = { perm: perm2, oriDelta: ori2 };
}

export function applyMove(logic: CubeLogic, move: string): void {
    const table = MOVE_TABLES[move];
    if (!table) {
        console.warn(`Move inconnu: ${move}`);
        return;
    }
    
    const newPerm = new Array(8);
    const newOri = new Array(8);
    
    for (let i = 0; i < 8; i++) {
        const sourcePos = table.perm[i];
        newPerm[i] = logic.cornerPerm[sourcePos];
        newOri[i] = (logic.cornerOri[sourcePos] + table.oriDelta[i]) % 3;
    }
    
    logic.cornerPerm = newPerm;
    logic.cornerOri = newOri;
}

export function applyMovesSequence(logic: CubeLogic, moves: string[]): void {
    for (const move of moves) {
        applyMove(logic, move);
    }
}

export function isSolved(logic: CubeLogic): boolean {
    for (let i = 0; i < 8; i++) {
        if (logic.cornerPerm[i] !== i || logic.cornerOri[i] !== 0) {
            return false;
        }
    }
    return true;
}

/**
 * Convertit l'état logique en tableau de couleurs de facelets
 * Retourne 24 couleurs (8 coins × 3 stickers)
 * Ordre: pour chaque coin 0-7, ses 3 stickers (U/D, CW, CCW)
 */
export function logicToFaceletArray(logic: CubeLogic): string[] {
    const result: string[] = [];
    
    for (let pos = 0; pos < 8; pos++) {
        const cubieId = logic.cornerPerm[pos];
        const orientation = logic.cornerOri[pos];
        const facelets = CORNER_FACELETS[cubieId];
        
        // Rotation des stickers selon l'orientation
        for (let s = 0; s < 3; s++) {
            const actualStickerIdx = (s + orientation) % 3;
            result.push(facelets[actualStickerIdx]);
        }
    }
    
    return result;
}

/**
 * Mapping position 3D → cubieId pour un 2×2
 * Utilisé lors de l'initialisation des stickers
 */
export function getCubieIdFromPosition(x: number, y: number, z: number): number | null {
    // Normaliser les positions (pour un 2×2, les centres sont à ±0.5)
    const normX = x > 0 ? 1 : 0;
    const normY = y > 0 ? 1 : 0;
    const normZ = z > 0 ? 1 : 0;
    
    // Mapping basé sur notre convention
    if (normY === 1) { // Couche haute
        if (normX === 1 && normZ === 1) return 0;  // URF
        if (normX === 0 && normZ === 1) return 1;  // UFL
        if (normX === 0 && normZ === 0) return 2;  // ULB
        if (normX === 1 && normZ === 0) return 3;  // UBR
    } else { // Couche basse
        if (normX === 1 && normZ === 1) return 4;  // DFR
        if (normX === 0 && normZ === 1) return 5;  // DLF
        if (normX === 0 && normZ === 0) return 6;  // DBL
        if (normX === 1 && normZ === 0) return 7;  // DRB
    }
    return null;
}

/**
 * Détermine le stickerIndex (0, 1, ou 2) basé sur la normale
 * 0 = sticker U/D, 1 = sticker dans le sens horaire, 2 = sticker anti-horaire
 */
export function getStickerIndexFromNormal(
    cubieId: number, 
    normalX: number, 
    normalY: number, 
    normalZ: number
): number {
    // Sticker index 0 = face U ou D
    if (Math.abs(normalY) > 0.5) return 0;
    
    // Pour les autres stickers, déterminer l'ordre CW/CCW selon le coin
    const isTop = cubieId < 4;
    
    // Simplification: on utilise la normale pour déterminer la face
    // puis on mappe vers 1 ou 2 selon notre convention CORNER_FACELETS
    if (normalX > 0.5) { // Face R
        // Coins sur R: 0(URF), 3(UBR), 4(DFR), 7(DRB)
        if (cubieId === 0) return 1;  // URF: R est CW
        if (cubieId === 3) return 2;  // UBR: R est CCW
        if (cubieId === 4) return 2;  // DFR: R est CCW
        if (cubieId === 7) return 1;  // DRB: R est CW
    }
    if (normalX < -0.5) { // Face L
        // Coins sur L: 1(UFL), 2(ULB), 5(DLF), 6(DBL)
        if (cubieId === 1) return 2;  // UFL: L est CCW
        if (cubieId === 2) return 1;  // ULB: L est CW
        if (cubieId === 5) return 1;  // DLF: L est CW
        if (cubieId === 6) return 2;  // DBL: L est CCW
    }
    if (normalZ > 0.5) { // Face F
        // Coins sur F: 0(URF), 1(UFL), 4(DFR), 5(DLF)
        if (cubieId === 0) return 2;  // URF: F est CCW
        if (cubieId === 1) return 1;  // UFL: F est CW
        if (cubieId === 4) return 1;  // DFR: F est CW
        if (cubieId === 5) return 2;  // DLF: F est CCW
    }
    if (normalZ < -0.5) { // Face B
        // Coins sur B: 2(ULB), 3(UBR), 6(DBL), 7(DRB)
        if (cubieId === 2) return 2;  // ULB: B est CCW
        if (cubieId === 3) return 1;  // UBR: B est CW
        if (cubieId === 6) return 1;  // DBL: B est CW
        if (cubieId === 7) return 2;  // DRB: B est CCW
    }
    
    return 0; // Fallback
}

/**
 * Convertit un nom de mouvement visuel en move logique
 * Basé sur l'axe de rotation et le sens
 */
export function axisToMove(
    axisIndex: number,  // 0=X, 1=Y, 2=Z
    layerIndex: number, // 0 ou 1 pour 2×2
    clockwise: boolean, // Vu depuis le côté positif de l'axe
    cubeOrder: number,
    turns: number
): string | null {
    if (cubeOrder !== 2) return null;
    
    let baseMove: string | null = null;

    // Pour un 2×2: layer 0 = face négative, layer 1 = face positive
    const isPositive = layerIndex === 1;
    
    if (axisIndex === 1) { // Y
        if (isPositive) {
            baseMove = clockwise ? 'U' : "U'";
        } else {
            baseMove = clockwise ? "D'" : 'D';  // D inversé car vu depuis Y+
        }
    } else if (axisIndex === 0) { // X
        if (isPositive) {
            baseMove = clockwise ? 'R' : "R'";
        } else {
            baseMove = clockwise ? "L'" : 'L';  // L inversé car vu depuis X+
        }
    } else if (axisIndex === 2) { // Z
        if (isPositive) {
            baseMove = clockwise ? 'F' : "F'";
        } else {
            baseMove = clockwise ? "B'" : 'B';  // B inversé car vu depuis Z+
        }
    }
    
    if (!baseMove) {
        return null;
    }

    if (turns === 2) {
        return baseMove[0] + '2';
    }
    
    return baseMove;
}

export { CORNER_FACELETS };
