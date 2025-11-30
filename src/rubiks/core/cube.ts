import {Camera, Color, Group, Matrix4, Vector2, Vector3} from "three";
import {getAngleBetweenTwoVector2, equalDirection} from "../util/math";
import {ndcToScreen} from "../util/transform";
import CubeData, {CubeElement} from "./cubeData";
import CubeState, {RotateDirection} from "./cubeState";
import {createSquare, SquareMesh} from "./square";
import {
    CubeLogic, 
    makeSolvedCube, 
    applyMove, 
    cloneLogic, 
    isSolved,
    axisToMove
} from "./cubeLogic";

/**
 * Obtenir la position du carré décalé de 0.5 vers l'intérieur
 */
const getTemPos = (square: SquareMesh, squareSize: number) => {
    const moveVect = square.element.normal.clone().normalize().multiplyScalar(-0.5 * squareSize);
    const pos = square.element.pos.clone();

    return pos.add(moveVect);
};

export class Cube extends Group {
    private data: CubeData;
    public state!: CubeState;
    public logic!: CubeLogic;
    
    public get squares() {
        return this.children as SquareMesh[];
    }

    /**
     * Ordre du cube (2x2, 3x3, etc.)
     */
    public get order() {
        return this.data.cubeOrder;
    }

    /**
     * Taille d'un carré
     */
    public get squareSize() {
        return this.data.elementSize;
    }

    /**
     * Vérifie si le cube est résolu
     */
    public get finish() {
        return this.state.validateFinish();
    }

    public constructor(order = 3) {
        super();

        this.data = new CubeData(order);

        this.createChildrenByData();

        this.rotateX(Math.PI * 0.25);
        this.rotateY(Math.PI * 0.25);
    }

    private createChildrenByData() {
        this.remove(...this.children);

        for (let i = 0; i < this.data.elements.length; i++) {
            const square = createSquare(new Color(this.data.elements[i].color), this.data.elements[i]);
            this.add(square);
        }

        this.state = new CubeState(this.squares);
        this.logic = makeSolvedCube();
    }

