import gameInstance from './game.js';

export class Wall {
    constructor(element) {
        this.element = element;
        this.rect = this.element.getBoundingClientRect();
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }

    update() {
        this.updateRect();
    }

    reinitStyles() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid red';
            this.element.style.outlineOffset = '-3px';
        } else {
            this.element.style.outline = 'none';
        }
    }
}


// Moving platform - a type of wall that moves
// Easy example of extending a class
// Features:
// - Move between two points
// - Carry player


// Sign - an interactable object that displays a message
// Features:
// - Display on interaction
// - Display on player overlap
// - Pause game on interaction-display


// Door - an interactable object that changes player location
// Features:
// - Teleport player on interaction
//   - Teleport to coordinates
//   - Teleport to linked door? (optional)
// - Change level on interaction


// Hazard - an object that teleports player to a checkpoint on collision
// This is because the player can't die
// Features:
// - Teleport player on collision
//   - Teleport to coordinates
//   - Teleport to checkpoint? (optional)
// - Display a message on collision (optional)


// Box - an object that can be pushed by the player
// https://chatgpt.com/c/81b5a9bb-778d-4388-8d13-b3ebd16a8895
// ChatGPT answer is probably wrong but on the right track
// Features:
// - Can rotate based on physics calculations
// - Can be pushed by player
// - Stops on collision with wall
// - Pushes other boxes
// - Pushes player
// - Pushes other objects
// - Falls off ledges
// - Can be pulled by player (maybe)
// - Can be picked up by player (maybe)
// - Can be thrown by player (maybe)