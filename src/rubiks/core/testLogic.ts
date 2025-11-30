/**
 * Tests pour la couche logique du Rubik's Cube 2×2
 * 
 * Pour exécuter: importer et appeler selfTest() depuis la console
 * ou ajouter à index.ts: import { selfTest } from './rubiks/core/testLogic'; selfTest();
 */

import {
    CubeLogic,
    makeSolvedCube,
    applyMove,
    applyMovesSequence,
    cloneLogic,
    isSolved,
    logicToFaceletArray
} from './cubeLogic';

function arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

function logState(name: string, logic: CubeLogic) {
    console.log(`${name}:`);
    console.log(`  perm: [${logic.cornerPerm.join(', ')}]`);
    console.log(`  ori:  [${logic.cornerOri.join(', ')}]`);
}

export function selfTest(): boolean {
    console.log('=== Tests de la couche logique 2×2 ===\n');
    let allPassed = true;

    // Test 1: État résolu
    console.log('Test 1: makeSolvedCube()');
    const solved = makeSolvedCube();
    const test1 = isSolved(solved);
    console.log(`  isSolved = ${test1} (attendu: true)`);
    if (!test1) allPassed = false;

    // Test 2: R suivi de R' revient à l'état initial
    console.log('\nTest 2: R puis R\' = identité');
    const cube2 = makeSolvedCube();
    applyMove(cube2, 'R');
    logState('  Après R', cube2);
    applyMove(cube2, "R'");
    logState('  Après R\'', cube2);
    const test2 = isSolved(cube2);
    console.log(`  isSolved = ${test2} (attendu: true)`);
    if (!test2) allPassed = false;

    // Test 3: Sexy move (R U R' U') × 6 = identité
    console.log('\nTest 3: (R U R\' U\') × 6 = identité');
    const cube3 = makeSolvedCube();
    for (let i = 0; i < 6; i++) {
        applyMovesSequence(cube3, ['R', 'U', "R'", "U'"]);
    }
    const test3 = isSolved(cube3);
    console.log(`  isSolved = ${test3} (attendu: true)`);
    if (!test3) allPassed = false;

    // Test 4: Vérification de la permutation après R
    console.log('\nTest 4: Permutation après R');
    const cube4 = makeSolvedCube();
    applyMove(cube4, 'R');
    // R: 0→3, 3→7, 7→4, 4→0 (les autres restent)
    const expectedPerm4 = [4, 1, 2, 0, 7, 5, 6, 3];
    const test4 = arraysEqual(cube4.cornerPerm, expectedPerm4);
    console.log(`  perm = [${cube4.cornerPerm.join(', ')}]`);
    console.log(`  attendu = [${expectedPerm4.join(', ')}]`);
    console.log(`  OK = ${test4}`);
    if (!test4) allPassed = false;

    // Test 5: U4 = identité (rotation complète)
    console.log('\nTest 5: U4 = identité');
    const cube5 = makeSolvedCube();
    applyMovesSequence(cube5, ['U', 'U', 'U', 'U']);
    const test5 = isSolved(cube5);
    console.log(`  isSolved = ${test5} (attendu: true)`);
    if (!test5) allPassed = false;

    // Test 6: Clone indépendant
    console.log('\nTest 6: Clone indépendant');
    const cube6a = makeSolvedCube();
    const cube6b = cloneLogic(cube6a);
    applyMove(cube6a, 'R');
    const test6 = isSolved(cube6b) && !isSolved(cube6a);
    console.log(`  original modifié, clone intact = ${test6} (attendu: true)`);
    if (!test6) allPassed = false;

    // Test 7: logicToFaceletArray sur cube résolu
    console.log('\nTest 7: logicToFaceletArray sur cube résolu');
    const cube7 = makeSolvedCube();
    const facelets = logicToFaceletArray(cube7);
    console.log(`  facelets (24): ${facelets.join('')}`);
    // Vérifie que chaque coin a bien 3 stickers et que le premier est U ou D
    const test7 = facelets.length === 24 && 
        facelets.filter((f, i) => i % 3 === 0).every(f => f === 'U' || f === 'D');
    console.log(`  Longueur=24 et premiers stickers U/D = ${test7} (attendu: true)`);
    if (!test7) allPassed = false;

    // Test 8: Vérifier F2 (double mouvement)
    console.log('\nTest 8: F2 puis F2 = identité');
    const cube8 = makeSolvedCube();
    applyMove(cube8, 'F2');
    logState('  Après F2', cube8);
    applyMove(cube8, 'F2');
    const test8 = isSolved(cube8);
    console.log(`  isSolved = ${test8} (attendu: true)`);
    if (!test8) allPassed = false;

    // Résumé
    console.log('\n=== Résumé ===');
    if (allPassed) {
        console.log('✅ Tous les tests passent!');
    } else {
        console.log('❌ Certains tests ont échoué');
    }

    return allPassed;
}

// Export pour utilisation dans l'index
export default selfTest;
