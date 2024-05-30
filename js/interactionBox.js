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
        let interactions = [];
        for (let i = 0; i < this.interactables.length; i++) {
            const interactable = this.interactables[i];
            const { top, right, bottom, left } = getCollisionOverlap(this.element.getBoundingClientRect(), interactable.element.getBoundingClientRect())
            if ((top || right || bottom || left) && gameInstance.getKeyState('E') && !this.interacting) {
                interactions.push(interactable);
            } 
        }
        if (interactions.length > 0) {
            this.interacting = true;
            interactions.forEach(interactable => {
                interactable.interact();
            });
        } 
        if (!gameInstance.getKeyState('E') && this.interacting) {
            this.interacting = false;
        }
    }


}