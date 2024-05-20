import { Wall } from "./level_objects.js";
import { intersects } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(element) {
        this.element = element;
        this.initStyles();
        this.rect = this.element.getBoundingClientRect();
        this.walls = [];
        this.initWalls();

    }

    initStyles() {
        this.element.style.position = 'relative';
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