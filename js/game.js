import Camera, { Filter } from './camera.js';
import BroadcastManager from './broadcastManager.js';
import InputManager from './inputManager.js';

class Game {
    constructor() {
        this.player = null;
        this.level = null;
        this.camera = new Camera();
        this.pauseElement = document.getElementById('pause');
        if (this.pauseElement) {
            this.camera.overlayElement.appendChild(this.pauseElement);
            this.initPauseElement();
        }

        this.debug = false;
        this.paused = false;
        this.processedInput = false;

        this.inputManager = new InputManager();
        this.signalManager = new BroadcastManager();

        window.game = this;
    }

    initPauseElement() {
        this.pauseElement.style.position = 'absolute';
        this.pauseElement.style.top = 0;
        this.pauseElement.style.left = 0;
        this.pauseElement.style.width = '100%';
        this.pauseElement.style.height = '100%';
        this.pauseElement.style.zIndex = 5;
        this.pauseElement.style.visibility = 'hidden';
        this.pauseElement.style.pointerEvents = 'none';

        const filters = this.pauseElement.querySelectorAll('.filter');
        filters.forEach(filter => {
            new Filter(filter);
            this.pauseElement.appendChild(filter);
        });
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

    start() {
        requestAnimationFrame(this.update.bind(this));
        this.player.start();
    }

    update() {
        this.processInput();
        if (!this.paused) {
            this.player.update();
            this.level.update();
            this.camera.update();
        }

        requestAnimationFrame(this.update.bind(this));
    }

    processInput() {
        if (this.inputManager.isKeyActive('Digit3') && !this.processedInput) {
            this.processedInput = true;
            this.toggleDebug();
        } else if (this.inputManager.isKeyActive('Escape') && !this.processedInput) {
            this.processedInput = true;
            if (this.pauseElement) this.togglePause();
        } else if (!this.inputManager.isKeyActive('Escape') && !this.inputManager.isKeyActive('Digit3')) {
            this.processedInput = false;
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.pauseElement.style.visibility = 'visible';
            this.pauseElement.style.pointerEvents = 'all';
        } else {
            this.pauseElement.style.visibility = 'hidden';
            this.pauseElement.style.pointerEvents = 'none';
        }
    }

    toggleDebug() {
        this.debug = !this.debug;
        if (this.debug) {
            document.documentElement.style.setProperty('--debug', 'visible');
        } else {
            document.documentElement.style.setProperty('--debug', 'hidden');
        }
        this.level.reinitStyles();
    }
}

const gameInstance = new Game();
export default gameInstance;

window.onload = () => {
    document.addEventListener('click', (event) => {
        if (gameInstance.debug) {
            console.log(event.target)
        }
    });
}