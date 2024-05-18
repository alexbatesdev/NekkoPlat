// https://chatgpt.com/c/28b14350-009c-47a1-9b81-91d1849af58a
// TODO: Fork this repo into one dedicated to it instead of the darkness maze
class Game {
    constructor(player) {
        this.player = player;
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

    setLevel(level) {
        this.level = level;
    }
}

class Player {
    constructor(element) {
        // HTML element
        this.element = element;
        // HTML config - comes from a .config element in the #player element
        //   Physics and jump variables in order from most physics to least physics
        this.maxVelocity = this.setConfigItem('maxVelocity', 10);
        this.acceleration = this.setConfigItem('acceleration', 0.7);
        this.deceleration = this.setConfigItem('deceleration', 0.2);
        this.gravity = this.setConfigItem('gravity', 0.9);
        this.fallingGravity = this.setConfigItem('fallingGravity', 1.5);
        this.jumpForce = this.setConfigItem('jumpForce', 25);
        this.coyoteTime = this.setConfigItem('coyoteTime', 100);
        this.preJumpAllowance = this.setConfigItem('preJumpAllowance', 10);
        this.maxAirJumps = this.setConfigItem('maxAirJumps', 1);
        // Character state variables
        //   Position
        this.x = element.getBoundingClientRect().x;
        this.y = element.getBoundingClientRect().y;
        //   Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.liveGravity = this.gravity;
        //   Collision
        this.walls = [];
        this.collisionState = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        }
        this.grounded = false;
        //   Jumping
        this.airJumps = 0;
        this.jumpProcessed = false;
        this.jumpInProgress = false;
        this.coyoteTimer = 0;
        this.coyoteTimeActive = false;
        //   Animation
        this.currentAnimation = 'idle';
    }

    setConfigItem(configItem, default_value) {
        const configElement = this.element.querySelector(".config");
        if (configElement) {
            const configItemElement = configElement.querySelector(`.${configItem}`);
            if (configItemElement) {
                return Number(configItemElement.innerHTML);
            } else {
                console.warn("No config element found for " + configItem + ", using default value: " + default_value);
                return default_value;
            }
        } else {
            console.warn("No player config element found in the document, using default value for " + configItem + ": " + default_value);
            return default_value;
        }
    }

