import {Vector3} from "three";
import {getCubieIdFromPosition, getStickerIndexFromNormal} from "./cubeLogic";

type ColorRepresentation = string | number;

export interface CubeElement {
    color: ColorRepresentation;
    pos: Vector3;
    normal: Vector3;
    withLogo?: boolean;
    cubieId?: number | null;      // ID du cubie (0-7 pour 2×2)
    stickerIndex?: number;        // Index du sticker sur le cubie (0-2)
}

type CubeColor = [ColorRepresentation, ColorRepresentation, ColorRepresentation, ColorRepresentation, ColorRepresentation, ColorRepresentation];

class CubeData {
    /**
     * Ordre du cube (2, 3, 4, etc.)
     */
    public cubeOrder: number;
    /**
     * Couleurs du cube : haut, bas, gauche, droite, avant, arrière
     */
    private colors: CubeColor;
    private _size = 1;
    public get elementSize() {
        return this._size;
    }
    public elements: CubeElement[] = [];
    public constructor(cubeOrder = 3, colors: CubeColor = ["#fb3636", "#ff9351", "#fade70", "#9de16f", "#51acfa", "#ffffff"]) {
        this.cubeOrder = cubeOrder;
        this.colors = colors;
        this.initElements();
    };

    /**
     * Initialiser les données
     * @param localDataFirst Indique s'il faut d'abord charger les données du localStorage
     */
    private initElements(localDataFirst = true) {
        if (localDataFirst && localStorage) {
            try {
                this.elements = this.getLocalData();
                // Vérifier que les données sont valides
                if (!this.validateElements()) {
                    console.warn("Données localStorage invalides, réinitialisation...");
                    this.elements = [];
                }
            } catch (e) {
                console.error("Erreur lors du chargement des données localStorage:", e);
                this.elements = [];
            }
        }

        if (this.elements.length === this.cubeOrder * this.cubeOrder * 6) {
            return;
        }

        this.initialFinishData();
    }

