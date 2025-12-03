import {PerspectiveCamera, Scene, WebGLRenderer} from "three";
import createCamera from "./components/camera";
import createScene from "./components/scene";
import createRenderer from "./components/renderer";
import {Cube} from "./core/cube";
import Control, {MouseControl, TouchControl} from "./core/control";
import { solveIDAStar } from "./solve/solveIDAStar";
import { CubeState } from "./solve/types";
import { statusPanel } from "./util/statusPanel";

export * from "./core/cubeLogic";

const setSize = (container: Element, camera: PerspectiveCamera, renderer: WebGLRenderer) => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
};

class Rubiks {
    private camera: PerspectiveCamera;
    private scene: Scene;
    private cube: Cube | undefined;
    private renderer: WebGLRenderer;
    private _controls: Control[] = [];
    private isShuffling: boolean = false;
    private isSolving: boolean = false;
    
    public constructor(container: Element) {
        this.camera = createCamera();
        this.scene = createScene("#0a0a0f");
        this.renderer = createRenderer();
        container.appendChild(this.renderer.domElement);

        window.addEventListener("resize", () => {
            setSize(container, this.camera, this.renderer);
            this.render();
        });
        setSize(container, this.camera, this.renderer);
        
        // Initialiser le Pocket Cube 2x2x2
        this.initCube(container);
        this.startAnimation();
    }

    private initCube(container: Element) {
        this.scene.remove(...this.scene.children);
        if (this._controls.length > 0) {
            this._controls.forEach((control) => control.dispose());
        }

        const cube = new Cube(2); // Toujours 2x2x2
        console.log("Cube créé avec", cube.squares.length, "carrés");
        this.scene.add(cube);
        this.cube = cube;
        this.render();

        const winW = this.renderer.domElement.clientWidth;
        const winH = this.renderer.domElement.clientHeight;
        const coarseSize = cube.getCoarseCubeSize(this.camera, {w: winW, h: winH});

        const ratio = Math.max(3.0 / (winW / coarseSize), 3.0 / (winH / coarseSize));
        this.camera.position.z *= ratio;
        this.camera.position.y = 0.4;
        
        this._controls.push(
            new MouseControl(this.camera, this.scene, this.renderer, cube),
            new TouchControl(this.camera, this.scene, this.renderer, cube)
        );

        this.render();
    }

    private shuffleTotalMoves: number = 0;
    private shuffleCurrentMove: number = 0;

    public disorder(numMoves: number = 20) {
        if (this.cube && !this.isShuffling) {
            this.isShuffling = true;
            this.shuffleTotalMoves = numMoves;
            this.shuffleCurrentMove = 0;
            statusPanel.showShuffling(0, numMoves);
            
            this.performAnimatedRandomMoves(numMoves, -1, () => {
                this.isShuffling = false;
                statusPanel.showShuffleComplete(this.shuffleTotalMoves);
                console.log(`Mélange terminé (${numMoves} mouvements).`);
            });
        }
    }

    public scramble(numMoves: number = 10) {
        this.disorder(numMoves);
    }

    private performAnimatedRandomMoves(numMoves: number, lastAxisIndex: number, callback: () => void) {
        if (!this.cube || numMoves <= 0) {
            callback();
            return;
        }

        const order = this.cube.order;
        let axisIndex: number;
        do {
            axisIndex = Math.floor(Math.random() * 3);
        } while (axisIndex === lastAxisIndex && numMoves > 1);
        
        const layerIndex = Math.floor(Math.random() * order);
        const clockwise = Math.random() > 0.5;

        this.cube.performAnimatedRotation(axisIndex, layerIndex, clockwise, 1, () => {
            this.render();
            this.shuffleCurrentMove++;
            statusPanel.showShuffling(this.shuffleCurrentMove, this.shuffleTotalMoves);
            this.performAnimatedRandomMoves(numMoves - 1, axisIndex, callback);
        });
    }

    public restore() {
        if (this.cube) {
            this.cube.restore();
            this.render();
            statusPanel.reset();
        }
    }

    public zoomIn() {
        const minZ = 5;
        if (this.camera.position.z > minZ) {
            this.camera.position.z *= 0.9;
            if (this.camera.position.z < minZ) this.camera.position.z = minZ;
            this.render();
        }
    }

    public zoomOut() {
        const maxZ = 50;
        if (this.camera.position.z < maxZ) {
            this.camera.position.z *= 1.1;
            if (this.camera.position.z > maxZ) this.camera.position.z = maxZ;
            this.render();
        }
    }

    private solutionMoves: string[] = [];
    private solutionCurrentMove: number = 0;

    public solve() {
        if (!this.cube || this.isShuffling || this.isSolving) {
            console.warn("Cube occupé.");
            return;
        }

        const logicState = this.cube.getLogicState();
        if (!logicState) return;

        const solveState: CubeState = {
            cp: logicState.cornerPerm,
            co: logicState.cornerOri,
        };

        console.log("Lancement IDA* sur l'état:", solveState);
        this.isSolving = true;
        statusPanel.showSolving();

        setTimeout(() => {
            const result = solveIDAStar(solveState);
    
            if (result && result.moves.length > 0) {
                console.log(`✅ Solution: ${result.moves.join(' ')} (${result.timeMs.toFixed(2)}ms)`);
                
                // Afficher la solution trouvée
                statusPanel.showSolutionFound({
                    moves: result.moves,
                    nodesExplored: result.nodesExplored,
                    timeMs: result.timeMs
                });

                // Préparer l'exécution animée
                this.solutionMoves = result.moves;
                this.solutionCurrentMove = 0;

                // Petit délai pour laisser le temps de voir les stats
                setTimeout(() => {
                    this.executeNextSolutionMove();
                }, 1000);
                
            } else if (result && result.moves.length === 0) {
                console.log("Le cube est déjà résolu.");
                statusPanel.showAlreadySolved();
                this.isSolving = false;
            } else {
                console.error("❌ Aucune solution trouvée.");
                statusPanel.showError("Aucune solution trouvée");
                this.isSolving = false;
            }
        }, 50);
    }

    private executeNextSolutionMove() {
        if (!this.cube || this.solutionCurrentMove >= this.solutionMoves.length) {
            statusPanel.showSolved();
            this.isSolving = false;
            return;
        }

        const move = this.solutionMoves[this.solutionCurrentMove];
        statusPanel.showExecuting(
            this.solutionCurrentMove,
            this.solutionMoves.length,
            this.solutionMoves
        );

        this.cube.applyMoveSequence([move], () => {
            this.render();
            this.solutionCurrentMove++;
            this.executeNextSolutionMove();
        });
    }

    public executeMoves(moves: string[], callback?: () => void) {
        if (!this.cube || this.isShuffling || this.isSolving) return;
        
        this.isSolving = true;
        this.cube.applyMoveSequence(moves, () => {
            this.isSolving = false;
            this.render();
            callback?.();
        });
    }

    public getLogicState() {
        return this.cube?.getLogicState();
    }

    public isCubeSolved(): boolean {
        return this.cube?.isLogicallySolved() ?? false;
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    private startAnimation() {
        const animation = (time: number) => {
            time /= 1000;
            if (this.cube) this.cube.position.y = Math.sin(time) * 0.2;
            this.render();
            requestAnimationFrame(animation);
        };
        requestAnimationFrame(animation);
    }
}

export default Rubiks;