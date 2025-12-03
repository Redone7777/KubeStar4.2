/**
 * Panneau de statut pour afficher les informations de résolution et de mélange
 * Utilise les éléments HTML existants dans index.html
 */

export interface SolveStats {
    moves: string[];
    nodesExplored: number;
    timeMs: number;
}

class StatusPanel {
    private panel: HTMLElement | null = null;
    private toggle: HTMLElement | null = null;
    private cubeState: HTMLElement | null = null;
    private solverStatus: HTMLElement | null = null;
    private moveCount: HTMLElement | null = null;
    private solutionMoves: HTMLElement | null = null;

    constructor() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    private init() {
        this.panel = document.getElementById('status-panel');
        this.toggle = document.getElementById('status-toggle');
        this.cubeState = document.getElementById('cube-state');
        this.solverStatus = document.getElementById('solver-status');
        this.moveCount = document.getElementById('move-count');
        this.solutionMoves = document.getElementById('solution-moves');
    }

    /**
     * Ouvre le panneau
     */
    public open() {
        if (this.panel && this.toggle) {
            this.panel.classList.add('open');
            this.toggle.classList.add('open');
            this.toggle.textContent = '▶';
        }
    }

    /**
     * Ferme le panneau
     */
    public close() {
        if (this.panel && this.toggle) {
            this.panel.classList.remove('open');
            this.toggle.classList.remove('open');
            this.toggle.textContent = '◀';
        }
    }

    /**
     * Affiche le statut de mélange
     */
    public showShuffling(currentMove: number, totalMoves: number) {
        this.open();
        
        if (this.cubeState) {
            this.cubeState.textContent = 'Mélangé';
            this.cubeState.className = 'status-item-value warning';
        }
        
        if (this.solverStatus) {
            this.solverStatus.innerHTML = `<span class="status-loading"><span class="spinner"></span>Mélange ${currentMove}/${totalMoves}</span>`;
        }
        
        if (this.moveCount) {
            this.moveCount.textContent = `${currentMove} / ${totalMoves}`;
        }
        
        if (this.solutionMoves) {
            this.solutionMoves.innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">Mélange en cours...</span>';
        }
    }

    /**
     * Affiche le statut de fin de mélange
     */
    public showShuffleComplete(totalMoves: number) {
        if (this.cubeState) {
            this.cubeState.textContent = 'Mélangé';
            this.cubeState.className = 'status-item-value warning';
        }
        
        if (this.solverStatus) {
            this.solverStatus.textContent = 'Prêt à résoudre';
            this.solverStatus.className = 'status-item-value';
        }
        
        if (this.moveCount) {
            this.moveCount.textContent = `${totalMoves} mouvements`;
        }
        
        if (this.solutionMoves) {
            this.solutionMoves.innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">Cliquez sur Résoudre</span>';
        }
    }

    /**
     * Affiche le statut de recherche de solution
     */
    public showSolving() {
        this.open();
        
        if (this.solverStatus) {
            this.solverStatus.innerHTML = '<span class="status-loading"><span class="spinner"></span>Recherche...</span>';
        }
        
        if (this.solutionMoves) {
            this.solutionMoves.innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">Analyse en cours...</span>';
        }
    }

    /**
     * Affiche la solution trouvée
     */
    public showSolutionFound(stats: SolveStats) {
        if (this.solverStatus) {
            this.solverStatus.textContent = `Trouvée en ${stats.timeMs.toFixed(1)}ms`;
            this.solverStatus.className = 'status-item-value success';
        }
        
        if (this.moveCount) {
            this.moveCount.textContent = `${stats.moves.length} coups (${stats.nodesExplored.toLocaleString()} nœuds)`;
        }
        
        if (this.solutionMoves) {
            if (stats.moves.length === 0) {
                this.solutionMoves.innerHTML = '<span style="color: var(--success);">Déjà résolu !</span>';
            } else {
                this.solutionMoves.innerHTML = stats.moves
                    .map(move => `<span class="solution-move">${move}</span>`)
                    .join('');
            }
        }
    }

    /**
     * Affiche l'exécution de la solution
     */
    public showExecuting(currentMove: number, totalMoves: number, moves: string[]) {
        if (this.solverStatus) {
            this.solverStatus.innerHTML = `<span class="status-loading"><span class="spinner"></span>Résolution ${currentMove + 1}/${totalMoves}</span>`;
        }
        
        if (this.solutionMoves) {
            this.solutionMoves.innerHTML = moves
                .map((move, i) => {
                    if (i < currentMove) {
                        return `<span class="solution-move executed">${move}</span>`;
                    } else if (i === currentMove) {
                        return `<span class="solution-move" style="animation: pulse 0.5s infinite;">${move}</span>`;
                    }
                    return `<span class="solution-move">${move}</span>`;
                })
                .join('');
        }
    }

    /**
     * Affiche le cube résolu
     */
    public showSolved() {
        if (this.cubeState) {
            this.cubeState.textContent = 'Résolu ✓';
            this.cubeState.className = 'status-item-value success';
        }
        
        if (this.solverStatus) {
            this.solverStatus.textContent = 'Terminé !';
            this.solverStatus.className = 'status-item-value success';
        }
        
        if (this.solutionMoves) {
            // Marquer tous les mouvements comme exécutés
            const moves = this.solutionMoves.querySelectorAll('.solution-move');
            moves.forEach(move => {
                move.classList.add('executed');
                (move as HTMLElement).style.animation = '';
            });
        }
    }

    /**
     * Affiche une erreur
     */
    public showError(message: string) {
        this.open();
        
        if (this.solverStatus) {
            this.solverStatus.textContent = message;
            this.solverStatus.className = 'status-item-value error';
        }
    }

    /**
     * Affiche que le cube est déjà résolu
     */
    public showAlreadySolved() {
        if (this.cubeState) {
            this.cubeState.textContent = 'Résolu ✓';
            this.cubeState.className = 'status-item-value success';
        }
        
        if (this.solverStatus) {
            this.solverStatus.textContent = 'Déjà résolu !';
            this.solverStatus.className = 'status-item-value success';
        }
        
        if (this.moveCount) {
            this.moveCount.textContent = '0 coup';
        }
        
        if (this.solutionMoves) {
            this.solutionMoves.innerHTML = '<span style="color: var(--success);">Aucun mouvement nécessaire</span>';
        }
    }

    /**
     * Réinitialise le panneau
     */
    public reset() {
        if (this.cubeState) {
            this.cubeState.textContent = 'Résolu ✓';
            this.cubeState.className = 'status-item-value success';
        }
        
        if (this.solverStatus) {
            this.solverStatus.textContent = 'En attente';
            this.solverStatus.className = 'status-item-value';
        }
        
        if (this.moveCount) {
            this.moveCount.textContent = '0';
        }
        
        if (this.solutionMoves) {
            this.solutionMoves.innerHTML = '<span style="color: var(--text-muted); font-size: 13px;">Aucune solution</span>';
        }
    }
}

// Exporter une instance unique (singleton)
export const statusPanel = new StatusPanel();
