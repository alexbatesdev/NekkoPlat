import gameInstance from "./game.js";
import { getCollisionOverlap } from "./tools.js";

export default class InteractionBox {
    constructor(player) {
        this.player = player;
        this.element = document.getElementById('interactionBox');
        this.initialWidth = this.element.offsetWidth;
        this.initialHeight = this.element.offsetHeight;
        this.interactables = [];
        this.interacting = false;
        this.interactionIndicatorElement = this.player.element.querySelector('.interaction-indicator');
        if (this.interactionIndicatorElement) {
            this.interactionIndicatorElement.style.display = 'none';
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
        this.keepInLevelBounds();
        return this.checkIntersectsInteractable();
    }
    keepInLevelBounds() {
        const level = document.getElementsByClassName('level')[0];
        if (level) {
            const boxRect = this.element.getBoundingClientRect();
            const levelRect = level.getBoundingClientRect();

            // Calculate overflow on each side
            const overflowLeft = Math.max(0, levelRect.left - boxRect.left);
            const overflowRight = Math.max(0, boxRect.right - levelRect.right);
            const overflowTop = Math.max(0, levelRect.top - boxRect.top);
            const overflowBottom = Math.max(0, boxRect.bottom - levelRect.bottom);

            // Adjust width and height if overflowing
            let newWidth = boxRect.width - overflowLeft - overflowRight;
            let newHeight = boxRect.height - overflowTop - overflowBottom;

            // Only shrink if necessary, otherwise probe 1px outwards before resetting
            if (overflowLeft > 0 || overflowRight > 0) {
                this.element.style.width = Math.max(0, newWidth) + "px";
            } else {
                // Probe 1px wider to see if it would overflow
                const probeWidth = this.initialWidth + 1;
                const probeRect = {
                    left: boxRect.left,
                    right: boxRect.left + probeWidth
                };
                const wouldOverflow = (probeRect.left < levelRect.left) || (probeRect.right > levelRect.right);
                if (!wouldOverflow) {
                    this.element.style.width = this.initialWidth + "px";
                }
                // If it would overflow, keep current width
            }
            if (overflowTop > 0 || overflowBottom > 0) {
                this.element.style.height = Math.max(0, newHeight) + "px";
            } else {
                // Probe 1px taller to see if it would overflow
                const probeHeight = this.initialHeight + 1;
                const probeRect = {
                    top: boxRect.top,
                    bottom: boxRect.top + probeHeight
                };
                const wouldOverflow = (probeRect.top < levelRect.top) || (probeRect.bottom > levelRect.bottom);
                if (!wouldOverflow) {
                    this.element.style.height = this.initialHeight + "px";
                }
                // If it would overflow, keep current height
            }
        }
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
        if (!this.interactionIndicatorElement) {
            return;
        }
        if (intersects) {
            this.interactionIndicatorElement.style.display = 'block';
        } else {
            this.interactionIndicatorElement.style.display = 'none';
        }
    }

    getOutOfBoundsOffset() {
        const level = document.getElementsByClassName('level')[0];
        if (!level) return {left: 0, right: 0, top: 0, bottom: 0};
        const boxRect = this.element.getBoundingClientRect();
        const viewportRect = level.getBoundingClientRect();

        return {
            left: Math.max(0, viewportRect.left - boxRect.left),
            right: Math.max(0, boxRect.right - viewportRect.right),
            top: Math.max(0, viewportRect.top - boxRect.top),
            bottom: Math.max(0, boxRect.bottom - viewportRect.bottom)
        };
    }

}