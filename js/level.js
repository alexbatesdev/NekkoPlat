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
        if (this.element.classList.contains('dynamic')) {
            this.initScreensDynamicWindowSize();
        } else if (this.element.classList.contains('initial')) {
            this.initScreensInitialWindowSize();
        }
        this.initScreenGrid();
        this.initParallaxRoot();
        this.initScreens();
        this.initParallaxLayers();
        this.checkScreenCount();
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
        this.element.style.position = 'relative';
        this.element.style.width = "max-content";

        const computedStyle = window.getComputedStyle(this.element);
        if (computedStyle.display === 'inline' || computedStyle.display === 'block') {
            this.element.style.display = 'grid';
        }
    }

    initScreens() {
        // Grab all of the screen elements
        const screenElements = this.element.querySelectorAll(':scope > .screen');
        const levelRect = this.element.getBoundingClientRect();

        this.screens = Array.from(screenElements).map(screen => {
            const screenRect = screen.getBoundingClientRect();

            // Auto-detect 0-indexed column (x) and row (y) directly from rendered DOM layout position
            const relativeX = screenRect.left - levelRect.left;
            const relativeY = screenRect.top - levelRect.top;

            const screenWidth = screenRect.width || parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--screen-width')) || window.innerWidth;
            const screenHeight = screenRect.height || parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--screen-height')) || window.innerHeight;

            const column = Math.round(relativeX / screenWidth);
            const row = Math.round(relativeY / screenHeight);

            return new Screen(this, screen, column, row);
        });

        if (this.screens.length > 0) {
            const maxCol = Math.max(...this.screens.map(s => s.x));
            const maxRow = Math.max(...this.screens.map(s => s.y));
            this.columns = maxCol + 1;
            this.rows = maxRow + 1;
        } else {
            this.columns = 1;
            this.rows = 1;
        }
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