    /**
     * Tourner une face du cube
     * @param mousePrePos Position de la souris avant la rotation (coordonnées écran)
     * @param mouseCurPos Position actuelle de la souris (coordonnées écran)
     * @param controlSquare Le carré contrôlé
     * @param camera La caméra
     * @param winSize Taille de la fenêtre
     */
    public rotateOnePlane(mousePrePos: Vector2, mouseCurPos: Vector2, controlSquare: SquareMesh, camera: Camera, winSize: {w: number; h: number}) {
        if (mouseCurPos.distanceTo(mousePrePos) < 5) {
            return;
        }

        if (!this.squares.includes(controlSquare)) {
            return;
        }

        const screenDir = mouseCurPos.clone().sub(mousePrePos);
        if (screenDir.x === 0 && screenDir.y === 0) return;
        if (!this.state.inRotation) {
            const squareScreenPos = this.getSquareScreenPos(controlSquare, camera, winSize) as Vector2;

            const squareNormal = controlSquare.element.normal;
            const squarePos = controlSquare.element.pos;

            // Autres carrés sur la même face que controlSquare
            const commonDirSquares = this.squares.filter((square) => square.element.normal.equals(squareNormal) && !square.element.pos.equals(squarePos));

            // square1 et square2 sont deux SquareMesh sur la même face dans les directions verticale et horizontale
            let square1: SquareMesh | undefined;
            let square2: SquareMesh | undefined;
            for (let i = 0; i < commonDirSquares.length; i++) {
                if (squareNormal.x !== 0) {
                    if (commonDirSquares[i].element.pos.y === squarePos.y) {
                        square1 = commonDirSquares[i];
                    }
                    if (commonDirSquares[i].element.pos.z === squarePos.z) {
                        square2 = commonDirSquares[i];
                    }
                } else if (squareNormal.y !== 0) {
                    if (commonDirSquares[i].element.pos.x === squarePos.x) {
                        square1 = commonDirSquares[i];
                    }
                    if (commonDirSquares[i].element.pos.z === squarePos.z) {
                        square2 = commonDirSquares[i];
                    }
                } else if (squareNormal.z !== 0) {
                    if (commonDirSquares[i].element.pos.x === squarePos.x) {
                        square1 = commonDirSquares[i];
                    }
                    if (commonDirSquares[i].element.pos.y === squarePos.y) {
                        square2 = commonDirSquares[i];
                    }
                }

                if (square1 && square2) {
                    break;
                }
            }

            if (!square1 || !square2) {
                return;
            }

            const square1ScreenPos = this.getSquareScreenPos(square1, camera, winSize) as Vector2;
            const square2ScreenPos = this.getSquareScreenPos(square2, camera, winSize) as Vector2;

            // Enregistrer les quatre directions de rotation possibles
            const squareDirs: RotateDirection[] = [];

            const squareDir1 = {
                screenDir: new Vector2(square1ScreenPos.x - squareScreenPos.x, square1ScreenPos.y - squareScreenPos.y).normalize(),
                startSquare: controlSquare,
                endSquare: square1
            };
            const squareDir2 = {
                screenDir: new Vector2(square2ScreenPos.x - squareScreenPos.x, square2ScreenPos.y - squareScreenPos.y).normalize(),
                startSquare: controlSquare,
                endSquare: square2
            };
            squareDirs.push(squareDir1);
            squareDirs.push({
                screenDir: squareDir1.screenDir.clone().negate(),
                startSquare: square1,
                endSquare: controlSquare
            });
            squareDirs.push(squareDir2);
            squareDirs.push({
                screenDir: squareDir2.screenDir.clone().negate(),
                startSquare: square2,
                endSquare: controlSquare
            });

            // Déterminer la direction de rotation en fonction de l'angle entre les quatre vecteurs de direction de rotation possibles et la direction de translation de la souris. La direction avec le plus petit angle est la direction de rotation.
            let minAngle = Math.abs(getAngleBetweenTwoVector2(squareDirs[0].screenDir, screenDir));
            let rotateDir = squareDirs[0];  // Direction de rotation finale

            for (let i = 0; i < squareDirs.length; i++) {
                const angle = Math.abs(getAngleBetweenTwoVector2(squareDirs[i].screenDir, screenDir));

                if (minAngle > angle) {
                    minAngle = angle;
                    rotateDir = squareDirs[i];
                }
            }

            // Axe de rotation : Calculé par le produit vectoriel du vecteur normal et de la direction de rotation
            const rotateDirLocal = rotateDir.endSquare.element.pos.clone().sub(rotateDir.startSquare.element.pos).normalize();
            const rotateAxisLocal = squareNormal.clone().cross(rotateDirLocal).normalize(); // Axe de rotation

            // Carrés à faire tourner : Le vecteur de la position controlSquare à la position du carré à faire tourner est perpendiculaire à l'axe de rotation. Cette propriété permet de filtrer tous les carrés à faire tourner.
            const rotateSquares: SquareMesh[] = [];
            const controlTemPos = getTemPos(controlSquare, this.data.elementSize);

            for (let i = 0; i < this.squares.length; i++) {
                const squareTemPos = getTemPos(this.squares[i], this.data.elementSize);
                const squareVec = controlTemPos.clone().sub(squareTemPos);
                if (squareVec.dot(rotateAxisLocal) === 0) {
                    rotateSquares.push(this.squares[i]);
                }
            }

            this.state.setRotating(controlSquare, rotateSquares, rotateDir, rotateAxisLocal);
        }

        const rotateSquares = this.state.activeSquares; // Carrés en rotation
        const rotateAxisLocal = this.state.rotateAxisLocal; // Axe de rotation

        // Angle de rotation : Utilisez la longueur de projection de screenDir dans la direction de rotation. Plus la longueur de projection est longue, plus l'angle de rotation est grand.
        // Le signe de la longueur de projection affecte la direction angulaire de la rotation du cube
        // Angle de rotation = longueur de projection / taille du cube * 90 degrés
        const temAngle = getAngleBetweenTwoVector2(this.state.rotateDirection!.screenDir, screenDir);
        const screenDirProjectRotateDirLen = Math.cos(temAngle) * screenDir.length();
        const coarseCubeSize = this.getCoarseCubeSize(camera, winSize);
        const rotateAnglePI = screenDirProjectRotateDirLen / coarseCubeSize * Math.PI * 0.5; // Angle de rotation
        const newRotateAnglePI = rotateAnglePI - this.state.rotateAnglePI;
        this.state.rotateAnglePI = rotateAnglePI;

        const rotateMat = new Matrix4();
        rotateMat.makeRotationAxis(rotateAxisLocal!, newRotateAnglePI);

        for (let i = 0; i < rotateSquares.length; i++) {
            rotateSquares[i].applyMatrix4(rotateMat);
            rotateSquares[i].updateMatrix();
        }
    }

