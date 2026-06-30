import gameInstance from "./game.js";
import { anyTrue, debugLog } from "./tools.js";
import GifAnimationManager from "./gifAnimationManager.js";
import { Physics } from "./physics.js";
import { CollisionDetection } from "./collisionDetector.js";
import InteractionBox from "./interactionBox.js";
import { InventoryService } from "./services/inventoryService.js";
import { HUDAdapter } from "./adapters/hudAdapter.js";
import { InventoryMenuAdapter } from "./adapters/inventoryMenuAdapter.js";
import { OneWaySolidObject } from "./levelObjects.js";

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
        this.collisionObjects = [];
        this.collision = new CollisionDetection();
        this.grounded = false;
        this.groundedObject = null;
        //   Jumping
        this.airJumps = 0;
        this.jumpProcessed = false;
        this.jumpInProgress = false;
        this.coyoteTimer = 0;
        this.coyoteTimeActive = false;
        this.dropTimer = 0;
        //   Animation
        this.currentAnimation = 'idle';
        //   Interaction
        this.interactionBox = new InteractionBox(this);
        // Inventory
        this.inventory = new InventoryService("itemsList");
        this.hudAdapter = new HUDAdapter(this.inventory);
        this.menuAdapter = new InventoryMenuAdapter(this.inventory);
        this.hudAdapter.initialize();
        this.menuAdapter.initialize();
        this.isFacingRight = false;

        // Cached DOM references
        this.xPositionDisplay = document.getElementById('xPositionDisplay');
        this.yPositionDisplay = document.getElementById('yPositionDisplay');

        // This lets the HTML as well as the console access the player object
        window.player = this;
    }

    initConfig() {
        this.configElement = this.element.querySelector(".config");
        if (!this.configElement) {
            console.warn("No player config element found in the document, using default values");
        }
        this.gravity = this.setConfigItem('gravity', 0.9);
        this.physics.gravity = this.gravity;
        this.maxVelocity = this.setConfigItem('maxVelocity', 10);
        this.sprintMaxVelocity = this.setConfigItem('sprintMaxVelocity', 18);
        this.physics.maxVelocity = this.maxVelocity;
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
        if (!this.configElement) {
            console.warn(
                `No player config element found for ${configItem}, using default value: ${default_value}`,
            );
            return default_value;
        }
        const configItemElement = this.configElement.querySelector(`.${configItem}`);
        if (configItemElement) {
            return Number(configItemElement.innerHTML);
        } else {
            console.warn(
                `No config element found for ${configItem}, using default value: ${default_value}`,
            );
            return default_value;
        }
    }

    start() {
        this.respawnScreen = this.element.parentNode;
        this.spawn();
    }

    spawn() {
        const spawn_x_query_param = new URLSearchParams(window.location.search).get('spawn_x');
        const spawn_y_query_param = new URLSearchParams(window.location.search).get('spawn_y');
        const playerSpawnXRelativeToScreen = spawn_x_query_param ? spawn_x_query_param : getComputedStyle(document.documentElement).getPropertyValue('--player-spawn-x');
        const playerSpawnYRelativeToScreen = spawn_y_query_param ? spawn_y_query_param : getComputedStyle(document.documentElement).getPropertyValue('--player-spawn-y');
        const screenRect = this.respawnScreen.getBoundingClientRect();
        const width = this.element.getBoundingClientRect().width;
        const height = this.element.getBoundingClientRect().height;

        function evalCalc(expr, axis) {
            // Replace percentages, px, vw, vh with pixel values
            return expr
                .replace(/([\d.]+)%/g, (m, p1) => {
                    return axis === 'x' ? (screenRect.width * (parseFloat(p1) / 100)) : (screenRect.height * (parseFloat(p1) / 100));
                })
                .replace(/([\d.]+)vw/g, (m, p1) => window.innerWidth * (parseFloat(p1) / 100))
                .replace(/([\d.]+)vh/g, (m, p1) => window.innerHeight * (parseFloat(p1) / 100))
                .replace(/([\d.]+)px/g, (m, p1) => parseFloat(p1));
        }

        function safeEval(expr) {
            // Only allow numbers, +, -, *, /, (, ) and .
            if (!/^[-+*/().\d\s]+$/.test(expr)) return NaN;
            try {
                return Function('return (' + expr + ')')();
            } catch {
                return NaN;
            }
        }

        function parseValue(val, axis) {
            val = val.trim();
            if (val.startsWith('calc(')) {
                let inner = val.slice(5, -1);
                let replaced = evalCalc(inner, axis);
                return safeEval(replaced);
            } else if (val.includes('%')) {
                let num = parseFloat(val);
                return axis === 'x' ? (screenRect.width * (num / 100)) : (screenRect.height * (num / 100));
            } else if (val.includes('px')) {
                return parseFloat(val);
            } else {
                return parseFloat(val);
            }
        }

        let xValue = parseValue(playerSpawnXRelativeToScreen, 'x');
        let yValue = parseValue(playerSpawnYRelativeToScreen, 'y');

        debugLog(`Spawning player at (${xValue}, ${yValue}) relative to screen`);
        this.x = xValue - (width / 2);
        this.y = yValue - (height / 2);
        this.updateTransform();
    }

    spawnAt(playerSpawnXRelativeToScreen, playerSpawnYRelativeToScreen, screen) {
        let screensToTheLeft = 0;
        let screensToTheTop = 0;
        screen.classList.forEach(className => {
            if (className.includes("screen-")) {
                screensToTheLeft = Number(className.split("-")[1]);
                screensToTheTop = Number(className.split("-")[2]);
            }
        });
        this.x = (playerSpawnXRelativeToScreen) + (screensToTheLeft * screen.getBoundingClientRect().width) - (this.element.getBoundingClientRect().width / 2);
        this.y = (playerSpawnYRelativeToScreen) + (screensToTheTop * screen.getBoundingClientRect().height) - (this.element.getBoundingClientRect().height / 2);
        this.updateTransform();
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
        this.spawnAt(this.respawnX, this.respawnY, this.respawnScreen);
    }

    update() {
        this.processInput();
        this.physics.applyPhysics(this, this.collision.state);

        const steps = Math.ceil(Math.max(Math.abs(this.velocityX), Math.abs(this.velocityY)));
        const iterations = Math.max(1, steps);
        for (let i = 0; i < iterations; i++) {
            this.x += this.velocityX / iterations;
            this.y += this.velocityY / iterations;
            this.updateTransform();
            this.collision.applyCollisions(this, this.collisionObjects);
            this.updateTransform();
            if (this.velocityX === 0 && this.velocityY === 0) break;
        }

        this.processCollisions();
        this.interactionBox.update();
        this.applyAnimations();
        if (this.xPositionDisplay) {
            this.xPositionDisplay.innerHTML = Math.round(this.x + this.element.getBoundingClientRect().width / 2);
        }
        if (this.yPositionDisplay) {
            this.yPositionDisplay.innerHTML = Math.round(this.y + this.element.getBoundingClientRect().height / 2);
        }
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid red';
            this.element.style.outlineOffset = '-3px';
        } else {
            this.element.style.outline = 'none';
        }
    }

    processCollisions() {
        const wasGrounded = this.grounded;
        this.grounded = this.collision.isGrounded(this, this.collisionObjects);
        if (!this.grounded) {
            this.groundedObject = null;
        }

        if (this.grounded) {
            if (!wasGrounded) {
                this.jumpInProgress = false;
                this.airJumps = 0;
            }
        } else if (wasGrounded && this.velocityY > 0 && !this.jumpInProgress) {
            this.coyoteTimeActive = true;
            setTimeout(() => {
                this.coyoteTimeActive = false;
            }, this.coyoteTime);
        }

        if ((this.collision.state.left > 0 || this.collision.state.right > 0) && this.velocityY > 0) {
            this.velocityY *= 0.5;
        }
    }

    processInput() {
        const input = gameInstance.inputManager;
        const sprint = input.isActionActive('sprint');

        if (sprint && this.grounded) {
            this.physics.acceleration = this.sprintAcceleration;
            this.physics.maxVelocity = this.sprintMaxVelocity;
        } else if (!sprint && this.grounded) {
            this.physics.acceleration = this.acceleration;
            this.physics.maxVelocity = this.maxVelocity;
        }

        // Movement calculations here
        if (input.isActionActive('moveLeft')) {
            this.lookLeft();
            this.physics.move(this, -this.physics.acceleration, 0);
        }
        if (input.isActionActive('moveRight')) {
            this.lookRight();
            this.physics.move(this, this.physics.acceleration, 0);
        }
        
        if (input.isActionActive('moveDown')) this.physics.move(this, 0, this.physics.acceleration);

        if (input.isActionActive('jump') && input.isActionActive('moveDown')) {
            this.collisionObjects.forEach(obj => {
                if (obj.element.classList.value.split(" ").filter(className => className.startsWith('oneway-')).length > 0 && obj.dropthrough && obj.direction === 'up') {
                    const rect = obj.element.getBoundingClientRect();
                    const playerRect = this.element.getBoundingClientRect();
                    if (playerRect.bottom <= rect.top + 1 && playerRect.bottom >= rect.top - 5) {
                        obj.dropTimer = 10;
                    }
                }
            });
            this.velocityY = Math.max(this.velocityY, 1);
            this.jumpProcessed = true;
        } else if (input.isActionActive('jump')) {
            this.jump();
        } else {
            this.jumpProcessed = false; // Reset the flag when jump is not pressed
            if (!this.grounded && this.velocityY < 0) {
                this.physics.gravity = this.fallingGravity;
            } else {
                this.physics.gravity = this.gravity;
            }
        }

        if (input.isActionActive('respawn')) {
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
        const input = gameInstance.inputManager;
        const sprint = input.isActionActive('sprint');
        if (Math.abs(this.velocityX) > 0 && sprint) this.animationManager.changeAnimation('run');
        else if (Math.abs(this.velocityX) > 0 && (input.isActionActive('moveLeft') || input.isActionActive('moveRight'))) this.animationManager.changeAnimation('walk');
        else if (this.grounded) this.animationManager.changeAnimation('idle');
        else this.animationManager.changeAnimation('jump');
    }

    lookRight() {
        this.isFacingRight = true;
        this.updateTransform();
        if (this.interactionBox.interactionIndicatorElement) {
            this.interactionBox.interactionIndicatorElement.style.transform = "translate(-50%, -100%) rotateY(180deg)";
        }
    }

    lookLeft() {
        this.isFacingRight = false;
        this.updateTransform();
        if (this.interactionBox.interactionIndicatorElement) {
            this.interactionBox.interactionIndicatorElement.style.transform = "translate(-50%, -100%) rotateY(0deg)";
        }
    }

    facingRight() {
        return this.isFacingRight;
    }

    updateTransform() {
        const rotation = this.isFacingRight ? 'rotateY(180deg)' : 'rotateY(0deg)';
        this.element.style.transform = `translate(${this.x}px, ${this.y}px) ${rotation}`;
    }

    setSolidObjects(solidObjects) {
        this.collisionObjects = solidObjects;
    }

    setInteractableObjects(interactableObjects) {
        this.interactionBox.interactables = interactableObjects;
    }
}
