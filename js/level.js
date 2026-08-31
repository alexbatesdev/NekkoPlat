import Screen from './screen.js';
import LevelParallaxLayer from './levelParallax.js';

export default class Level {
    constructor(element_id) {
        this.element = null;
        if (element_id) {
            this.element = document.getElementById(element_id);
        } else {
            let temp_element = document.getElementsByClassName('level')[0]
            if (temp_element) {
                this.element = temp_element;
            } else {
                console.error("No level element found in the document");
                return;
            }
        }
        this.rows = 1;
        this.columns = 1;
        this.screens = [];
        this.parallaxLayers = [];
        this.parallaxRoot = null;
        this.initScreenGrid();
        this.initParallaxRoot();
        this.initScreens();
        this.initParallaxLayers();
        this.checkScreenCount();
        if (this.element.classList.contains('dynamic')) {
            this.initScreensDynamicWindowSize();
        } else if (this.element.classList.contains('initial')) {
            this.initScreensInitialWindowSize();
        }
        this.outOfBoundEffect = {
            top: null,
            right: null,
            bottom: null,
            left: null
        };
        this.initOutOfBoundEffects();
    }

    initOutOfBoundEffects() {
        const validEffects = ['contain', 'respawn', 'wrap'];
        this.element.classList.forEach(className => {
            validEffects.forEach(effect => {
                if (className.includes(effect)) {
                    if (className.includes("-")) {
                        if (className.split("-")[1] == "vert") {
                            this.outOfBoundEffect.top = effect;
                            this.outOfBoundEffect.bottom = effect;
                        } else if (className.split("-")[1] == "hori") {
                            this.outOfBoundEffect.left = effect;
                            this.outOfBoundEffect.right = effect;
                        } else {
                            this.outOfBoundEffect[className.split("-")[1]] = effect;
                        }
                    } else {
                        this.outOfBoundEffect.top = effect;
                        this.outOfBoundEffect.right = effect;
                        this.outOfBoundEffect.bottom = effect;
                        this.outOfBoundEffect.left = effect;
                    }
                }
            });
        });
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

    checkScreenCount() {
        if (this.screens.length > this.columns * this.rows) {
            console.error("Screen count exceeds grid dimensions");
        } else if (this.screens.length < this.columns * this.rows) {
            console.warn("Screen count is less than grid dimensions, some grid cells will be empty");
        }
    }

    initScreenGrid() {
        const gridClass = Array.from(this.element.classList).find(className => /^grid-\d+x\d+$/.test(className));

        if (gridClass) {
            const match = gridClass.match(/^grid-(\d+)x(\d+)$/);
            if (match) {
                this.columns = parseInt(match[1], 10);
                this.rows = parseInt(match[2], 10);
                this.element.style.display = 'grid';
                this.element.style.position = 'relative';
                this.element.style.gridTemplateColumns = `repeat(${this.columns}, var(--screen-width))`;
                this.element.style.gridTemplateRows = `repeat(${this.rows}, var(--screen-height))`;
                this.element.style.width = "max-content";
                return;
            } else {
                console.warn(`Invalid grid class "${gridClass}"`);
            }
        }

        console.warn("No grid dimensions specified, using linear grid layout");
        this.element.style.gridTemplateColumns = `repeat(${this.screens.length}, var(--screen-width))`;
        this.element.style.gridTemplateRows = `var(--screen-height)`;
    }

    initScreens() {
        // Grab all of the screen elements
        const screenElements = this.element.querySelectorAll(':scope > .screen');
        let index = 0;
        this.screens = Array.from(screenElements).map(screen => {
            let column = index % this.columns;
            let row = Math.floor(index / this.columns);
            index++;
            return new Screen(this, screen, column, row)
        });
    }

    initParallaxRoot() {
        this.parallaxRoot = Array.from(this.element.children).find(child => child.classList?.contains('level-parallax-root'));
        if (!this.parallaxRoot) {
            this.parallaxRoot = document.createElement('div');
            this.parallaxRoot.className = 'level-parallax-root';
            this.element.prepend(this.parallaxRoot);
        }
    }

    initParallaxLayers() {
        const directChildLayers = Array.from(this.element.children)
            .filter(child => child !== this.parallaxRoot && child.classList?.contains('parallax-layer'));

        directChildLayers.forEach(layer => {
            this.parallaxRoot.appendChild(layer);
        });

        const layerElements = Array.from(this.parallaxRoot.children)
            .filter(child => child.classList?.contains('parallax-layer'));

        this.parallaxLayers = layerElements.map(layer => new LevelParallaxLayer(layer));
    }

    reinitStyles() {
        this.screens.forEach(screen => {
            screen.initStyles();
        });
    }

    update() {
        this.screens.forEach(screen => {
            screen.update();
        });
    }

    updateParallaxLayers(cameraElement) {
        if (!cameraElement || this.parallaxLayers.length === 0) return;

        this.parallaxLayers.forEach(layer => {
            layer.update(cameraElement.scrollLeft, cameraElement.scrollTop);
        });
    }

    getScreen(x, y) {
        return this.screens.find(screen => screen.x === x && screen.y === y);
    }
}