    update() {
        this.processInput();
        this.applyPhysics();
        this.applyCollisions();
        // Set the position of the player's HTML element
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    processInput() {
        let acceleration = this.acceleration;
        if (game.keyState['SHIFT'] && this.grounded) {
            this.acceleration = 2;
            this.maxVelocity = 18;
        } else {
            this.acceleration = 0.7;
            this.maxVelocity = 10;
        }

        // Movement calculations here
        if (game.keyState['A']) {
            this.move(-acceleration, 0);
        }
        if (game.keyState['D']) {
            this.move(acceleration, 0);
        }
        // if (game.keyState['W']) {
        //     if (this.velocityY < -3) this.velocityY -= 0.6;
        // }
        if (game.keyState['S']) this.velocityY += acceleration;
        // Similar for other directions
        if (game.keyState['W']) {
            this.jump();
        } else {
            this.jumpProcessed = false; // Reset the flag when 'W' is not pressed
            if (!this.grounded && this.velocityY < 0) {
                this.liveGravity = this.fallingGravity;
            } else {
                this.liveGravity = this.gravity;
            }
        }
    }

    move(xVel, yVel) {
        if (Math.abs(xVel) > 0) this.changeAnimation('walk');
        if (xVel > 0) this.lookRight();
        if (xVel < 0) this.lookLeft();

        this.velocityX += xVel;
        this.velocityY += yVel;
    }

    jump() {
        if (!this.jumpProcessed && HelperMethods.anyTrue(
            [
                this.grounded,
                this.airJumps < this.maxAirJumps,
                this.collisionState.left > 0,
                this.collisionState.right > 0,
                this.coyoteTimeActive,
            ]
        )
        ) {
            this.jumpProcessed = true;
            this.jumpInProgress = true;
            if (!this.grounded && !(this.collisionState.left > 0 || this.collisionState.right > 0 || this.coyoteTimeActive)) {
                this.airJumps += 1;
                console.log("Air Jumped")
            }
            if (this.collisionState.left > 0) {
                this.velocityX += 12;
            } else if (this.collisionState.right > 0) {
                this.velocityX -= 12;
            }
            console.log("Bababooey")
            this.velocityY = -this.jumpForce;
        } else if (this.airJumps >= this.maxAirJumps && !this.grounded) {
            setTimeout(() => {
                if (this.grounded) {
                    this.jump();
                }
            }, this.preJumpAllowance);
        }
    }

    applyPhysics() {

        this.velocityY += this.liveGravity;
        if (this.grounded && Math.abs(this.velocityX) < 0.2) {
            this.velocityX = 0;
            this.changeAnimation('idle');
        } else if (this.grounded && !(game.keyState['A'] || game.keyState['D'])) {
            this.velocityX *= 0.88;
        } else if (!this.grounded) {
            this.velocityX *= 0.95;
        }
        // Apply max velocity while grounded
        if (this.collisionState.bottom > 0) {
            if (Math.abs(this.velocityX) > this.maxVelocity) {
                this.velocityX *= 0.9;
            }
        } else {
            if (this.velocityY > 30) {
                this.velocityY = 30;
            }
        }

        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    applyCollisions() {
        let horizontal_collision_count = this.checkHorizontalCollisions();
        let vertical_collision_count = this.checkVerticalCollisions();

        if (horizontal_collision_count > 0) {
            if (this.velocityY > 0) this.velocityY *= 0.5;
        } else {
            this.collisionState = {
                left: 0,
                right: 0,
                top: this.collisionState.top,
                bottom: this.collisionState.bottom,
            }
        }

        if (vertical_collision_count > 0) {
            if (this.collisionState.bottom > 0 && !this.grounded) {
                    this.jumpInProgress = false;
                    this.airJumps = 0;
                    this.grounded = true;
            }
        } else {
            this.collisionState = {
                left: this.collisionState.left,
                right: this.collisionState.right,
                top: 0,
                bottom: 0,
            }
            this.grounded = false;
            if (this.velocityY > 0 && !this.jumpInProgress) {
                this.coyoteTimeActive = true;
                setTimeout(() => {
                    this.coyoteTimeActive = false;
                }, this.coyoteTime);
            }
        }

        if (vertical_collision_count == 0 && horizontal_collision_count == 0) {
            this.changeAnimation('jump');
            this.collisionState = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            }

        }
    }

    checkVerticalCollisions() {
        const playerRect = this.element.getBoundingClientRect();
        let collisionCount = 0;
        this.walls.forEach(wall => {
            for (let i = 0.25; i < 1; i += 0.25) {
                let playerRectNext = {
                    left: playerRect.left + 20,
                    right: playerRect.right - 20,
                    top: playerRect.top + (this.velocityY * i),
                    bottom: playerRect.bottom + ((this.velocityY - this.liveGravity) * i),
                    x: playerRect.x,
                    y: playerRect.y,
                    width: playerRect.width,
                    height: playerRect.height,
                }
                if (HelperMethods.intersects(playerRectNext, wall.rect)) {
                    this.velocityY = 0;
                }
            }
            if (HelperMethods.intersects(playerRect, wall.rect)) {
                const collision = HelperMethods.getCollisionOverlap(playerRect, wall.rect);
                if (collision.bottom > 0) {
                    collisionCount++;
                    this.collisionState.bottom = collision.bottom;
                    this.y -= collision.bottom; // Adjust the y position by the overlap
                }
                if (collision.top > 0) {
                    this.collisionState.top = collision.top;
                    this.y += collision.top; // Adjust the y position by the overlap
                    collisionCount++;
                }
            }
        });
        return collisionCount;
    }

    checkHorizontalCollisions() {
        const playerRect = this.element.getBoundingClientRect();
        let collisionCount = 0;
        this.walls.forEach(wall => {
            for (let i = 0.25; i < 1; i += 0.25) {
                let playerRectNext = {
                    left: playerRect.left + (this.velocityX * i),
                    right: playerRect.right + (this.velocityX * i),
                    top: playerRect.top,
                    bottom: playerRect.bottom - 25,
                    x: playerRect.x,
                    y: playerRect.y,
                    width: playerRect.width,
                    height: playerRect.height,
                }
                if (HelperMethods.intersects(playerRectNext, wall.rect)) {
                    this.velocityX = 0;
                }
            }
            if (HelperMethods.intersects(playerRect, wall.rect)) {
                const collision = HelperMethods.getCollisionOverlap(playerRect, wall.rect);
                if (collision.left > 0) {
                    this.collisionState.left = collision.left;
                    this.x += collision.left; // Adjust the x position by the overlap
                    collisionCount++;
                }
                if (collision.right > 0) {
                    this.collisionState.right = collision.right;
                    this.x -= collision.right; // Adjust the x position by the overlap
                    collisionCount++;
                }
            }
        });
        return collisionCount;
    }

    changeAnimation(animationName) {
        if (this.currentAnimation === animationName) return;
        this.currentAnimation = animationName;
        const animationElement = this.element.querySelector(".animation-container");
        if (animationElement) {
            // Iterate over animationElement children
            for (let i = 0; i < animationElement.children.length; i++) {
                const child = animationElement.children[i];
                if (child.classList.contains(animationName)) {
                    child.style.display = 'block';
                } else {
                    child.style.display = 'none';
                }
            }
        }
    }

    lookRight() {
        this.element.style.transform = 'rotateY(180deg)';
    }

    lookLeft() {
        this.element.style.transform = 'rotateY(0deg)';
    }

    facingRight() {
        return this.element.style.transform === 'rotateY(180deg)';
    }

    setWalls(walls) {
        this.walls = walls;
    }
}

class Level {
    constructor(element_id) {
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
        this.screens = [];
        this.initScreens();
        this.initScreenGrid();
    }

