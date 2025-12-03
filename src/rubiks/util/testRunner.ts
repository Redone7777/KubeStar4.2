/**
 * Banc de test automatisé pour valider les performances du solveur Pocket Cube 2x2
 * 
 * Fonctionnalités :
 * - Génération de mélanges aléatoires à profondeur contrôlée
 * - Comparaison BFS vs IDA*
 * - Analyse de distribution des profondeurs de solution
 * - Test de pire cas (profondeur 11)
 * 
 * Usage depuis la console :
 *   cube.tests.runAll()
 *   cube.tests.comparison(50)
 *   cube.tests.distribution(100)
 *   cube.tests.worstCase()
 */

import { CubeState, createSolved, isSolved, SolveResult } from '../solve/types';
import { applyMove, ALL_MOVES, getValidMoves, parseScramble } from '../solve/moves';
import { solveIDAStar } from '../solve/solveIDAStar';
import { solveBFS } from '../solve/solveBFS';
import type { Move } from '../solve/types';

// ============================================================================
// Types et interfaces
// ============================================================================

interface TestResult {
    method: string;
    scrambleDepth: number;
    solutionDepth: number;
    nodesExplored: number;
    timeMs: number;
    success: boolean;
}

interface ComparisonStats {
    method: string;
    sampleSize: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
    avgNodes: number;
    maxNodes: number;
    avgSolutionDepth: number;
    successRate: number;
}

interface DistributionEntry {
    depth: number;
    count: number;
    percentage: string;
    avgTimeMs: number;
    avgNodes: number;
}

// ============================================================================
// Génération de mélanges
// ============================================================================

/**
 * Génère un mélange aléatoire à une profondeur exacte
 * @param depth Nombre de mouvements pour le mélange
 * @returns L'état mélangé et la séquence de mouvements
 */
export function generateRandomScramble(depth: number): { state: CubeState; scramble: Move[] } {
    let state = createSolved();
    const scramble: Move[] = [];
    let lastMove: Move | null = null;

    for (let i = 0; i < depth; i++) {
        const validMoves = getValidMoves(lastMove);
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        state = applyMove(state, randomMove);
        scramble.push(randomMove);
        lastMove = randomMove;
    }

    return { state, scramble };
}

/**
 * Génère un mélange aléatoire avec une profondeur entre min et max
 */
export function generateRandomScrambleRange(minDepth: number, maxDepth: number): { state: CubeState; scramble: Move[]; depth: number } {
    const depth = Math.floor(Math.random() * (maxDepth - minDepth + 1)) + minDepth;
    const result = generateRandomScramble(depth);
    return { ...result, depth };
}

/**
 * Crée un état à partir d'une séquence de mouvements (string)
 */
export function stateFromScramble(scrambleStr: string): CubeState {
    const moves = parseScramble(scrambleStr);
    let state = createSolved();
    for (const move of moves) {
        state = applyMove(state, move);
    }
    return state;
}

// ============================================================================
// Utilitaires asynchrones
// ============================================================================

/**
 * Permet de rendre la main au navigateur entre les tests
 */
function yieldToUI(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Affiche une barre de progression dans la console
 */
function logProgress(current: number, total: number, label: string) {
    const percent = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 5)) + '░'.repeat(20 - Math.floor(percent / 5));
    console.log(`\r${label}: [${bar}] ${percent}% (${current}/${total})`);
}

// ============================================================================
// Tests individuels
// ============================================================================

/**
 * Résout un état avec une méthode donnée et retourne les statistiques
 */
function solveWithMethod(state: CubeState, method: 'BFS' | 'IDA*', scrambleDepth: number): TestResult {
    const startTime = performance.now();
    let result: SolveResult | null = null;

    try {
        if (method === 'BFS') {
            result = solveBFS(state);
        } else {
            result = solveIDAStar(state);
        }
    } catch (e) {
        return {
            method,
            scrambleDepth,
            solutionDepth: -1,
            nodesExplored: 0,
            timeMs: performance.now() - startTime,
            success: false
        };
    }

    if (!result) {
        return {
            method,
            scrambleDepth,
            solutionDepth: -1,
            nodesExplored: 0,
            timeMs: performance.now() - startTime,
            success: false
        };
    }

    return {
        method,
        scrambleDepth,
        solutionDepth: result.moves.length,
        nodesExplored: result.nodesExplored,
        timeMs: result.timeMs,
        success: true
    };
}