    /**
     * Obtenir l'animation après rotation et mettre à jour l'état du cube
     */
    public getAfterRotateAnimation() {
        const needRotateAnglePI = this.getNeededRotateAngle();
        const rotateSpeed = Math.PI * 0.5 / 500; // Rotation de 90 degrés en 1s
        let rotatedAngle = 0;
        let lastTick: number;
        let rotateTick = (tick: number): boolean => {
            if (!lastTick) {
                lastTick = tick;
            }
            const time = tick - lastTick;
            lastTick = tick;
            if (rotatedAngle < Math.abs(needRotateAnglePI)) {
                let curAngle = time * rotateSpeed
                if (rotatedAngle + curAngle > Math.abs(needRotateAnglePI)) {
                    curAngle = Math.abs(needRotateAnglePI) - rotatedAngle;
                }
                rotatedAngle += curAngle;
                curAngle = needRotateAnglePI > 0 ? curAngle : -curAngle;

                const rotateMat = new Matrix4();
                rotateMat.makeRotationAxis(this.state.rotateAxisLocal!, curAngle);
                for (let i = 0; i < this.state.activeSquares.length; i++) {
                    this.state.activeSquares[i].applyMatrix4(rotateMat);
                    this.state.activeSquares[i].updateMatrix();
                }
                return true;
            } else {
                this.updateStateAfterRotate();
                this.data.saveDataToLocal();
                return false;
            }
        }

        return rotateTick;
    }

    /**
     * Mettre à jour l'état après la rotation
     */
    private updateStateAfterRotate() {
        // Rotation vers la position correcte. Parfois, la rotation n'est pas un multiple de 90 degrés et doit être corrigée pour être un multiple de 90 degrés.
        const needRotateAnglePI = this.getNeededRotateAngle();
        this.state.rotateAnglePI += needRotateAnglePI;

        // Mise à jour des données : état de CubeElement, vecteur normal, position, etc. ont changé après la rotation
        const angleRelative360PI = this.state.rotateAnglePI % (Math.PI * 2);
        // const timesOfRight = angleRelative360PI / rightAnglePI; // L'angle de rotation équivaut à plusieurs 90 degrés

        if (Math.abs(angleRelative360PI) > 0.1) {

            // Mise à jour de la position et du vecteur normal
            const rotateMat2 = new Matrix4();
            rotateMat2.makeRotationAxis(this.state.rotateAxisLocal!, angleRelative360PI);

            const pn: {
                nor: Vector3;
                pos: Vector3;
            }[] = [];

            for (let i = 0; i < this.state.activeSquares.length; i++) {
                const nor = this.state.activeSquares[i].element.normal.clone();
                const pos = this.state.activeSquares[i].element.pos.clone();

                nor.applyMatrix4(rotateMat2); // Vecteur normal après rotation
                pos.applyMatrix4(rotateMat2); // Position après rotation

                // Trouver le carré correspondant après rotation et mettre à jour sa couleur
                for (let j = 0; j < this.state.activeSquares.length; j++) {
                    const nor2 = this.state.activeSquares[j].element.normal.clone();
                    const pos2 = this.state.activeSquares[j].element.pos.clone();
                    if (equalDirection(nor, nor2) && pos.distanceTo(pos2) < 0.1) {
                        pn.push({
                            nor: nor2,
                            pos: pos2
                        });
                    }
                }
            }

            for (let i = 0; i < this.state.activeSquares.length; i++) {
                this.state.activeSquares[i].element.normal = pn[i].nor;
                this.state.activeSquares[i].element.pos = pn[i].pos;
            }
            
            // Synchronisation de la logique pour 2×2
            if (this.order === 2) {
                this.syncLogicFromRotation(angleRelative360PI);
            }
        }

        this.state.resetState();
    }
    