    /**
     * Valider que les éléments sont correctement formés
     */
    private validateElements(): boolean {
        if (this.elements.length !== this.cubeOrder * this.cubeOrder * 6) {
            return false;
        }
        
        for (const element of this.elements) {
            if (!element.pos || !element.normal || !element.color) {
                return false;
            }
            if (typeof element.pos.x !== 'number' || typeof element.pos.y !== 'number' || typeof element.pos.z !== 'number') {
                return false;
            }
            if (typeof element.normal.x !== 'number' || typeof element.normal.y !== 'number' || typeof element.normal.z !== 'number') {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Créer les données d'un cube résolu
     */
    public initialFinishData() {
        this.elements = [];
        const border = (this.cubeOrder * this._size) / 2 - 0.5;

        // top and bottom
        for (let x = -border; x <= border; x++) {
            for (let z = -border; z <= border; z++) {
                const posTop = new Vector3(x, border + this._size * 0.5, z);
                const normalTop = new Vector3(0, 1, 0);
                const cubieIdTop = this.cubeOrder === 2 ? getCubieIdFromPosition(x, border, z) : null;
                
                this.elements.push({
                    color: this.colors[0],
                    pos: posTop,
                    normal: normalTop,
                    cubieId: cubieIdTop,
                    stickerIndex: cubieIdTop !== null ? getStickerIndexFromNormal(cubieIdTop, 0, 1, 0) : undefined
                });

                const posBottom = new Vector3(x, -border - this._size * 0.5, z);
                const normalBottom = new Vector3(0, -1, 0);
                const cubieIdBottom = this.cubeOrder === 2 ? getCubieIdFromPosition(x, -border, z) : null;
                
                this.elements.push({
                    color: this.colors[1],
                    pos: posBottom,
                    normal: normalBottom,
                    cubieId: cubieIdBottom,
                    stickerIndex: cubieIdBottom !== null ? getStickerIndexFromNormal(cubieIdBottom, 0, -1, 0) : undefined
                });
            }
        }

        // left and right
        for (let y = -border; y <= border; y++) {
            for (let z = -border; z <= border; z++) {
                const posLeft = new Vector3(-border - this._size * 0.5, y, z);
                const normalLeft = new Vector3(-1, 0, 0);
                const cubieIdLeft = this.cubeOrder === 2 ? getCubieIdFromPosition(-border, y, z) : null;
                
                this.elements.push({
                    color: this.colors[2],
                    pos: posLeft,
                    normal: normalLeft,
                    cubieId: cubieIdLeft,
                    stickerIndex: cubieIdLeft !== null ? getStickerIndexFromNormal(cubieIdLeft, -1, 0, 0) : undefined
                });

                const posRight = new Vector3(border + this._size * 0.5, y, z);
                const normalRight = new Vector3(1, 0, 0);
                const cubieIdRight = this.cubeOrder === 2 ? getCubieIdFromPosition(border, y, z) : null;
                
                this.elements.push({
                    color: this.colors[3],
                    pos: posRight,
                    normal: normalRight,
                    cubieId: cubieIdRight,
                    stickerIndex: cubieIdRight !== null ? getStickerIndexFromNormal(cubieIdRight, 1, 0, 0) : undefined
                });
            }
        }

        // front and back
        for (let x = -border; x <= border; x++) {
            for (let y = -border; y <= border; y++) {
                const posFront = new Vector3(x, y, border + this._size * 0.5);
                const normalFront = new Vector3(0, 0, 1);
                const cubieIdFront = this.cubeOrder === 2 ? getCubieIdFromPosition(x, y, border) : null;
                
                this.elements.push({
                    color: this.colors[4],
                    pos: posFront,
                    normal: normalFront,
                    withLogo: x === 0 && y === 0,
                    cubieId: cubieIdFront,
                    stickerIndex: cubieIdFront !== null ? getStickerIndexFromNormal(cubieIdFront, 0, 0, 1) : undefined
                });

                const posBack = new Vector3(x, y, -border - this._size * 0.5);
                const normalBack = new Vector3(0, 0, -1);
                const cubieIdBack = this.cubeOrder === 2 ? getCubieIdFromPosition(x, y, -border) : null;
                
                this.elements.push({
                    color: this.colors[5],
                    pos: posBack,
                    normal: normalBack,
                    cubieId: cubieIdBack,
                    stickerIndex: cubieIdBack !== null ? getStickerIndexFromNormal(cubieIdBack, 0, 0, -1) : undefined
                });
            }
        }
    }

    /**
     * Sauvegarder les données dans le localStorage
     */
    public saveDataToLocal() {
        const data = JSON.stringify(this.elements);

        if (localStorage) {
            localStorage.setItem(`${this.cubeOrder}-Rubik`, data);
        }
    }

    /**
     * Charger les données depuis le localStorage
     * @returns
     */
    public getLocalData() {
        if (localStorage) {
            try {
                const data = localStorage.getItem(`${this.cubeOrder}-Rubik`);

                if (data) {
                    const parseData: {
                        color: ColorRepresentation;
                        pos: {x: number; y: number; z: number},
                        normal: {x: number; y: number; z: number}
                    }[] = JSON.parse(data);

                    parseData.forEach((item) => {
                        item.normal = new Vector3(item.normal.x, item.normal.y, item.normal.z);
                        item.pos = new Vector3(item.pos.x, item.pos.y, item.pos.z);
                    });

                    return parseData as CubeElement[];
                }
            } catch (e) {
                console.error("Erreur lors du parsing des données localStorage, suppression...", e);
                localStorage.removeItem(`${this.cubeOrder}-Rubik`);
            }
        }

        return [];
    }

    /**
     * Effacer les données du localStorage
     */
    public clearLocalData() {
        if (localStorage) {
            localStorage.removeItem(`${this.cubeOrder}-Rubik`);
        }
    }
}

export default CubeData;