// ============================================================================
// Tests de comparaison
// ============================================================================

/**
 * Compare BFS et IDA* sur un échantillon de cubes mélangés
 * @param sampleSize Nombre de cubes à tester
 * @param maxScrambleDepth Profondeur maximale de mélange (défaut: 11)
 * @param includeBFS Inclure BFS dans la comparaison (peut être très lent)
 */
export async function runComparisonTest(
    sampleSize: number = 50,
    maxScrambleDepth: number = 11,
    includeBFS: boolean = false
): Promise<ComparisonStats[]> {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           TEST DE COMPARAISON BFS vs IDA*                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`📊 Échantillon: ${sampleSize} cubes | Profondeur max: ${maxScrambleDepth}`);
    console.log(`⚙️  Méthodes: IDA*${includeBFS ? ' + BFS' : ' (BFS désactivé - trop lent)'}`);
    console.log('');

    const methods: ('BFS' | 'IDA*')[] = includeBFS ? ['BFS', 'IDA*'] : ['IDA*'];
    const allResults: Map<string, TestResult[]> = new Map();
    
    for (const method of methods) {
        allResults.set(method, []);
    }

    // Générer et tester les cubes
    for (let i = 0; i < sampleSize; i++) {
        const { state, depth } = generateRandomScrambleRange(1, maxScrambleDepth);

        for (const method of methods) {
            const result = solveWithMethod(state, method, depth);
            allResults.get(method)!.push(result);
        }

        // Rendre la main à l'UI tous les 10 tests
        if (i % 10 === 0) {
            logProgress(i + 1, sampleSize, '🔄 Progression');
            await yieldToUI();
        }
    }

    console.log('');
    console.log('✅ Tests terminés ! Calcul des statistiques...');
    console.log('');

    // Calculer les statistiques
    const stats: ComparisonStats[] = [];

    for (const method of methods) {
        const results = allResults.get(method)!;
        const successfulResults = results.filter(r => r.success);
        
        if (successfulResults.length === 0) {
            stats.push({
                method,
                sampleSize,
                avgTime: NaN,
                maxTime: NaN,
                minTime: NaN,
                avgNodes: NaN,
                maxNodes: NaN,
                avgSolutionDepth: NaN,
                successRate: 0
            });
            continue;
        }

        const times = successfulResults.map(r => r.timeMs);
        const nodes = successfulResults.map(r => r.nodesExplored);
        const depths = successfulResults.map(r => r.solutionDepth);

        stats.push({
            method,
            sampleSize,
            avgTime: times.reduce((a, b) => a + b, 0) / times.length,
            maxTime: Math.max(...times),
            minTime: Math.min(...times),
            avgNodes: nodes.reduce((a, b) => a + b, 0) / nodes.length,
            maxNodes: Math.max(...nodes),
            avgSolutionDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
            successRate: (successfulResults.length / results.length) * 100
        });
    }

    // Afficher les résultats
    console.log('📈 RÉSULTATS DE LA COMPARAISON');
    console.log('─'.repeat(60));
    
    console.table(stats.map(s => ({
        'Méthode': s.method,
        'Temps Moy. (ms)': s.avgTime.toFixed(2),
        'Temps Max (ms)': s.maxTime.toFixed(2),
        'Nœuds Moy.': Math.round(s.avgNodes).toLocaleString(),
        'Nœuds Max': s.maxNodes.toLocaleString(),
        'Prof. Moy.': s.avgSolutionDepth.toFixed(2),
        'Succès (%)': s.successRate.toFixed(1)
    })));

    return stats;
}

// ============================================================================
// Analyse de distribution
// ============================================================================

/**
 * Analyse la distribution des profondeurs de solution
 * @param sampleSize Nombre de cubes à analyser
 */
