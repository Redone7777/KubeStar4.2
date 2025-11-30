import Rubiks from "./rubiks";
import { makeSolvedCube, applyMove, applyMovesSequence, isSolved, logicToFaceletArray, cloneLogic } from "./rubiks/core/cubeLogic";
import { selfTest } from "./rubiks/core/testLogic";

(window as any).cubeLogic = {
    selfTest,
    makeSolvedCube,
    applyMove,
    applyMovesSequence,
    isSolved,
    logicToFaceletArray,
    cloneLogic
};



window.onload = () => {
    const container = document.getElementById("container");
    const disorderEle = document.getElementById("disorder") as HTMLButtonElement;
    const restore = document.getElementById("restore") as HTMLButtonElement;
    const solveEle = document.getElementById("solve") as HTMLButtonElement;
    const zoomInEle = document.getElementById("zoom-in") as HTMLButtonElement;
    const zoomOutEle = document.getElementById("zoom-out") as HTMLButtonElement;
    
    if (container) {
        // Créer le Pocket Cube 2x2x2
        const rubiks = new Rubiks(container);

        (window as any).cube = {
            move: (...moves: string[]) => rubiks.executeMoves(moves),
            moves: (moves: string[]) => rubiks.executeMoves(moves),
            state: () => rubiks.getLogicState(),
            isSolved: () => rubiks.isCubeSolved(),
            reset: () => rubiks.restore(),
            shuffle: (n?: number) => rubiks.disorder(n),
            scramble: (n?: number) => rubiks.scramble(n),
            solve: () => rubiks.solve()
        };
        console.log("🎮 cube.move('R','U'), cube.scramble(10), cube.solve(), cube.reset()");

        disorderEle.addEventListener("click", () => {
            rubiks.disorder();
        });

        restore.addEventListener("click", () => {
            rubiks.restore();
        });

        solveEle.addEventListener("click", () => {
            rubiks.solve();
        });

        zoomInEle.addEventListener("click", () => {
            rubiks.zoomIn();
        });

        zoomOutEle.addEventListener("click", () => {
            rubiks.zoomOut();
        });

        // Zoom avec la molette de la souris
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
