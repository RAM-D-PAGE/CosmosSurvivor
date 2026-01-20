import { Game } from './core/Game.js';

// Bootrapper
window.addEventListener('load', () => {
    const game = new Game();
    game.start();

    // Expose game to window for debugging if needed
    window.game = game;
});
