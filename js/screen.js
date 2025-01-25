import { SolidObject, InteractableObject, InteractableToggle, Reciever, LevelObject, TriggerArea } from "./levelObjects.js";
import { debugLog, intersects, isSubset } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(level, element, x, y) {
        this.element = element;
        this.level = level;
        this.x = x;
        this.y = y;
        this.element.classList.add(`screen-${x}-${y}`)
        this.collisionObjects = [];
        this.interactableObjects = [];
        this.recievers = [];
        this.initObjects();
        this.initStyles();
    }

    initStyles() {
        this.element.style.position = 'relative';
        if (gameInstance.debug) this.element.style.outline = '1px solid yellow';
        else this.element.style.outline = 'none';
        for (let i = 0; i < this.collisionObjects.length; i++) {
            this.collisionObjects[i].reinitStyles();
        }
    }

    initObjects() {
        // Merge this with solid objects and interactable objects
        const objectElements = this.element.querySelectorAll('.object');
        Array.from(objectElements).map(objectElement => {
            this.resolveObject(objectElement);
        });
    }

    resolveObject(objectElement) {
        const classList = objectElement.classList;
        if (classList.contains('solid')) {
            this.collisionObjects.push(new SolidObject(objectElement));
        } else if (classList.contains('interactable')) {
            this.interactableObjects.push(this.resolveInteractableObject(objectElement));
        } else if (classList.contains('reciever')) {
            this.recievers.push(new Reciever(objectElement));
        } else if (classList.contains('trigger')) {
            this.collisionObjects.push(new TriggerArea(objectElement));
        }
    }

    resolveInteractableObject(interactableElement) {
        const classList = interactableElement.classList;
        if (classList.contains('toggle')) {
            return new InteractableToggle(interactableElement);
        } else {
            return new InteractableObject(interactableElement);
        }
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
        if (!isSubset(this.collisionObjects, gameInstance.player.collisionObjects)) {
            let solidObjectsToAdd = this.collisionObjects;
            if (this.x > 0) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x - 1, this.y).collisionObjects);
            }
            if (this.y > 0) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x, this.y - 1).collisionObjects);
            }
            if (this.x < this.level.columns - 1) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x + 1, this.y).collisionObjects);
            }
            if (this.y < this.level.rows - 1) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x, this.y + 1).collisionObjects);
            }
            gameInstance.player.setSolidObjects(solidObjectsToAdd);
        }
    }

    addAdjacentInteractableObjectsToPlayer() {
        let interactableObjectsToAdd = this.interactableObjects;
        debugLog(interactableObjectsToAdd);
        gameInstance.player.setInteractableObjects(interactableObjectsToAdd);
    }

    update() {
        if (this.checkIfPlayerInScreen()) {
            this.interactableObjects.forEach(interactableObject => {
                interactableObject.update();
            });
            this.recievers.forEach(reciever => {
                reciever.update();
            });
        }
    }
}