import { SolidObject } from "./level_objects.js";
import { intersects, isSubset } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(level, element, x, y) {
        this.element = element;
        this.level = level;
        this.x = x;
        this.y = y;
        this.element.classList.add(`screen-${x}-${y}`)
        this.rect = this.element.getBoundingClientRect();
        this.solidObjects = [];
        this.initSolidObjects();
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

    initSolidObjects() {
        const solidObjectElements = this.element.querySelectorAll('.solidObject');
        this.solidObjects = Array.from(solidObjectElements).map(solidObject => new SolidObject(solidObject));

        window.addEventListener('resize', () => {
            this.solidObjects.forEach(solidObject => {
                solidObject.updateRect();
            });
        });
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }

    checkIfPlayerInScreen() {
        if (intersects(gameInstance.player.element.getBoundingClientRect(), this.rect)) {
            this.addAdjacentSolidObjectsToPlayer();
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

    update() {
        this.updateRect();
        this.checkIfPlayerInScreen();
        this.solidObjects.forEach(solidObject => {
            solidObject.update();
        });
    }
}