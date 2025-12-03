import Rubiks from "./rubiks";
import { testRunner } from "./rubiks/util/testRunner";

window.onload = () => {
    const container = document.getElementById("container");
    const disorderEle = document.getElementById("disorder") as HTMLButtonElement;
    const restore = document.getElementById("restore") as HTMLButtonElement;
    const solveEle = document.getElementById("solve") as HTMLButtonElement;
    const zoomInEle = document.getElementById("zoom-in") as HTMLButtonElement;
    const zoomOutEle = document.getElementById("zoom-out") as HTMLButtonElement;
    
    if (container) {
        // Initialisation de la scène 3D
        const rubiks = new Rubiks(container);

        // Exposition globale pour le debug dans la console du navigateur
        (window as any).cube = {
            // Contrôles du cube
            move: (...moves: string[]) => rubiks.executeMoves(moves),
            state: () => rubiks.getLogicState(),
            isSolved: () => rubiks.isCubeSolved(),
            reset: () => rubiks.restore(),
            scramble: (n?: number) => rubiks.scramble(n),
            solve: () => rubiks.solve(),
            
            // Suite de tests pour le mémoire
            tests: testRunner,
            runTests: () => testRunner.runAll(),
            runComparison: (n?: number) => testRunner.comparison(n),
            runDistribution: (n?: number) => testRunner.distribution(n),
            runWorstCase: () => testRunner.worstCase(),
            runValidation: (n?: number) => testRunner.validation(n)
        };
        
        console.log("🎲 Pocket Cube 2×2 - Prêt !");
        console.log("─".repeat(50));
        console.log("📦 Commandes disponibles :");
        console.log("   cube.solve()          - Résoudre le cube");
        console.log("   cube.scramble(10)     - Mélanger (10 coups)");
        console.log("   cube.reset()          - Réinitialiser");
        console.log("");
        console.log("🧪 Tests pour le mémoire :");
        console.log("   cube.runTests()       - Exécuter tous les tests");
        console.log("   cube.runComparison(50)- Comparer BFS vs IDA*");
        console.log("   cube.runDistribution(100) - Distribution des profondeurs");
        console.log("   cube.runWorstCase()   - Tester les pires cas");
        console.log("   cube.runValidation(50)- Valider les solutions");
        console.log("─".repeat(50));

        // --- Gestion des événements (Boutons) ---

        disorderEle.addEventListener("click", () => {
            rubiks.disorder(); // Mélange
        });

        restore.addEventListener("click", () => {
            rubiks.restore(); // Reset visuel
        });

        solveEle.addEventListener("click", () => {
            rubiks.solve(); // Lancement de IDA*
        });

        zoomInEle.addEventListener("click", () => {
            rubiks.zoomIn();
        });

        zoomOutEle.addEventListener("click", () => {
            rubiks.zoomOut();
        });

        // Zoom molette
        container.addEventListener("wheel", (event) => {
            event.preventDefault();
            if (event.deltaY < 0) {
                rubiks.zoomIn();
            } else {
                rubiks.zoomOut();
            }
        });
    }
};