import { SolidObject, InteractableObject, InteractableToggle, Reciever, LevelObject } from "./levelObjects.js";
import { intersects, isSubset } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(level, element, x, y) {
        this.element = element;
        this.level = level;
        this.x = x;
        this.y = y;
        this.element.classList.add(`screen-${x}-${y}`)
        this.solidObjects = [];
        this.interactableObjects = [];
        this.recievers = [];
        this.initObjects();
        this.initStyles();
    }

    initStyles() {
        this.element.style.position = 'relative';
        if (gameInstance.debug) this.element.style.outline = '1px solid yellow';
        else this.element.style.outline = 'none';
        for (let i = 0; i < this.solidObjects.length; i++) {
            this.solidObjects[i].reinitStyles();
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
            this.solidObjects.push(new SolidObject(objectElement));
        } else if (classList.contains('interactable')) {
            this.interactableObjects.push(this.resolveInteractableObject(objectElement));
        } else if (classList.contains('reciever')) {
            this.recievers.push(new Reciever(objectElement));
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
        }
    }

    addAdjacentSolidObjectsToPlayer() {
        if (!isSubset(this.solidObjects, gameInstance.player.solidObjects)) {
            let solidObjectsToAdd = this.solidObjects;
            if (this.x > 0) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x - 1, this.y).solidObjects);
            }
            if (this.y > 0) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x, this.y - 1).solidObjects);
            }
            if (this.x < this.level.columns - 1) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x + 1, this.y).solidObjects);
            }
            if (this.y < this.level.rows - 1) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x, this.y + 1).solidObjects);
            }
            gameInstance.player.setSolidObjects(solidObjectsToAdd);
        }
    }

    addAdjacentInteractableObjectsToPlayer() {
        let interactableObjectsToAdd = this.interactableObjects;
        gameInstance.player.setInteractableObjects(interactableObjectsToAdd);
    }

    update() {
        this.checkIfPlayerInScreen();
        this.solidObjects.forEach(solidObject => {
            solidObject.update();
        });
        this.interactableObjects.forEach(interactableObject => {
            interactableObject.update();
        });
        this.recievers.forEach(reciever => {
            reciever.update();
        });
    }
}