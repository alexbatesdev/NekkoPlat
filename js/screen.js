import { createObject } from "./objectFactory.js";
import { debugLog, intersects, isSubset } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(level, element, x, y) {
        this.element = element;
        this.level = level;
        this.x = x;
        this.y = y;
        this.element.classList.add(`screen-${x}-${y}`)
        this.objects = [];
        this.initObjects();
        this.initStyles();
    }

    initStyles() {
        this.element.style.position = 'relative';
        if (gameInstance.debug) this.element.style.outline = '1px solid yellow';
        else this.element.style.outline = 'none';
        this.getObjectsByTypes('solid', 'trigger').forEach(obj => {
            obj.reinitStyles();
        });
    }

    initObjects() {
        // Merge this with solid objects and interactable objects
        const objectElements = this.element.querySelectorAll('.object');
        Array.from(objectElements).map(objectElement => {
            this.resolveObject(objectElement);
        });
    }

    resolveObject(objectElement) {
        const result = createObject(objectElement);
        if (result) {
            this.objects.push(result);
        }
    }

    getObjectsByTypes(...types) {
        return this.objects
            .filter(obj => types.some(type => obj.types.includes(type)))
            .map(obj => obj.instance);
    }

    checkIfPlayerInScreen() {
        if (intersects(gameInstance.player.element.getBoundingClientRect(), this.element.getBoundingClientRect())) {
            this.addAdjacentSolidObjectsToPlayer();
            this.addAdjacentInteractableObjectsToPlayer();
            return true;
        } else {
            return false;
        }
    }

    addAdjacentSolidObjectsToPlayer() {
        const currentCollisionObjects = this.getObjectsByTypes('solid', 'trigger');
        if (!isSubset(currentCollisionObjects, gameInstance.player.collisionObjects)) {
            let solidObjectsToAdd = [...currentCollisionObjects];
            const adjacentScreens = [
                this.level.getScreen(this.x - 1, this.y),
                this.level.getScreen(this.x + 1, this.y),
                this.level.getScreen(this.x, this.y - 1),
                this.level.getScreen(this.x, this.y + 1)
            ];
            adjacentScreens.forEach(adjScreen => {
                if (adjScreen) {
                    solidObjectsToAdd = solidObjectsToAdd.concat(adjScreen.getObjectsByTypes('solid', 'trigger'));
                }
            });
            gameInstance.player.setSolidObjects(solidObjectsToAdd);
        }
    }

    addAdjacentInteractableObjectsToPlayer() {
        let interactableObjectsToAdd = this.getObjectsByTypes('interactable', 'interactable-toggle');
        gameInstance.player.setInteractableObjects(interactableObjectsToAdd);
    }

    update() {
        if (this.checkIfPlayerInScreen()) {
            this.getObjectsByTypes('interactable', 'interactable-toggle').forEach(interactableObject => {
                interactableObject.update();
            });
            this.getObjectsByTypes('receiver').forEach(receiver => {
                receiver.update();
            });
            this.getObjectsByTypes('solid').forEach(solid => {
                if (typeof solid.update === 'function') solid.update();
            });
        }
        this.getObjectsByTypes('plax').forEach(parallaxObject => {
            parallaxObject.update();
        });
    }
}