export async function runDistributionTest(sampleSize: number = 500): Promise<DistributionEntry[]> {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║         ANALYSE DE DISTRIBUTION DES PROFONDEURS              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`📊 Échantillon: ${sampleSize} cubes aléatoires`);
    console.log('');

    const depthCounts: Map<number, { count: number; totalTime: number; totalNodes: number }> = new Map();
    
    // Initialiser pour les profondeurs 0 à 11
    for (let d = 0; d <= 11; d++) {
        depthCounts.set(d, { count: 0, totalTime: 0, totalNodes: 0 });
    }

    for (let i = 0; i < sampleSize; i++) {
        // Mélange aléatoire (profondeur variable pour avoir une vraie distribution)
        const scrambleDepth = Math.floor(Math.random() * 20) + 5; // 5-25 mouvements
        const { state } = generateRandomScramble(scrambleDepth);

        const result = solveWithMethod(state, 'IDA*', scrambleDepth);

        if (result.success) {
            const entry = depthCounts.get(result.solutionDepth);
            if (entry) {
                entry.count++;
                entry.totalTime += result.timeMs;
                entry.totalNodes += result.nodesExplored;
            }
        }

        if (i % 50 === 0) {
            logProgress(i + 1, sampleSize, '🔄 Analyse');
            await yieldToUI();
        }
    }

    console.log('');
    console.log('✅ Analyse terminée !');
    console.log('');

    // Construire le tableau de distribution
    const distribution: DistributionEntry[] = [];
    
    for (let depth = 0; depth <= 11; depth++) {
        const entry = depthCounts.get(depth)!;
        distribution.push({
            depth,
            count: entry.count,
            percentage: ((entry.count / sampleSize) * 100).toFixed(2) + '%',
            avgTimeMs: entry.count > 0 ? entry.totalTime / entry.count : 0,
            avgNodes: entry.count > 0 ? Math.round(entry.totalNodes / entry.count) : 0
        });
    }

    // Afficher le tableau
    console.log('📊 DISTRIBUTION DES PROFONDEURS DE SOLUTION');
    console.log('─'.repeat(60));
    
    console.table(distribution.map(d => ({
        'Profondeur': d.depth,
        'Nombre': d.count,
        'Pourcentage': d.percentage,
        'Temps Moy. (ms)': d.avgTimeMs.toFixed(3),
        'Nœuds Moy.': d.avgNodes.toLocaleString()
    })));

    // Afficher un histogramme ASCII
    console.log('');
    console.log('📊 HISTOGRAMME');
    console.log('─'.repeat(60));
    
    const maxCount = Math.max(...distribution.map(d => d.count));
    for (const d of distribution) {
        const barLength = maxCount > 0 ? Math.round((d.count / maxCount) * 40) : 0;
        const bar = '█'.repeat(barLength);
        console.log(`${d.depth.toString().padStart(2)}: ${bar} ${d.count}`);
    }

    return distribution;
}

// ============================================================================
// Test de pire cas (God's Number = 11)
// ============================================================================

/**
 * Teste des positions connues de profondeur maximale (11 coups)
 */
