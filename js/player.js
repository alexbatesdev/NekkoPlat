import gameInstance from "./game.js";
import { intersects, getCollisionOverlap, anyTrue, debugLog } from "./tools.js";
import GifAnimationManager from "./gifAnimationManager.js";
import { Physics } from "./physics.js";
import { CollisionDetection } from "./collisionDetector.js";
import InteractionBox from "./interactionBox.js";

export default class Player {
    constructor(element) {
        // HTML element
        this.element = element;
        this.animationElement = this.element.querySelector(".animation-container");
        if (!this.animationElement) {
            this.animationElement = document.createElement("div");
            this.element.appendChild(this.animationElement);
        }
        this.animationManager = new GifAnimationManager(this.animationElement);


        this.initStyles();
        // HTML config - comes from a .config element in the #player element
        //   Physics and jump variables in order from most physics to least physics
        this.physics = new Physics();
        this.configElement = null;
        this.gravity = null;
        this.fallingGravity = null;
        this.maxVelocity = null;
        this.sprintMaxVelocity = null;
        this.acceleration = null;
        this.sprintAcceleration = null;
        this.jumpForce = null;
        this.coyoteTime = null;
        this.preJumpAllowance = null;
        this.maxAirJumps = null;
        this.initConfig();
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
        this.liveGravity = this.physics.gravity;
        //   Collision
        this.solidObjects = [];
        this.collision = new CollisionDetection();
        this.grounded = false;
        //   Jumping
        this.airJumps = 0;
        this.jumpProcessed = false;
        this.jumpInProgress = false;
        this.coyoteTimer = 0;
        this.coyoteTimeActive = false;
        //   Animation
        this.currentAnimation = 'idle';
        //   Interaction
        this.interactionBox = new InteractionBox(this);
    }

    initConfig() {
        this.configElement = this.element.querySelector(".config");
        if (!this.configElement) {
            console.warn("No player config element found in the document, using default values");
        }
        this.gravity = this.setConfigItem('gravity', 0.9);
        this.physics.gravity = this.gravity;
        this.maxVelocity = this.setConfigItem('maxVelocity', 10);
        this.physics.maxVelocity = this.maxVelocity;
        this.sprintMaxVelocity = this.setConfigItem('sprintMaxVelocity', 18);
        this.physics.sprintMaxVelocity = this.sprintMaxVelocity;
        this.acceleration = this.setConfigItem('acceleration', 0.7);
        this.physics.acceleration = this.acceleration;
        this.sprintAcceleration = this.setConfigItem('sprintAcceleration', 2);
        this.fallingGravity = this.setConfigItem('fallingGravity', 1.5);
        this.jumpForce = this.setConfigItem('jumpForce', 25);
        this.coyoteTime = this.setConfigItem('coyoteTime', 100);
        this.preJumpAllowance = this.setConfigItem('preJumpAllowance', 10);
        this.maxAirJumps = this.setConfigItem('maxAirJumps', 1);
    }

    initStyles() {
        let element = this.element;
        element.style.position = "absolute";
        element.style.zIndex = 2;
        const configElement = this.element.querySelector(".config");
        if (configElement) this.element.querySelector(".config").style.display = "none";
    }

    setConfigItem(configItem, default_value) {
        const configItemElement = this.configElement.querySelector(`.${configItem}`);
        if (configItemElement) {
            return Number(configItemElement.innerHTML);
        } else {
            console.warn("No config element found for " + configItem + ", using default value: " + default_value);
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
        debugLog(screen);
        screen.classList.forEach(className => {
            if (className.includes("screen-")) {
                screensToTheLeft = Number(className.split("-")[1]);
                screensToTheTop = Number(className.split("-")[2]);
            }
        });
        debugLog(screensToTheLeft);
        debugLog(screensToTheTop);
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
        this.physics.applyPhysics(this, this.collision.state);
        this.collision.applyCollisions(this, this.solidObjects);
        this.processCollisions();
        // console.log(this.interactableObjects);
        this.interactionBox.checkIntersectsInteractable(this.interactableObjects);
        this.applyAnimations();
        // Set the position of the player's HTML element
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        // debugLog({
        //     x: this.x,
        //     y: this.y,
        //     velocityX: this.velocityX,
        //     velocityY: this.velocityY,
        //     gravity: this.liveGravity,
        //     grounded: this.grounded,
        //     collisionState: this.collision.state,
        // });
        document.getElementById('xPositionDisplay').innerHTML = Math.round(this.x + this.element.getBoundingClientRect().width / 2);
        document.getElementById('yPositionDisplay').innerHTML = Math.round(this.y + this.element.getBoundingClientRect().height / 2);
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid red';
            this.element.style.outlineOffset = '-3px';
        } else {
            this.element.style.outline = 'none';
        }
    }