    /**
     * Synchronise la couche logique après une rotation visuelle
     */
    private syncLogicFromRotation(anglePI: number) {
        if (!this.state.rotateAxisLocal) return;
        
        const axis = this.state.rotateAxisLocal;
        const numQuarterTurns = Math.round(anglePI / (Math.PI / 2));
        if (numQuarterTurns === 0) return;
        
        // Déterminer l'axe (0=X, 1=Y, 2=Z)
        let axisIndex = -1;
        if (Math.abs(axis.x) > 0.9) axisIndex = 0;
        else if (Math.abs(axis.y) > 0.9) axisIndex = 1;
        else if (Math.abs(axis.z) > 0.9) axisIndex = 2;
        
        if (axisIndex === -1) return;
        
        // Déterminer la couche (0 ou 1)
        const controlSquare = this.state.controlSquare;
        if (!controlSquare) return;
        
        const pos = controlSquare.element.pos;
        const border = (this.order * this.squareSize) / 2 - 0.5;
        let layerIndex = 0;
        
        if (axisIndex === 0) layerIndex = pos.x > 0 ? 1 : 0;
        else if (axisIndex === 1) layerIndex = pos.y > 0 ? 1 : 0;
        else layerIndex = pos.z > 0 ? 1 : 0;
        
        // Déterminer le sens (positif = horaire vu du côté positif)
        const axisSign = axisIndex === 0 ? axis.x : (axisIndex === 1 ? axis.y : axis.z);
        const clockwise = (numQuarterTurns > 0) === (axisSign > 0);
        
        // Appliquer le(s) mouvement(s)
        const absQuarters = Math.abs(numQuarterTurns);
        for (let i = 0; i < absQuarters; i++) {
            const move = axisToMove(axisIndex, layerIndex, clockwise, this.order);
            if (move) {
                applyMove(this.logic, move);
            }
        }
    }



    private getNeededRotateAngle() {
        const rightAnglePI = Math.PI * 0.5;
        const exceedAnglePI = Math.abs(this.state.rotateAnglePI) % rightAnglePI;
        let needRotateAnglePI = exceedAnglePI > rightAnglePI * 0.5 ? rightAnglePI - exceedAnglePI : -exceedAnglePI;
        needRotateAnglePI = this.state.rotateAnglePI > 0 ? needRotateAnglePI : -needRotateAnglePI;

        return needRotateAnglePI;
    }
    /**
     * Obtenir une estimation de la taille du cube à l'écran
     */
    public getCoarseCubeSize(camera: Camera, winSize: {w: number; h: number}) {
        const width = this.order * this.squareSize;
        const p1 = new Vector3(-width / 2, 0, 0);
        const p2 = new Vector3(width / 2, 0, 0);

        p1.project(camera);
        p2.project(camera);

        const {w, h} = winSize;
        const screenP1 = ndcToScreen(p1, w, h);
        const screenP2 = ndcToScreen(p2, w, h);

        return Math.abs(screenP2.x - screenP1.x);
    }

    /**
     * Obtenir les coordonnées écran normalisées d'un carré
     */
    private getSquareScreenPos(square: SquareMesh, camera: Camera, winSize: {w: number; h: number}) {
        if (!this.squares.includes(square)) {
            return null;
        }

        const mat = new Matrix4().multiply(square.matrixWorld).multiply(this.matrix);

        const pos = new Vector3().applyMatrix4(mat);
        pos.project(camera);

        const {w, h} = winSize;
        return ndcToScreen(pos, w, h);
    }

    /**
     * Mélanger le cube
     */
    public disorder() {

    }

