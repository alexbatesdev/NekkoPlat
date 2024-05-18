import { Wall } from "./level_objects.js";
import { intersects } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(element) {
        this.element = element;
        this.rect = this.element.getBoundingClientRect();
        this.walls = [];
        this.initWalls();
        if (this.element.classList.contains('dynamic')) {
            this.initScreensDynamicWindowSize();
        } else if (this.element.classList.contains('static')) {
            this.initScreensInitialWindowSize();
        }
    }

    initScreensInitialWindowSize() {
        document.documentElement.style.setProperty('--screen-width', window.innerWidth + 'px');
        document.documentElement.style.setProperty('--screen-height', window.innerHeight + 'px');
    }

    initScreensDynamicWindowSize() {
        this.initScreensInitialWindowSize();
        window.addEventListener('resize', () => {
            document.documentElement.style.setProperty('--screen-width', window.innerWidth + 'px');
            document.documentElement.style.setProperty('--screen-height', window.innerHeight + 'px');
        });
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