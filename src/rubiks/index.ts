import {PerspectiveCamera, Scene, WebGLRenderer} from "three";
import createCamera from "./components/camera";
import createScene from "./components/scene";
import createRenderer from "./components/renderer";
import {Cube} from "./core/cube";
import Control, {MouseControl, TouchControl} from "./core/control";
import { selfTest } from "./core/testLogic";

export * from "./core/cubeLogic";
export { selfTest };

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

        // Ratio plus grand = cube plus petit (plus éloigné)
        const ratio = Math.max(3.0 / (winW / coarseSize), 3.0 / (winH / coarseSize));
        this.camera.position.z *= ratio;
        
        // Décaler la caméra légèrement vers le haut pour que le cube paraisse centré
        // (compense la barre de navigation en haut)
        this.camera.position.y = 0.4;
        this._controls.push(
            new MouseControl(this.camera, this.scene, this.renderer, cube),
            new TouchControl(this.camera, this.scene, this.renderer, cube)
        );

        this.render();
    }

    /**
     * Mélanger le cube avec des mouvements aléatoires animés
     * @param numMoves Nombre de mouvements (défaut: 20)
     */
    public disorder(numMoves: number = 20) {
        if (this.cube && !this.isShuffling) {
            this.isShuffling = true;
            
            this.performAnimatedRandomMoves(numMoves, -1, () => {
                this.isShuffling = false;
                console.log(`Mélange terminé (${numMoves} mouvements).`);
            });
        }
    }

    /**
     * Alias pour disorder - mélange le cube avec n mouvements
     */
    public scramble(numMoves: number = 10) {
        this.disorder(numMoves);
    }

    /**
     * Effectuer des mouvements aléatoires animés sur le cube
     */
    private performAnimatedRandomMoves(numMoves: number, lastAxisIndex: number, callback: () => void) {
        if (!this.cube || numMoves <= 0) {
            callback();
            return;
        }

        const order = this.cube.order;
        
        // Choisir un axe aléatoire (différent du dernier pour plus de variété)
        let axisIndex: number;
        do {
            axisIndex = Math.floor(Math.random() * 3);
        } while (axisIndex === lastAxisIndex && numMoves > 1);
        
        // Choisir une couche aléatoire
        const layerIndex = Math.floor(Math.random() * order);
        
        // Choisir un sens de rotation aléatoire
        const clockwise = Math.random() > 0.5;

        // Effectuer la rotation animée
        this.cube.performAnimatedRotation(axisIndex, layerIndex, clockwise, () => {
            this.render();
            // Passer au mouvement suivant
            this.performAnimatedRandomMoves(numMoves - 1, axisIndex, callback);
        });
    }

    /**
     * Réinitialiser le cube à son état résolu
     */
    public restore() {
        if (this.cube) {
            this.cube.restore();
            this.render();
        } else {
            console.error("ERREUR_REINIT: this.cube est undefined.");
        }
    }

    /**
     * Zoomer (rapprocher la caméra)
     */
    public zoomIn() {
        const minZ = 5;
        if (this.camera.position.z > minZ) {
            this.camera.position.z *= 0.9;
            if (this.camera.position.z < minZ) {
                this.camera.position.z = minZ;
            }
            this.render();
        }
    }

    /**
     * Dézoomer (éloigner la caméra)
     */
    public zoomOut() {
        const maxZ = 50;
        if (this.camera.position.z < maxZ) {
            this.camera.position.z *= 1.1;
            if (this.camera.position.z > maxZ) {
                this.camera.position.z = maxZ;
            }
            this.render();
        }
    }

    public solve() {
        console.log("[Solve] Fonction solve non implémentée");
    }

    /**
     * Exécute une séquence de mouvements sur le cube 3D
     * Exemple: executeMoves(["R", "U", "R'", "U'"])
     */
    public executeMoves(moves: string[], callback?: () => void) {
        if (!this.cube || this.isShuffling || this.isSolving) {
            console.warn("Cube occupé ou non initialisé");
            return;
        }
        
        this.isSolving = true;
        this.cube.applyMoveSequence(moves, () => {
            this.isSolving = false;
            this.render();
            console.log("Séquence terminée:", moves.join(" "));
            callback?.();
        });
    }

    /**
     * Retourne l'état logique actuel du cube
     */
    public getLogicState() {
        return this.cube?.getLogicState();
    }

    /**
     * Vérifie si le cube est résolu
     */
    public isCubeSolved(): boolean {
        return this.cube?.isLogicallySolved() ?? false;
    }

    private applySolutionMoves(
        moves: Array<{ axisIndex: number; layerIndex: number; clockwise: boolean }>,
        index: number,
        callback: () => void
    ) {
        if (!this.cube || index >= moves.length) {
            callback();
            return;
        }

        const move = moves[index];
        this.cube.performAnimatedRotation(move.axisIndex, move.layerIndex, move.clockwise, () => {
            this.render();
            setTimeout(() => {
                this.applySolutionMoves(moves, index + 1, callback);
            }, 100);
        });
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    private startAnimation() {
        const animation = (time: number) => {
            time /= 1000; // convertir en secondes
            if (this.cube) {
                // Petit mouvement de flottement
                this.cube.position.y = Math.sin(time) * 0.2;
            }

            this.render();
            requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    }
}

export default Rubiks;
