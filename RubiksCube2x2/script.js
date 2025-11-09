document.addEventListener('DOMContentLoaded', () => {
    const scrambleBtn = document.getElementById('scramble-btn');
    const solveBtn = document.getElementById('solve-btn');
    const cubePlaceholder = document.querySelector('.cube-placeholder');

    if (scrambleBtn) {
        scrambleBtn.addEventListener('click', () => {
            console.log('Bouton "Mélanger" cliqué.');
            cubePlaceholder.style.transition = 'transform 0.5s ease';
            cubePlaceholder.style.transform = `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)`;
            // Ici, logique de mélange du cube.
        });
    }

    if (solveBtn) {
        solveBtn.addEventListener('click', () => {
            console.log('Bouton "Résoudre" cliqué.');
            cubePlaceholder.style.transition = 'transform 0.5s ease';
            cubePlaceholder.style.transform = 'rotateX(0deg) rotateY(0deg)';
            // Ici, logique de résolution.
        });
    }

    console.log('Interface du solveur de Rubik\'s Cube initialisée.');
    console.log('En attente de l\'implémentation de la logique du cube 2x2.');
});