import gameInstance from "./game.js";
import { getCollisionOverlap } from "./tools.js";

export default class InteractionBox {
    constructor(player) {
        this.player = player;
        this.element = document.getElementById('interactionBox');
        this.interactables = [];
        this.interacting = false;
        this.interactionIndicatorElement = this.player.element.querySelector('.interaction-indicator');
        if (this.interactionIndicatorElement) {
            this.interactionIndicatorElement.style.visibility = 'hidden';
        }
    }

    update() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid #0f9f0f';
            this.element.style.outlineOffset = '-3px';
        }
        else {
            this.element.style.outline = 'none';
        }
        return this.checkIntersectsInteractable();
    }

    checkIntersectsInteractable() {
        let interactions = [];
        let intersects = false;
        for (let i = 0; i < this.interactables.length; i++) {
            if (!this.interactables[i].enabled) continue;
            const interactable = this.interactables[i];
            const { top, right, bottom, left } = getCollisionOverlap(this.element.getBoundingClientRect(), interactable.element.getBoundingClientRect())
            if (top || right || bottom || left) {
                intersects = true;
            }
            if ((top || right || bottom || left) && gameInstance.getKeyState('E') && !this.interacting) {
                interactions.push(interactable);
            } 
        }
        if (interactions.length > 0) {
            this.interacting = true;
            interactions.forEach(interactable => {
                if (!interactable.enabled) return;
                interactable.interact();
            });
        } 
        if (!gameInstance.getKeyState('E') && this.interacting) {
            this.interacting = false;
        }
        if (intersects) {
            this.interactionIndicatorElement.style.visibility = 'visible';
        } else {
            this.interactionIndicatorElement.style.visibility = 'hidden';
        }
    }


}