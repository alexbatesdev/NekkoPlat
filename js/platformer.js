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
    console.log("Just by opening the Inspect Element you distinguished yourself as cool, and you found the teleport cheat??? Coolest person on the planet!")
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('screen')) {
            const screen = event.target;
            gameInstance.player.respawn(event.offsetX, event.offsetY, screen);
        }
    });
}

window.teleportCheat = teleportCheat;
window.game = gameInstance;
window.player = gameInstance.player;
window.level = gameInstance.level;