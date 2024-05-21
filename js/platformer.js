// https://chatgpt.com/c/28b14350-009c-47a1-9b81-91d1849af58a
// TODO: Fork this repo into one dedicated to it instead of the darkness maze
import gameInstance from "./game.js";
import Player from "./player.js";
import Level from "./level.js";
// Animation Implementation Discussion
// https://chatgpt.com/c/d6c3427f-edfa-4d17-bb39-a9a15b01fda5
// Usage
const playerElement = document.getElementById('player');
gameInstance.setPlayer(new Player(playerElement));
gameInstance.setLevel(new Level("level-one"));
