import gameInstance from './game.js';
import { debugLog } from './tools.js';
import ToggleManager, { MultiStateManager } from './elementStateManagers.js';

export class LevelObject {
    constructor(element) {
        this.element = element;
        this.enabled = true;
        if (this.element.classList.contains('disabled')) {
            this.enabled = false;
            this.element.style.opacity = '0.5';
        }
    }

    update() {

    }
}
export class SolidObject extends LevelObject{
    constructor(element) {
        super(element);
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

export class TriggerArea extends LevelObject {
    constructor(element) {
        super(element);
        this.element.style.pointerEvents = 'none';
        if (this.element.classList.contains('disabled')) {
            this.enabled = false;
        }
    }

    trigger() {
        if (!this.enabled) return;
        if (this.element.classList.contains('once')) {
            this.enabled = false;
            this.element.classList.add('disabled');
        }
        debugLog('Triggered');
        this.element.click();
    }

    reinitStyles() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid plum';
            this.element.style.outlineOffset = '-3px';
        } else {
            this.element.style.outline = 'none';
        }
    }
}

export class InteractableObject extends LevelObject {
    constructor(element) {
        super(element);
        if (this.element.classList.contains('clickable')) {
            this.element.addEventListener('pointerup', () => {
                this.interact();
            });
            this.element.style.cursor = 'pointer';
        } else {
            this.element.style.pointerEvents = 'none';
        }
    }

    interact() {
        if (!this.enabled) return;
        debugLog('Interacted');
        debugLog(this.element);
        this.element.click();
    }

    update() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid blue';
        } else {
            this.element.style.outline = 'none';
        }
    }
}

export class InteractableToggle extends InteractableObject {
    constructor(element) {
        super(element);
        this.stateManager = new ToggleManager(element);
    }

    interact() {
        if (!this.enabled) return;
        this.stateManager.toggle();
    }
}

export class Reciever extends LevelObject{
    constructor(element) {
        super(element);
        this.signals = [];
         //Array.from(this.element.querySelectorAll('.signal')).map(signal => signal.classList[1]);
        Array.from(this.element.children).forEach(child => {
            child.classList.forEach(className => {
                if (className.includes('signal-')) {
                    this.signals.push(className.split('-')[1]);
                }
            });
        });
        this.broadcastChannel = "";
        this.element.querySelectorAll('.broadcast').forEach(element => {
            element.style.display = 'none';
            element.classList.forEach(className => {
                if (className.includes('channel-')) {
                    this.broadcastChannel = className.split('-')[1];
                }
            })
        });
        this.stateManager = new MultiStateManager(element, this.signals, this.signals[0]);
    }

    update() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid purple';
        } else {
            this.element.style.outline = 'none';
        }
        this.stateManager.syncStateToBroadcast(this.broadcastChannel);
    }

}

// USE THIS AS A BASE FOR OTHER INTERACTABLE OBJECTS
// Effect Area - an object that does something when the player enters it
// Features:
// - Run javascript code on player overlap
// - Run javascript code on player interaction
// Interactable Toggle - an object that toggles between two states on interaction
// Features:
// - Toggle between two states on interaction
// - Trigger other objects on toggle
// Interactable Button - an object that triggers other objects on interaction
// Features:
// - Trigger other objects on interaction

// Floor - a solid object that the player can stand on
// Features:
// - Automatically places itself at the bottom of the screen

// One Way SolidObject - a solidObject that can be passed through in one direction
// Features:
// - Can be passed through in one direction
// - Can't be passed through in the other direction
// - Vertical or horizontal orientation


// Moving platform - a type of solidObject that moves
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
// Instead of making a "door" object, 
// I just made an interactable that changes player location with the onclick event
// Less code, more flexibility, same result, I daresay more elegant
// Features:
// - Teleport player on interaction
//   - Teleport to coordinates
//   - Teleport to linked door? (optional)
// - Change level on interaction


// Hazard - an object that teleports player to a checkpoint on collision
// This should just be an effect area that teleports the player with the onclick
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
// - Stops on collision with solidObject
// - Pushes other boxes
// - Pushes player
// - Pushes other objects
// - Falls off ledges
// - Can be pulled by player (maybe)
// - Can be picked up by player (maybe)
// - Can be thrown by player (maybe)


// Classic Mario Block - an object that changes state on collision
// Features:
// - Change state on collision
// - Choose direction impact is needed for state change