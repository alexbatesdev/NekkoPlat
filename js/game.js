import Camera from './camera.js';

class Game {
    constructor() {
        this.player = null;
        this.level = null;
        this.camera = new Camera();
        this.paused = false;
        this.processedInput = false;
        this.debug = false;
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
            ESCAPE: false
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
            this.debugLog(event.key.toUpperCase());
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
        this.processInput();
        if (!this.paused) {
            this.player.update(this.keyState);
            this.level.update();
            this.camera.update();
        }


        requestAnimationFrame(this.update.bind(this));
    }

    processInput() {
        if (this.keyState['3'] && !this.processedInput) {
            this.processedInput = true;
            this.toggleDebug();
        } else if (this.keyState['ESCAPE'] && !this.processedInput) {
            this.processedInput = true;
            this.togglePause();
        } else if (!this.keyState['ESCAPE'] && !this.keyState['3']){
            this.processedInput = false;
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.camera.addFilter('blur');
            this.camera.addFilter('dark');
        } else {
            this.camera.setFilter(null);
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

    debugLog(message) {
        if (this.debug) {
            console.log(message);
        }
    }

}

const gameInstance = new Game();
export default gameInstance;