    /**
     * Effectuer une rotation animée programmée sur une face
     * @param axisIndex 0=X, 1=Y, 2=Z
     * @param layerIndex Index de la couche (0 à order-1)
     * @param clockwise Sens horaire ou anti-horaire
     * @param callback Fonction appelée une fois la rotation terminée
     */
    public performAnimatedRotation(
        axisIndex: number, 
        layerIndex: number, 
        clockwise: boolean,
        callback: () => void
    ) {
        const order = this.order;
        const border = (order * this.squareSize) / 2 - 0.5;
        const layerPosition = -border + layerIndex;
        
        // Définir l'axe de rotation
        const axes = [
            new Vector3(1, 0, 0),  // X
            new Vector3(0, 1, 0),  // Y
            new Vector3(0, 0, 1)   // Z
        ];
        const rotateAxisLocal = axes[axisIndex];
        
        // Trouver les carrés à faire tourner
        const rotateSquares = this.squares.filter((square) => {
            const pos = square.element.pos;
            const moveVect = square.element.normal.clone().normalize().multiplyScalar(-0.5 * this.squareSize);
            const temPos = pos.clone().add(moveVect);
            
            if (axisIndex === 0) {
                return Math.abs(temPos.x - layerPosition) < 0.1;
            } else if (axisIndex === 1) {
                return Math.abs(temPos.y - layerPosition) < 0.1;
            } else {
                return Math.abs(temPos.z - layerPosition) < 0.1;
            }
        });

        if (rotateSquares.length === 0) {
            callback();
            return;
        }

        // Angle total de rotation (90 degrés)
        const totalAngle = (Math.PI / 2) * (clockwise ? 1 : -1);
        const rotateSpeed = Math.PI * 0.5 / 300; // Vitesse de rotation (90° en 300ms)
        let rotatedAngle = 0;
        let lastTick: number;

        const animation = (tick: number) => {
            if (!lastTick) {
                lastTick = tick;
            }
            const deltaTime = tick - lastTick;
            lastTick = tick;

            if (rotatedAngle < Math.abs(totalAngle)) {
                let curAngle = deltaTime * rotateSpeed;
                if (rotatedAngle + curAngle > Math.abs(totalAngle)) {
                    curAngle = Math.abs(totalAngle) - rotatedAngle;
                }
                rotatedAngle += curAngle;
                
                const angleToApply = clockwise ? curAngle : -curAngle;
                const rotateMat = new Matrix4();
                rotateMat.makeRotationAxis(rotateAxisLocal, angleToApply);

                for (const square of rotateSquares) {
                    square.applyMatrix4(rotateMat);
                    square.updateMatrix();
                }
                
                requestAnimationFrame(animation);
            } else {
                // Mettre à jour les données des carrés après la rotation
                const fullRotateMat = new Matrix4();
                fullRotateMat.makeRotationAxis(rotateAxisLocal, totalAngle);
                
                for (const square of rotateSquares) {
                    // Appliquer la rotation aux normales et positions
                    square.element.normal.applyMatrix4(fullRotateMat);
                    square.element.pos.applyMatrix4(fullRotateMat);
                    
                    // Arrondir pour éviter les erreurs de virgule flottante
                    square.element.normal.x = Math.round(square.element.normal.x);
                    square.element.normal.y = Math.round(square.element.normal.y);
                    square.element.normal.z = Math.round(square.element.normal.z);
                    square.element.pos.x = Math.round(square.element.pos.x * 10) / 10;
                    square.element.pos.y = Math.round(square.element.pos.y * 10) / 10;
                    square.element.pos.z = Math.round(square.element.pos.z * 10) / 10;
                }
                
                // Synchroniser la logique pour 2×2
                if (this.order === 2) {
                    const move = axisToMove(axisIndex, layerIndex, clockwise, this.order);
                    if (move) {
                        applyMove(this.logic, move);
                    }
                }
                
                callback();
            }
        };

        requestAnimationFrame(animation);
    }

    /**
     * Applique une séquence de mouvements avec animation
     */
    public applyMoveSequence(moves: string[], callback?: () => void) {
        if (moves.length === 0) {
            callback?.();
            return;
        }
        
        const [move, ...rest] = moves;
        const params = this.moveToAxisParams(move);
        
        if (params) {
            this.performAnimatedRotation(params.axisIndex, params.layerIndex, params.clockwise, () => {
                this.applyMoveSequence(rest, callback);
            });
        } else {
            this.applyMoveSequence(rest, callback);
        }
    }
    
    /**
     * Convertit un move (ex: "R", "U'") en paramètres pour performAnimatedRotation
     */
    private moveToAxisParams(move: string): { axisIndex: number, layerIndex: number, clockwise: boolean } | null {
        const face = move[0];
        const isPrime = move.includes("'");
        const isDouble = move.includes("2");
        
        let axisIndex: number;
        let layerIndex: number;
        let clockwise: boolean;
        
        switch (face) {
            case 'U': axisIndex = 1; layerIndex = 1; clockwise = !isPrime; break;
            case 'D': axisIndex = 1; layerIndex = 0; clockwise = isPrime; break;
            case 'R': axisIndex = 0; layerIndex = 1; clockwise = !isPrime; break;
            case 'L': axisIndex = 0; layerIndex = 0; clockwise = isPrime; break;
            case 'F': axisIndex = 2; layerIndex = 1; clockwise = !isPrime; break;
            case 'B': axisIndex = 2; layerIndex = 0; clockwise = isPrime; break;
            default: return null;
        }
        
        return { axisIndex, layerIndex, clockwise };
    }

    public restore() {
        this.data.initialFinishData();
        this.data.saveDataToLocal();
        this.createChildrenByData();
    }
    
    /**
     * Retourne l'état logique actuel (pour debug/solveur)
     */
    public getLogicState(): CubeLogic {
        return cloneLogic(this.logic);
    }
    
    /**
     * Vérifie si le cube est résolu (logiquement)
     */
    public isLogicallySolved(): boolean {
        return isSolved(this.logic);
    }
};
