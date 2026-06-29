import Camera, { Filter } from './camera.js';
import BroadcastManager from './broadcastManager.js';
import InputManager from './inputManager.js';
import ProgressState from './ProgressState.js';

class Game {
    constructor() {
        this.player = null;
        this.level = null;
        this.camera = null;
        this.pauseElement = null;

        this.debug = false;
        this.paused = false;
        this.processedInput = false;

        const defaultBindings = {
            debug: ['Digit3'],
            pause: ['Escape'],
            moveLeft: ['KeyA'],
            moveRight: ['KeyD'],
            moveDown: ['KeyS'],
            jump: ['KeyW', 'Space'],
            respawn: ['KeyR'],
            sprint: ['ShiftLeft', 'ShiftRight'],
            interact: ['KeyE'],
            cameraUp: ['ArrowUp'],
            cameraDown: ['ArrowDown'],
            cameraLeft: ['ArrowLeft'],
            cameraRight: ['ArrowRight'],
        };

        this.inputManager = new InputManager(defaultBindings);
        this.signalManager = new BroadcastManager();
        this.progressState = new ProgressState();

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

    initKeyStateListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.keyState['SHIFT'] && this.keyState['CONTROL']) {
                return;
            }
            event.preventDefault();
            let key = event.key.toUpperCase();
            if (event.key == " ") key = "SPACE";
            debugLog(key);
            this.keyState[key] = true;
        });

        document.addEventListener('keyup', (event) => {
            let key = event.key.toUpperCase();
            if (event.key == " ") key = "SPACE";
            this.keyState[key] = false;
        });
    }

    initCamera() {
        this.camera = new Camera();
        this.camera.setPlayer(this.player);
        this.camera.keyState = this.keyState;
    }

    initPauseScreen() {
        this.pauseElement = document.getElementById('pause');
        if (this.pauseElement) {
            this.camera.overlayElement.appendChild(this.pauseElement);
            this.initPauseElement();
        }
    }

    start() {
        this.initCamera();
        this.initPauseScreen();
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.fixedDelta = 1 / 60; // 60 FPS simulation step
        requestAnimationFrame(this.update.bind(this));
        this.player.start();
    }

    update(timestamp) {
        const now = timestamp || performance.now();
        let frameTime = (now - this.lastTime) / 1000; // convert to seconds
        if (frameTime > 0.25) frameTime = 0.25; // avoid spiral of death
        this.lastTime = now;
        this.accumulator += frameTime;

        while (this.accumulator >= this.fixedDelta) {
            this.processInput();
            if (!this.paused) {
                this.player.update();
                this.level.update();
                this.camera.update();
            }
            this.accumulator -= this.fixedDelta;
        }

        requestAnimationFrame(this.update.bind(this));
    }

    processInput() {
        if (this.inputManager.isActionActive('debug') && !this.processedInput) {
            this.processedInput = true;
            this.toggleDebug();
        } else if (this.inputManager.isActionActive('pause') && !this.processedInput) {
            this.processedInput = true;
            if (this.pauseElement) this.togglePause();
        } else if (
            !this.inputManager.isActionActive('pause') &&
            !this.inputManager.isActionActive('debug')
        ) {
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