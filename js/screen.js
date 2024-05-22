import { Wall } from "./level_objects.js";
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
        const wallElements = this.element.querySelectorAll('.wall');
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
            this.addAdjacentWallsToPlayer();
        }
    }

    addAdjacentWallsToPlayer() {
        if (!isSubset(this.walls, gameInstance.player.walls)) {
            let wallsToAdd = this.walls;
            if (this.x > 0) {
                wallsToAdd = wallsToAdd.concat(this.level.getScreen(this.x - 1, this.y).walls);
            } 
            if (this.y > 0) {
                wallsToAdd = wallsToAdd.concat(this.level.getScreen(this.x, this.y - 1).walls);
            } 
            if (this.x < this.level.columns - 1) {
                wallsToAdd = wallsToAdd.concat(this.level.getScreen(this.x + 1, this.y).walls);
            } 
            if (this.y < this.level.rows - 1) { 
                wallsToAdd = wallsToAdd.concat(this.level.getScreen(this.x, this.y + 1).walls);
            }
            gameInstance.player.setWalls(wallsToAdd);
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