    processCollisions() {
        if (this.collision.state.bottom > 0) {
            if (!this.grounded) {
                this.jumpInProgress = false;
                this.airJumps = 0;
            }
            this.grounded = true;
        }
        if (this.collision.state.top == 0 && this.collision.state.bottom == 0) {
            this.grounded = false;
            if (this.velocityY > 0 && !this.jumpInProgress) {
                this.coyoteTimeActive = true;
                setTimeout(() => {
                    this.coyoteTimeActive = false;
                }, this.coyoteTime);
            }
        }
        if ((this.collision.state.left > 0 || this.collision.state.right) && this.velocityY > 0) this.velocityY *= 0.5; 
    }

    processInput() {
        if (gameInstance.keyState['SHIFT'] && this.grounded) {
            this.physics.acceleration = this.sprintAcceleration;
            this.physics.maxVelocity = this.sprintMaxVelocity;
        } else {
            this.physics.acceleration = this.acceleration;
            this.physics.maxVelocity = this.maxVelocity;
        }

        // Movement calculations here
        if (gameInstance.keyState['A']) {
            this.lookLeft();
            this.physics.move(this, -this.physics.acceleration, 0);
        }
        if (gameInstance.keyState['D']) {
            this.lookRight();
            this.physics.move(this, this.physics.acceleration, 0);
        }
        if (gameInstance.keyState['S']) this.velocityY += this.physics.acceleration;
        // Similar for other directions
        if (gameInstance.keyState['W']) {
            this.jump();
        } else {
            this.jumpProcessed = false; // Reset the flag when 'W' is not pressed
            if (!this.grounded && this.velocityY < 0) {
                this.physics.gravity = this.fallingGravity;
            } else {
                this.physics.gravity = this.gravity;
            }
        }
        if (gameInstance.keyState['R']) {
            this.respawnAtCheckpoint();
        }
    }

    jump() {
        if (!this.jumpProcessed && anyTrue(
            [
                this.grounded,
                this.airJumps < this.maxAirJumps,
                this.collision.state.left > 0,
                this.collision.state.right > 0,
                this.coyoteTimeActive,
            ]
        )
        ) {
            this.jumpProcessed = true;
            this.jumpInProgress = true;
            if (!this.grounded && !(this.collision.state.left > 0 || this.collision.state.right > 0 || this.coyoteTimeActive)) {
                this.airJumps += 1;
            }
            if (this.collision.state.left > 0) {
                this.velocityX += 12;
            } else if (this.collision.state.right > 0) {
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

    applyAnimations() {
        if (Math.abs(this.velocityX) > 0 && gameInstance.keyState['SHIFT']) this.animationManager.changeAnimation('run');
        else if (Math.abs(this.velocityX) > 0 && (gameInstance.keyState['A'] || gameInstance.keyState['D'])) this.animationManager.changeAnimation('walk');
        else if (this.grounded) this.animationManager.changeAnimation('idle');
        else this.animationManager.changeAnimation('jump');
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

    setSolidObjects(solidObjects) {
        this.solidObjects = solidObjects;
    }

    // Figuring out how to handle interactable objects
    setInteractableObjects(interactableObjects) {
        interactableObjects.forEach(interactableObject => {
            console.log();
        });
        this.interactionBox.interactables = interactableObjects;
    }

    resolveInteractableObject(interactableObject) {
        let classList = interactableObject.element.classList.value;
        if (!classList.outline('interact')) {
            console.error('Interactable object does not have the class "interact"');
            return;
        } else {
            classList = classList.replace('interact', '').trim();
        }
        switch (classList) {
            case "toggle":
                return 
                break;
        
            default:
                break;
        }
    }
}
