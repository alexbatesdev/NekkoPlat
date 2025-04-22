import { 
    SolidObject, 
    InteractableObject, 
    InteractableToggle, 
    Reciever, 
    LevelObject, 
    TriggerArea,
    TriggerMixin,
    InteractableMixin,
    InteractableToggleMixin,
    ParallaxMixin,
    SolidMixin,
} from "./levelObjects.js";
import { debugLog, intersects, isSubset } from "./tools.js";
import gameInstance from "./game.js";

export default class Screen {
    constructor(level, element, x, y) {
        this.element = element;
        this.level = level;
        this.x = x;
        this.y = y;
        this.element.classList.add(`screen-${x}-${y}`)
        // I really feel I should have a single object list, not sure how to pivot to that easily
        this.parallaxObjects = [];
        this.collisionObjects = [];
        this.interactableObjects = [];
        this.recievers = [];
        this.initObjects();
        this.initStyles();
    }

    initStyles() {
        this.element.style.position = 'relative';
        if (gameInstance.debug) this.element.style.outline = '1px solid yellow';
        else this.element.style.outline = 'none';
        for (let i = 0; i < this.collisionObjects.length; i++) {
            this.collisionObjects[i].reinitStyles();
        }
    }

    initObjects() {
        // Merge this with solid objects and interactable objects
        const objectElements = this.element.querySelectorAll('.object');
        Array.from(objectElements).map(objectElement => {
            this.resolveObject(objectElement);
        });
    }

    resolveObject(objectElement) {
        const classList = objectElement.classList;
        let BaseClass = LevelObject;
    
        if (classList.contains('solid')) {
            BaseClass = SolidMixin(BaseClass);
        }
        if (classList.contains('trigger')) {
            BaseClass = TriggerMixin(BaseClass);
        }
        if (classList.contains('interactable')) {
            BaseClass = InteractableMixin(BaseClass);
        }
        if (classList.contains('toggle')) {
            BaseClass = InteractableToggleMixin(BaseClass);
        }
        if (classList.contains('plax')) {
            BaseClass = ParallaxMixin(BaseClass);
        }
    
        const CombinedObject = new BaseClass(objectElement);
    
        // Add the object to the appropriate list
        if (classList.contains('solid') || classList.contains('trigger')) {
            this.collisionObjects.push(CombinedObject);
        }
        if (classList.contains('interactable')) {
            this.interactableObjects.push(CombinedObject);
        }
        if (classList.contains('plax')) {
            this.parallaxObjects.push(CombinedObject);
        }
    }

    resolveInteractableObject(interactableElement) {
        const classList = interactableElement.classList;
        if (classList.contains('toggle')) {
            return new InteractableToggle(interactableElement);
        } else {
            return new InteractableObject(interactableElement);
        }
    }

    checkIfPlayerInScreen() {
        if (intersects(gameInstance.player.element.getBoundingClientRect(), this.element.getBoundingClientRect())) {
            this.addAdjacentSolidObjectsToPlayer();
            this.addAdjacentInteractableObjectsToPlayer();
            return true;
        } else {
            return false;
        }
    }

    addAdjacentSolidObjectsToPlayer() {
        if (!isSubset(this.collisionObjects, gameInstance.player.collisionObjects)) {
            let solidObjectsToAdd = this.collisionObjects;
            if (this.x > 0) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x - 1, this.y).collisionObjects);
            }
            if (this.y > 0) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x, this.y - 1).collisionObjects);
            }
            if (this.x < this.level.columns - 1) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x + 1, this.y).collisionObjects);
            }
            if (this.y < this.level.rows - 1) {
                solidObjectsToAdd = solidObjectsToAdd.concat(this.level.getScreen(this.x, this.y + 1).collisionObjects);
            }
            gameInstance.player.setSolidObjects(solidObjectsToAdd);
        }
    }

    addAdjacentInteractableObjectsToPlayer() {
        let interactableObjectsToAdd = this.interactableObjects;
        debugLog(interactableObjectsToAdd);
        gameInstance.player.setInteractableObjects(interactableObjectsToAdd);
    }

    update() {
        if (this.checkIfPlayerInScreen()) {
            this.interactableObjects.forEach(interactableObject => {
                interactableObject.update();
            });
            this.recievers.forEach(reciever => {
                reciever.update();
            });
        }
        this.parallaxObjects.forEach(parallaxObject => {
            parallaxObject.update();
        });
    }
}