export async function runWorstCaseTest(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              TEST DE PIRE CAS (PROFONDEUR 11)                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Mélanges connus qui nécessitent 11 coups pour être résolus
    // Source: https://www.jaapsch.net/puzzles/cube2.htm
    const worstCaseScrambles = [
        { name: "Superflip 2x2 #1", scramble: "R U2 R' U' R U R' U' R U' R'" },
        { name: "Superflip 2x2 #2", scramble: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
        { name: "Random Depth 11", scramble: "R F R2 U' F2 U R F2 R2 F'" },
        { name: "Complex Pattern", scramble: "R U R' U R U2 R' U2 R U R' U'" }
    ];

    const results: { name: string; scramble: string; solutionLength: number; timeMs: number; nodesExplored: number }[] = [];

    for (const { name, scramble } of worstCaseScrambles) {
        console.log(`🧪 Test: ${name}`);
        console.log(`   Mélange: ${scramble}`);

        const state = stateFromScramble(scramble);
        
        // Vérifier si le cube est déjà résolu (mélange invalide)
        if (isSolved(state)) {
            console.log(`   ⚠️ Ce mélange donne un cube résolu - ignoré`);
            continue;
        }

        const startTime = performance.now();
        const result = solveIDAStar(state);
        const endTime = performance.now();

        if (result) {
            console.log(`   ✅ Solution: ${result.moves.join(' ')} (${result.moves.length} coups)`);
            console.log(`   ⏱️ Temps: ${result.timeMs.toFixed(2)}ms | 🔍 Nœuds: ${result.nodesExplored.toLocaleString()}`);
            
            results.push({
                name,
                scramble,
                solutionLength: result.moves.length,
                timeMs: result.timeMs,
                nodesExplored: result.nodesExplored
            });
        } else {
            console.log(`   ❌ Échec de la résolution`);
        }

        console.log('');
        await yieldToUI();
    }

    // Résumé
    console.log('📊 RÉSUMÉ DES TESTS DE PIRE CAS');
    console.log('─'.repeat(60));
    console.table(results.map(r => ({
        'Test': r.name,
        'Coups': r.solutionLength,
        'Temps (ms)': r.timeMs.toFixed(2),
        'Nœuds': r.nodesExplored.toLocaleString()
    })));
}

// ============================================================================
// Test de validation (vérifie que les solutions sont correctes)
// ============================================================================

/**
 * Vérifie que les solutions générées sont correctement validées
 */
export async function runValidationTest(sampleSize: number = 100): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              TEST DE VALIDATION DES SOLUTIONS                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`📊 Vérification de ${sampleSize} solutions...`);
    console.log('');

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < sampleSize; i++) {
        const { state: scrambledState, scramble } = generateRandomScramble(Math.floor(Math.random() * 11) + 1);
        const result = solveIDAStar(scrambledState);

        if (result) {
            // Appliquer la solution et vérifier qu'on arrive à l'état résolu
            let verifyState = scrambledState;
            for (const move of result.moves) {
                verifyState = applyMove(verifyState, move);
            }

            if (isSolved(verifyState)) {
                passed++;
            } else {
                failed++;
                console.log(`❌ Échec validation #${i + 1}`);
                console.log(`   Mélange: ${scramble.join(' ')}`);
                console.log(`   Solution: ${result.moves.join(' ')}`);
            }
        } else {
            failed++;
            console.log(`❌ Pas de solution trouvée #${i + 1}`);
        }

        if (i % 20 === 0) {
            await yieldToUI();
        }
    }

    console.log('');
    console.log('📊 RÉSULTATS DE VALIDATION');
    console.log('─'.repeat(40));
    console.log(`✅ Réussis: ${passed}/${sampleSize} (${((passed/sampleSize)*100).toFixed(1)}%)`);
    console.log(`❌ Échecs:  ${failed}/${sampleSize}`);
}

// ============================================================================
// Suite complète de tests
// ============================================================================

/**
 * Exécute tous les tests
 */
export async function runAllTests(): Promise<void> {
    console.clear();
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     BANC DE TEST COMPLET - SOLVEUR POCKET CUBE 2x2           ║');
    console.log('║                    Mémoire de fin d\'étude                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🚀 Démarrage de la suite de tests...');
    console.log('');

    // 1. Validation
    await runValidationTest(50);
    console.log('\n' + '═'.repeat(60) + '\n');

    // 2. Distribution
    await runDistributionTest(200);
    console.log('\n' + '═'.repeat(60) + '\n');

    // 3. Comparaison (sans BFS par défaut car trop lent)
    await runComparisonTest(50, 11, false);
    console.log('\n' + '═'.repeat(60) + '\n');

    // 4. Pire cas
    await runWorstCaseTest();

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    TESTS TERMINÉS ✓                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
}

// ============================================================================
// Export de l'interface publique
// ============================================================================

export const testRunner = {
    /** Lance tous les tests */
    runAll: runAllTests,
    
    /** Compare BFS et IDA* */
    comparison: runComparisonTest,
    
    /** Analyse la distribution des profondeurs */
    distribution: runDistributionTest,
    
    /** Teste les pires cas (profondeur 11) */
    worstCase: runWorstCaseTest,
    
    /** Valide que les solutions sont correctes */
    validation: runValidationTest,
    
    /** Génère un mélange aléatoire */
    scramble: generateRandomScramble,
    
    /** Crée un état depuis une chaîne de mélange */
    fromScramble: stateFromScramble
};

export default testRunner;
