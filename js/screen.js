import { Wall } from "./level_objects.js";
import { intersects } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(element) {
        this.element = element;
        this.rect = this.element.getBoundingClientRect();
        this.walls = [];
        this.initWalls();
        this.initStyles();
    }

    initStyles() {
        this.element.style.position = 'relative';
        if (gameInstance.debug) this.element.style.outline = '1px solid yellow';
        else this.element.style.outline = 'none';
        for (let i = 0; i < this.walls.length; i++) {
            this.walls[i].reinitStyles();
        }
    }

    initWalls() {
        const wallElements = document.querySelectorAll('.wall');
        this.walls = Array.from(wallElements).map(wall => new Wall(wall));

        window.addEventListener('resize', () => {
            this.walls.forEach(wall => {
                wall.updateRect();
            });
        });
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }

    checkIfPlayerInScreen() {
        if (intersects(gameInstance.player.element.getBoundingClientRect(), this.rect)) {
            if (gameInstance.player.walls !== this.walls) gameInstance.player.setWalls(this.walls);
        }
    }

    update() {
        this.updateRect();
        this.checkIfPlayerInScreen();
        this.walls.forEach(wall => {
            wall.update();
        });
    }
}