import Camera from './camera.js';

class Game {
    constructor() {
        this.player = null;
        this.level = null;
        this.camera = new Camera();
        this.keyState = {
            W: false,
            A: false,
            S: false,
            D: false,
            SHIFT: false,
            SPACE: false,
            CONTROL: false,
            ARROWUP: false,
            ARROWDOWN: false,
            ARROWLEFT: false,
            ARROWRIGHT: false,
        };
        this.start();
    }

    getKeyState(key) {
        return this.keyState[key];
    }

    setPlayer(player) {
        this.player = player;
    }
    
    getPlayer() {
        return this.player;
    }
    
    setLevel(level) {
        this.level = level;
    }

    initKeyStateListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.keyState['SHIFT'] && this.keyState['CONTROL']) {
                return;
            }
            event.preventDefault();
            this.keyState[event.key.toUpperCase()] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keyState[event.key.toUpperCase()] = false;
        });
    }

    start() {
        requestAnimationFrame(this.update.bind(this));
        this.initKeyStateListeners();
    }

    update() {
        this.player.update(this.keyState);
        this.level.update();
        this.camera.update();

        requestAnimationFrame(this.update.bind(this));
    }

}

const gameInstance = new Game();
export default gameInstance;