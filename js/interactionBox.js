import gameInstance from "./game.js";
import { getCollisionOverlap } from "./tools.js";

export default class InteractionBox {
    constructor(player) {
        this.player = player;
        this.element = document.getElementById('interactionBox');
        this.interactables = [];
    }

    checkIntersectsInteractable() {
        for (let i = 0; i < this.interactables.length; i++) {
            const interactable = this.interactables[i];
            const { top, right, bottom, left } = getCollisionOverlap(this.element.getBoundingClientRect(), interactable.element.getBoundingClientRect())
            console.log(top, right, bottom, left);
            if ((top || right || bottom || left) && gameInstance.getKeyState('E')) {
                interactable.interact();
            }
        }
    }


}
    // Figuring out how to handle interactable objects
export class Interactable {
    constructor(element) {
        this.element = element;
        this.active = false;
        this.enabled = true;
    }

    interact() {
        console.log('Interacted with', this.element);
        this.element.click();
    }
}