import gameInstance from "./game.js";
import { debugLog } from "./tools.js";
import GifAnimationManager from "./gifAnimationManager.js";
import { Physics } from "./physics.js";
import { CollisionDetection } from "./collisionDetector.js";
import InteractionBox from "./interactionBox.js";
import PlayerConfig from "./playerConfig.js";
import PlayerMovement from "./playerMovement.js";
import PlayerAnimation from "./playerAnimation.js";
import PlayerHUD from "./playerHUD.js";

export default class Player {
    constructor(element) {
        this.element = element;
        this.animationElement = this.element.querySelector(".animation-container");
        if (!this.animationElement) {
            this.animationElement = document.createElement("div");
            this.element.appendChild(this.animationElement);
        }
        this.animationManager = new GifAnimationManager(this.animationElement);

        this.initStyles();

        this.config = new PlayerConfig(this.element);
        this.physics = new Physics();
        this.physics.gravity = this.config.gravity;
        this.physics.maxVelocity = this.config.maxVelocity;
        this.physics.acceleration = this.config.acceleration;

        this.x = 0;
        this.y = 0;
        this.respawnX = 0;
        this.respawnY = 0;
        this.respawnScreen = null;

        this.velocityX = 0;
        this.velocityY = 0;
        this.liveGravity = this.physics.gravity;

        this.collisionObjects = [];
        this.collision = new CollisionDetection();
        this.grounded = false;

        this.interactionBox = new InteractionBox(this);

        this.movement = new PlayerMovement(this, this.physics);
        this.animation = new PlayerAnimation(this, this.animationManager);
        this.hud = new PlayerHUD(this);
    }

    initStyles() {
        let element = this.element;
        element.style.position = "absolute";
        element.style.zIndex = 2;
        const configElement = this.element.querySelector(".config");
        if (configElement) this.element.querySelector(".config").style.display = "none";
    }

    start() {
        this.respawnScreen = this.element.parentNode;
        this.spawn();
    }

    spawn() {
        const spawn_x_query_param = new URLSearchParams(window.location.search).get('spawn_x');
        const spawn_y_query_param = new URLSearchParams(window.location.search).get('spawn_y');

        const playerSpawnXRelativeToScreen = spawn_x_query_param == null ? getComputedStyle(document.documentElement).getPropertyValue('--player-spawn-x') : spawn_x_query_param;
        const playerSpawnYRelativeToScreen = spawn_y_query_param == null ? getComputedStyle(document.documentElement).getPropertyValue('--player-spawn-y') : spawn_y_query_param;
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
        this.respawnScreen = checkpoint_screen;
        this.respawnX = respawnX;
        this.respawnY = respawnY;
    }

    respawnAtCheckpoint() {
        this.spawnAt(this.respawnX, this.respawnY, this.respawnScreen);
    }

    update() {
        this.movement.update();
        this.interactionBox.update();
        this.animation.update();
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.hud.update();
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid red';
            this.element.style.outlineOffset = '-3px';
        } else {
            this.element.style.outline = 'none';
        }
    }

    setSolidObjects(solidObjects) {
        this.collisionObjects = solidObjects;
    }

    setInteractableObjects(interactableObjects) {
        interactableObjects.forEach(interactableObject => {
            console.log();
        });
        this.interactionBox.interactables = interactableObjects;
    }
}
