import gameInstance from "./game.js";
import { getCollisionOverlap } from "./tools.js";

export default class InteractionBox {
    constructor(player) {
        this.player = player;
        this.element = document.getElementById('interactionBox');
        this.interactables = [];
        this.interacting = false;
    }

    checkIntersectsInteractable() {
        for (let i = 0; i < this.interactables.length; i++) {
            const interactable = this.interactables[i];
            const { top, right, bottom, left } = getCollisionOverlap(this.element.getBoundingClientRect(), interactable.element.getBoundingClientRect())
            if ((top || right || bottom || left) && gameInstance.getKeyState('E') && !this.interacting) {
                this.interacting = true;
                interactable.interact();
            } else if (!gameInstance.getKeyState('E')) {
                this.interacting = false;
            }
        }
    }


}