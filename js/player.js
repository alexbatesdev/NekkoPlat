import gameInstance from "./game.js";
import { intersects, getCollisionOverlap, anyTrue, debugLog } from "./tools.js";

export default class Player {
    constructor(element) {
        // HTML element
        this.element = element;
        this.animationElement = this.element.querySelector(".animation-container");
        if (!this.animationElement) {
            //😎
            console.warn("You should have an animationElement, I have yet to test what goes wrong when you don't have one")
        }
        this.initStyles();
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
        //   Position/Respawn
        this.x = 0;
        this.y = 0;
        this.respawnX = 0;
        this.respawnY = 0;
        this.respawnScreen = null;
        //   Physics
        this.velocityX = 0;
        this.velocityY = 0;
        this.liveGravity = this.gravity;
        //   Collision
        this.soldObjects = [];
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

    initStyles() {
        let element = this.element;
        element.style.position = "absolute";
        element.style.zIndex = 2;
        
        this.animationElement.style.position = "absolute";
        this.animationElement.style.top = 0;
        this.animationElement.style.left = 0;
        this.animationElement.style.width = "100%";
        this.animationElement.style.height = "100%";
        this.animationElement.style.zIndex = 1;

        let animations = this.animationElement.children;
        Array.from(animations).forEach(animation => {
            animation.style.display = 'none';
            animation.style.position = "absolute";
            animation.style.top = 0;
            animation.style.left = 0;
            animation.style.width = "100%";
            animation.style.height = "100%";
            animation.style.zIndex = 1;
        });

        this.element.querySelector(".config").style.display = "none";
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

    start() {
        this.respawnScreen = this.element.parentNode;
        this.spawn();
    }

    spawn() {
        const playerSpawnXRelativeToScreen = getComputedStyle(document.documentElement).getPropertyValue('--player-spawn-x')
        const playerSpawnYRelativeToScreen = getComputedStyle(document.documentElement).getPropertyValue('--player-spawn-y')
        const screenXposition = this.respawnScreen.getBoundingClientRect().x;
        const screenYposition = this.respawnScreen.getBoundingClientRect().y;
        this.element.style.left = playerSpawnXRelativeToScreen;
        this.element.style.top = playerSpawnYRelativeToScreen;
        this.x = (this.element.getBoundingClientRect().x - screenXposition) - (this.element.getBoundingClientRect().width / 2);
        this.y = (this.element.getBoundingClientRect().y - screenYposition) - (this.element.getBoundingClientRect().height / 2);
    }

    spawnAt(playerSpawnXRelativeToScreen, playerSpawnYRelativeToScreen, screen) {
        let screensToTheLeft = 0;
        let screensToTheTop = 0;
        console.log(screen)
        screen.classList.forEach(className => {
            if (className.includes("screen-")) {
                screensToTheLeft = Number(className.split("-")[1]);
                screensToTheTop = Number(className.split("-")[2]);
                console.log(screensToTheLeft, screensToTheTop);
            }
        }); 
        console.log(playerSpawnXRelativeToScreen, playerSpawnYRelativeToScreen);
        console.log((playerSpawnXRelativeToScreen) + (screensToTheLeft * screen.getBoundingClientRect().width) - (this.element.getBoundingClientRect().width / 2))
        console.log((playerSpawnYRelativeToScreen) + (screensToTheTop * screen.getBoundingClientRect().height) - (this.element.getBoundingClientRect().height / 2))
        this.x = (playerSpawnXRelativeToScreen) + (screensToTheLeft * screen.getBoundingClientRect().width) - (this.element.getBoundingClientRect().width / 2);
        this.y = (playerSpawnYRelativeToScreen) + (screensToTheTop * screen.getBoundingClientRect().height) - (this.element.getBoundingClientRect().height / 2);
    }

    setCheckpointScreen(checkpoint_screen) {
        this.respawnScreen = checkpoint_screen;
    }

    setCheckpoint(respawnX, respawnY, checkpoint_screen) {
        // Figure out how this one will actually work
        this.respawnScreen = checkpoint_screen;
        this.respawnX = respawnX;
        this.respawnY = respawnY;
    }

    respawnAtCheckpoint() {
        this.spawn()
    }

    update() {
        this.processInput();
        this.applyPhysics();
        this.applyCollisions();
        // Set the position of the player's HTML element
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        debugLog({
            x: this.x,
            y: this.y,
            // velocityX: this.velocityX,
            // velocityY: this.velocityY,
            // gravity: this.liveGravity,
            // grounded: this.grounded,
            // collisionState: this.collisionState,
        });
    }

    processInput() {
        let acceleration = this.acceleration;
        if (gameInstance.keyState['SHIFT'] && this.grounded) {
            this.acceleration = 2;
            this.maxVelocity = 18;
        } else {
            this.acceleration = 0.7;
            this.maxVelocity = 10;
        }

        // Movement calculations here
        if (gameInstance.keyState['A']) {
            console.log("A")
            this.move(-acceleration, 0);
        }
        if (gameInstance.keyState['D']) {
            this.move(acceleration, 0);
        }
        if (gameInstance.keyState['S']) this.velocityY += acceleration;
        // Similar for other directions
        if (gameInstance.keyState['W']) {
            this.jump();
        } else {
            this.jumpProcessed = false; // Reset the flag when 'W' is not pressed
            if (!this.grounded && this.velocityY < 0) {
                this.liveGravity = this.fallingGravity;
            } else {
                this.liveGravity = this.gravity;
            }
        }
        if (gameInstance.keyState['R']) {
            console.log("R")
            this.respawnAtCheckpoint();
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
        if (!this.jumpProcessed && anyTrue(
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
            }
            if (this.collisionState.left > 0) {
                this.velocityX += 12;
            } else if (this.collisionState.right > 0) {
                this.velocityX -= 12;
            }
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
        } else if (this.grounded && !(gameInstance.keyState['A'] || gameInstance.keyState['D'])) {
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
        this.checkOutOfBounds();
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
        this.soldObjects.forEach(soldObject => {
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
                if (intersects(playerRectNext, soldObject.rect)) {
                    this.velocityY = 0;
                }
            }
            if (intersects(playerRect, soldObject.rect)) {
                const collision = getCollisionOverlap(playerRect, soldObject.rect);
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
        this.soldObjects.forEach(soldObject => {
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
                if (intersects(playerRectNext, soldObject.rect)) {
                    this.velocityX = 0;
                }
            }
            if (intersects(playerRect, soldObject.rect)) {
                const collision = getCollisionOverlap(playerRect, soldObject.rect);
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

    checkOutOfBounds() {
        const playerRect = this.element.getBoundingClientRect();
        const levelRect = gameInstance.level.element.getBoundingClientRect();
        const outOfBoundEffect = gameInstance.level.outOfBoundEffect;
        if (playerRect.left < levelRect.left) {
            console.log("Out of bounds left");
            if (outOfBoundEffect == "contain") {
                this.x -= playerRect.left - levelRect.left;
            }
        }
        if (playerRect.right > levelRect.right) {
            console.log("Out of bounds right");
            if (outOfBoundEffect == "contain") {
                this.x -= playerRect.right - levelRect.right;
            }
        }
        if (playerRect.top < levelRect.top) {
            console.log("Out of bounds top");
            if (outOfBoundEffect == "contain") {
                this.y -= playerRect.top - levelRect.top;
            }
        }
        if (playerRect.bottom > levelRect.bottom) {
            console.log("Out of bounds bottom");
            if (outOfBoundEffect == "contain") {
                this.y -= playerRect.bottom - levelRect.bottom;
            }
        }
    }

    // https://chatgpt.com/c/d6c3427f-edfa-4d17-bb39-a9a15b01fda5
    // We can make an AnimationManager class that will handle the animations for the player
    // This will build animation functionality for more than just the player
    changeAnimation(animationName) {
        if (this.currentAnimation === animationName) return;
        this.currentAnimation = animationName;
        // if animation has the gif class
        if (!this.animationElement) {
            console.error("Animation Element not found, please add an element with the class of `animation-container` to your player element")
            return
        } else if (this.animationElement.classList.contains("gif")) {
            this.setGifAnimation(animationName)
        } else if (this.animationElement.classList.contains("sprite-sheet")) {
            console.warn("Not Implemented Yet")
        } else {
            console.warn("No Animation Element type found (gif/spritesheet), defaulting to gif because that's the easier one :>")
        }
    }

    setGifAnimation(animationName) {
        // Iterate over this.animationElement children
        for (let i = 0; i < this.animationElement.children.length; i++) {
            const child = this.animationElement.children[i];
            if (child.classList.contains(animationName)) {
                child.style.display = 'block';
            } else {
                child.style.display = 'none';
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

    setSoldObjects(soldObjects) {
        this.soldObjects = soldObjects;
    }
}
