import gameInstance from "./game.js";
import Player from "./player.js";
import Level from "./level.js";
import { hasSubstringInClassList } from "./tools.js";
// Animation Implementation Discussion
// https://chatgpt.com/c/d6c3427f-edfa-4d17-bb39-a9a15b01fda5
// Usage

document.addEventListener('DOMContentLoaded', () => {
    const playerElement = document.getElementById('player');
    gameInstance.setPlayer(new Player(playerElement));
    gameInstance.setLevel(new Level("level-one"));
    gameInstance.start();
    console.log("Use WASD to move, Shift to sprint, and E to interact with objects and 3 for the debug menu.");
});

const teleportCheat = () => {
    console.log("Congrats on being a hackerman! You've unlocked the teleport cheat! Click anywhere on the screen to teleport there. (also sets that as ur respawn point)");
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('screen')) {
            const screen = event.target;
            gameInstance.player.setCheckpoint(event.offsetX, event.offsetY, screen);
            gameInstance.player.respawnAtCheckpoint();
        }
    });
}

window.teleportCheat = teleportCheat;
window.game = gameInstance;
window.player = gameInstance.player;
window.level = gameInstance.level;