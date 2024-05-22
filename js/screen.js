import { SoldObject } from "./level_objects.js";
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
        this.soldObjects = [];
        this.initSoldObjects();
        this.initStyles();
    }

    initStyles() {
        this.element.style.position = 'relative';
        if (gameInstance.debug) this.element.style.outline = '1px solid yellow';
        else this.element.style.outline = 'none';
        for (let i = 0; i < this.soldObjects.length; i++) {
            this.soldObjects[i].reinitStyles();
        }
    }

    initSoldObjects() {
        const soldObjectElements = this.element.querySelectorAll('.soldObject');
        this.soldObjects = Array.from(soldObjectElements).map(soldObject => new SoldObject(soldObject));

        window.addEventListener('resize', () => {
            this.soldObjects.forEach(soldObject => {
                soldObject.updateRect();
            });
        });
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }

    checkIfPlayerInScreen() {
        if (intersects(gameInstance.player.element.getBoundingClientRect(), this.rect)) {
            this.addAdjacentSoldObjectsToPlayer();
        }
    }

    addAdjacentSoldObjectsToPlayer() {
        if (!isSubset(this.soldObjects, gameInstance.player.soldObjects)) {
            let soldObjectsToAdd = this.soldObjects;
            if (this.x > 0) {
                soldObjectsToAdd = soldObjectsToAdd.concat(this.level.getScreen(this.x - 1, this.y).soldObjects);
            } 
            if (this.y > 0) {
                soldObjectsToAdd = soldObjectsToAdd.concat(this.level.getScreen(this.x, this.y - 1).soldObjects);
            } 
            if (this.x < this.level.columns - 1) {
                soldObjectsToAdd = soldObjectsToAdd.concat(this.level.getScreen(this.x + 1, this.y).soldObjects);
            } 
            if (this.y < this.level.rows - 1) { 
                soldObjectsToAdd = soldObjectsToAdd.concat(this.level.getScreen(this.x, this.y + 1).soldObjects);
            }
            gameInstance.player.setSoldObjects(soldObjectsToAdd);
        }
    }

    update() {
        this.updateRect();
        this.checkIfPlayerInScreen();
        this.soldObjects.forEach(soldObject => {
            soldObject.update();
        });
    }
}