    initScreenGrid() {
        const classes = this.element.classList;
        let doDefault = true;
        for (let i = 0; i < classes.length; i++) {
            if (classes[i].includes('x')) {
                doDefault = false;
                const gridValues = classes[i].split('x');
                const columns = gridValues[0];
                const rows = gridValues[1];
                this.element.style.gridTemplateColumns = `repeat(${columns}, var(--screen-width))`;
                this.element.style.gridTemplateRows = `repeat(${rows}, var(--screen-height))`;
                if (this.screens.length > columns * rows) {
                    console.error("Screen count exceeds grid dimensions");
                } else if (this.screens.length < columns * rows) {
                    console.warn("Screen count is less than grid dimensions, some grid cells will be empty");
                }
            }
        }
        if (doDefault) {
            console.warn("No grid dimensions specified, using linear grid layout");
            this.element.style.gridTemplateColumns = `repeat(${this.screens.length}, var(--screen-width))`;
            this.element.style.gridTemplateRows = `var(--screen-height)`;
        }
    }

    initScreens() {
        // Grab all of the screen elements
        const screenElements = document.querySelectorAll('.screen');
        this.screens = Array.from(screenElements).map(screen => new Screen(screen));
    }

    update() {
        this.screens.forEach(screen => {
            screen.update();
        });
    }
}

class Screen {
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
        if (HelperMethods.intersects(player.element.getBoundingClientRect(), this.rect)) {
            if (player.walls !== this.walls) player.setWalls(this.walls);
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

class Wall {
    constructor(element) {
        this.element = element;
        this.rect = this.element.getBoundingClientRect();
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }

    update() {
        this.updateRect();
    }
}

class Camera {
    constructor() {
        this.element = document.getElementById('viewport');
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        this.restingOffsetX = 0.5;
        this.restingOffsetY = 0.8;
        this.offsetX = 0.5;
        this.offsetY = 0.5;
        this.maxOffset = 0.8;
        this.minOffset = 0.2;
        this.lookahead = 0.1;
    }

    update() {
        this.trackPlayer();
        this.processInput();
        this.applyMaxOffset();
    }

    trackPlayer() {
        let currentX = this.element.scrollLeft;
        let currentY = this.element.scrollTop;

        this.targetX = (player.x + (player.element.getBoundingClientRect().width / 2)) - (this.element.getBoundingClientRect().width - 80) * this.offsetX;
        this.targetY = (player.y + (player.element.getBoundingClientRect().height / 2)) - (this.element.getBoundingClientRect().height - 80) * this.offsetY;

        this.element.scrollTo(
            currentX + (this.targetX - currentX) * this.smoothing,
            currentY + (this.targetY - currentY) * this.smoothing
        );
    }

    processInput() {
        if (game.keyState['ARROWUP']) {
            this.offsetY += 0.01;
        }
        if (game.keyState['ARROWDOWN']) {
            this.offsetY -= 0.01;
        }
        if (game.keyState['ARROWLEFT']) {
            this.offsetX += 0.01;
        }
        if (game.keyState['ARROWRIGHT']) {
            this.offsetX -= 0.01;
        }

        if (!game.keyState['ARROWUP'] && !game.keyState['ARROWDOWN'] && !game.keyState['ARROWLEFT'] && !game.keyState['ARROWRIGHT']) {
            this.applyCenterDrift();
        }
    }

    applyMaxOffset() {
        if (this.offsetX > this.maxOffset) this.offsetX = this.maxOffset;
        if (this.offsetX < this.minOffset) this.offsetX = this.minOffset;
        if (this.offsetY > this.maxOffset) this.offsetY = this.maxOffset;
        if (this.offsetY < this.minOffset) this.offsetY = this.minOffset;
    }

    applyCenterDrift() {
        if (this.offsetX != (this.restingOffsetX + (player.facingRight() ? -this.lookahead : this.lookahead))) {
            if (this.offsetX > (this.restingOffsetX + (player.facingRight() ? -this.lookahead : this.lookahead))) {
                this.offsetX -= 0.01;
            } else {
                this.offsetX += 0.01;
            }
        }

        if (this.offsetY != this.restingOffsetY) {
            if (this.offsetY > this.restingOffsetY) {
                this.offsetY -= 0.01;
            } else {
                this.offsetY += 0.01;
            }
        }
    }
}

class HelperMethods {
    static intersects(rect1, rect2) {
        let isIntersecting = !(rect2.left > rect1.right ||
            rect2.right < rect1.left ||
            rect2.top > rect1.bottom ||
            rect2.bottom < rect1.top);
        return isIntersecting;
    }

    static getCollisionOverlap(rect1, rect2) {
        const playerLeftSide = rect1.left;
        const playerRightSide = playerLeftSide + rect1.width;
        const playerTopSide = rect1.top;
        const playerBottomSide = playerTopSide + rect1.height;
        const wallLeftSide = rect2.left;
        const wallRightSide = wallLeftSide + rect2.width;
        const wallTopSide = rect2.top;
        const wallBottomSide = wallTopSide + rect2.height;
        const playerCenterX = rect1.left + rect1.width / 2;
        const playerCenterY = rect1.top + rect1.height / 2;
        const wallCenterX = rect2.left + rect2.width / 2;
        const wallCenterY = rect2.top + rect2.height / 2;

        let collisionDirections = {
            left: false,
            right: false,
            top: false,
            bottom: false,
        }

        if (playerRightSide > wallLeftSide
            && playerLeftSide < wallLeftSide
            && playerCenterY > wallTopSide
            && playerCenterY < wallBottomSide
        ) {
            collisionDirections.right = playerRightSide - wallLeftSide;
        }

        if (playerLeftSide < wallRightSide
            && playerRightSide > wallRightSide
            && playerCenterY > wallTopSide
            && playerCenterY < wallBottomSide
        ) {
            collisionDirections.left = wallRightSide - playerLeftSide;
        }

        if (playerBottomSide > wallTopSide
            && playerTopSide < wallTopSide
            && playerCenterX > wallLeftSide
            && playerCenterX < wallRightSide
        ) {
            collisionDirections.bottom = playerBottomSide - wallTopSide;
        }

        if (playerTopSide < wallBottomSide
            && playerBottomSide > wallBottomSide
            && playerCenterX > wallLeftSide
            && playerCenterX < wallRightSide
        ) {
            collisionDirections.top = wallBottomSide - playerTopSide;
        }

        return collisionDirections;
    }

    static anyTrue(comparison_list) {
        for (let i = 0; i < comparison_list.length; i++) {
            if (comparison_list[i]) return true;
        }
        return false;
    }
}

// Usage
const playerElement = document.getElementById('player');
const player = new Player(playerElement);
const game = new Game(player);
game.setLevel(new Level("level-one"));