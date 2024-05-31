import { SolidObject, InteractableObject, InteractableToggle, Reciever } from "./levelObjects.js";
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
        // Merge inits into just one function
        // initObjects -> iterates over all objects, and initializes them (this includes putting them into these separate lists)
        this.initSolidObjects();
        this.interactableObjects = [];
        this.initInteractableObjects();
        this.recievers = [];
        this.initPassiveObjects();
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

    initInteractableObjects() {
        // Merge this with solid objects and passive objects
        const interactableElements = this.element.querySelectorAll('.interactable');
        this.interactableObjects = Array.from(interactableElements).map(interactableElement => {
            return this.resolveInteractableObject(interactableElement);
        });
    }

    resolveInteractableObject(interactableElement) {
        const classList = interactableElement.classList;
        if (classList.contains('toggle')) {
            return new InteractableToggle(interactableElement);
        } else {
            return new InteractableObject(interactableElement);
        }
    }

    initSolidObjects() {
        // Merge this with interactable objects and passive objects
        const solidObjectElements = this.element.querySelectorAll('.solid');
        this.solidObjects = Array.from(solidObjectElements).map(solidObject => new SolidObject(solidObject));
    }

    initPassiveObjects() {
        // Merge this with interactable objects and solid objects
        const recievers = this.element.querySelectorAll('.reciever');
        this.recievers = Array.from(recievers).map(reciever => {
            return new Reciever(reciever);
        });
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