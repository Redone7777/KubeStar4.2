import {Vector3, Vector2} from "three";
import {SquareMesh} from "./square";

export interface RotateDirection {
    screenDir: Vector2; // Vecteur de direction à l'écran
    startSquare: SquareMesh; // Carré de départ pour la direction de rotation
    endSquare: SquareMesh; // Carré d'arrivée pour la direction de rotation
}

class CubeState {
    /** Tous les carrés */
    private _squares: SquareMesh[];
    /** Indique si une rotation est en cours */
    public inRotation = false;
    /**
     * Angle de rotation effectué (en radians)
     */
    public rotateAnglePI = 0;
    /** Carrés en cours de rotation */
    public activeSquares: SquareMesh[] = [];
    /** Carré de contrôle */
    public controlSquare: SquareMesh | undefined;
    /** Direction de rotation */
    public rotateDirection: RotateDirection | undefined;
    /** Axe de rotation */
    public rotateAxisLocal: Vector3 | undefined;
    public constructor(squares: SquareMesh[]) {
        this._squares = squares;
    }

    public setRotating(control: SquareMesh, actives: SquareMesh[], direction: RotateDirection, rotateAxisLocal: Vector3) {
        this.inRotation = true;
        this.controlSquare = control;
        this.activeSquares = actives;
        this.rotateDirection = direction;
        this.rotateAxisLocal = rotateAxisLocal;
    }

    public resetState() {
        this.inRotation = false;
        this.activeSquares = [];
        this.controlSquare = undefined;
        this.rotateDirection = undefined;
        this.rotateAxisLocal = undefined;
        this.rotateAnglePI = 0;
    }

    /**
     * Vérifie si les six faces sont alignées (cube résolu)
     */
    public validateFinish() {
        let finish = true;

        const sixPlane: {
            nor: Vector3;
            squares: SquareMesh[]
        }[] = [
            {
                nor: new Vector3(0, 1, 0),
                squares: []
            },
            {
                nor: new Vector3(0, -1, 0),
                squares: []
            },
            {
                nor: new Vector3(-1, 0, 0),
                squares: []
            },
            {
                nor: new Vector3(1, 0, 0),
                squares: []
            },
            {
                nor: new Vector3(0, 0, 1),
                squares: []
            },
            {
                nor: new Vector3(0, 0, -1),
                squares: []
            },
        ];

        for (let i = 0; i < this._squares.length; i++) {
            const plane = sixPlane.find((item) => this._squares[i].element.normal.equals(item.nor));
            plane!.squares.push(this._squares[i]);
        }

        for (let i = 0; i < sixPlane.length; i++) {
            const plane = sixPlane[i];
            if (!plane.squares.every((square) => square.element.color === plane.squares[0].element.color)) {
                finish = false;
                break;
            }
        }

        return finish;
    }
}

export default CubeState;
