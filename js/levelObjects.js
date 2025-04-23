import gameInstance from './game.js';
import { debugLog } from './tools.js';
import ToggleManager, { MultiStateManager } from './elementStateManagers.js';



// USE THIS AS A BASE FOR OTHER INTERACTABLE OBJECTS
// Effect Area - an object that does something when the player enters it
// Features:
// - Run javascript code on player overlap
// - Run javascript code on player interaction
// Interactable Toggle - an object that toggles between two states on interaction
// Features:
// - Toggle between two states on interaction
// - Trigger other objects on toggle
// Interactable Button - an object that triggers other objects on interaction
// Features:
// - Trigger other objects on interaction

// Floor - a solid object that the player can stand on
// Features:
// - Automatically places itself at the bottom of the screen

// One Way SolidObject - a solidObject that can be passed through in one direction
// Features:
// - Can be passed through in one direction
// - Can't be passed through in the other direction
// - Vertical or horizontal orientation


// Moving platform - a type of solidObject that moves
// Easy example of extending a class
// Features:
// - Move between two points
// - Carry player


// Sign - an interactable object that displays a message
// Features:
// - Display on interaction
// - Display on player overlap
// - Pause game on interaction-display


// Door - an interactable object that changes player location
// Instead of making a "door" object, 
// I just made an interactable that changes player location with the onclick event
// Less code, more flexibility, same result, I daresay more elegant
// Features:
// - Teleport player on interaction
//   - Teleport to coordinates
//   - Teleport to linked door? (optional)
// - Change level on interaction


// Hazard - an object that teleports player to a checkpoint on collision
// This should just be an effect area that teleports the player with the onclick
// This is because the player can't die
// Features:
// - Teleport player on collision
//   - Teleport to coordinates
//   - Teleport to checkpoint? (optional)
// - Display a message on collision (optional)


// Box - an object that can be pushed by the player
// https://chatgpt.com/c/81b5a9bb-778d-4388-8d13-b3ebd16a8895
// ChatGPT answer is probably wrong but on the right track
// Features:
// - Can rotate based on physics calculations
// - Can be pushed by player
// - Stops on collision with solidObject
// - Pushes other boxes
// - Pushes player
// - Pushes other objects
// - Falls off ledges
// - Can be pulled by player (maybe)
// - Can be picked up by player (maybe)
// - Can be thrown by player (maybe)


// Classic Mario Block - an object that changes state on collision
// Features:
// - Change state on collision
// - Choose direction impact is needed for state change
export const SolidMixin = Base => class extends Base {
    constructor() {
        super();
        this.element = null
    }


    iinitializeElement(element) {
        this.element = element;
    }

    reinitStyles() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid red';
            this.element.style.outlineOffset = '-3px';
        } else {
            this.element.style.outline = 'none';
        }
    }
};
SolidMixin.capabilities = ['collision'];

export const TriggerMixin = Base => class extends Base {
    constructor() {
        super();
        this.element = null;
    }
    
    iinitializeElement(element) {
        this.element = element;
        this.element.style.pointerEvents = 'none';
        if (this.element.classList.contains('disabled')) {
            this.enabled = false;
        }
    }

    reinitStyles() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid blue';
            this.element.style.outlineOffset = '-3px';
        } else {
            this.element.style.outline = 'none';
        }
    }

    trigger() {
        if (!this.enabled) return;
        if (this.element.classList.contains('once')) {
            this.enabled = false;
            this.element.classList.add('disabled');
        }
        debugLog('Triggered');
        this.element.click();
    }
};
TriggerMixin.capabilities = ['collision'];

export const InteractableMixin = Base => class extends Base {
    constructor() {
        super();
        this.element = null
    }

    initializeElement(element) {
        this.element = element;
        if (this.element.classList.contains('clickable')) {
            this.element.addEventListener('pointerup', () => {
                this.interact();
            });
            this.element.style.cursor = 'pointer';
        } else {
            this.element.style.pointerEvents = 'none';
        }
    }

    interact() {
        if (!this.enabled) return;
        debugLog('Interacted');
        debugLog(this.element);
        this.element.click();
    }
};
InteractableMixin.capabilities = ['interactable'];

export const InteractableToggleMixin = Base => class extends InteractableMixin(Base) {
    constructor() {
        super();
        this.element = null;
    }
    
    initializeElement(element) {
        this.element = element;
        this.stateManager = new ToggleManager(this.element);
    }

    interact() {
        if (!this.enabled) return;
        this.stateManager.toggle();
    }
}
InteractableToggleMixin.capabilities = ['interactable'];

export const RecieverMixin = Base => class extends Base {
    constructor() {
        super()
        this.element = null;
        this.signals = []
        this.broadcastChannel = ""
        this.stateManager = null
    }

    initializeElement(element) {
        this.element = element;
        Array.from(this.element.children).forEach(child => {
            child.classList.forEach(className => {
                if (className.includes('signal-')) {
                    this.signals.push(className.split('-')[1]);
                }
            });
        });
        this.element.querySelectorAll('.broadcast').forEach(element => {
            element.style.display = 'none';
            element.classList.forEach(className => {
                if (className.includes('channel-')) {
                    this.broadcastChannel = className.split('-')[1];
                }
            })
        });
        this.stateManager = new MultiStateManager(element, this.signals, this.signals[0]);
    }

    update() {
        if (gameInstance.debug) {
            this.element.style.outline = '3px solid purple';
        } else {
            this.element.style.outline = 'none';
        }
        this.stateManager.syncStateToBroadcast(this.broadcastChannel);
    }
}
RecieverMixin.capabilities = [];

export const ParallaxMixin = Base => class extends Base {
    constructor() {
        super();
        this.element = null;
    }

    initializeElement(element) {
        this.element = element;
        if (this.element.classList.contains('plax')) {
            this.calculateParallax();
        }
        for (let i = 0; i < this.element.classList.length; i++) {
            if (this.element.classList[i].includes('z')) {
                this.element.style.zIndex = this.element.classList[i].replace('z', '');
            }
        }
    }

    calculateParallax() {
        const PARALLAX_SENSITIVITY = 10;
        let zIndex = 0;
        for (let i = 0; i < this.element.classList.length; i++) {
            if (this.element.classList[i].includes('z')) {
                zIndex = this.element.style.zIndex;
            }
        }
        const parallaxSpeed = (parseInt(zIndex) / 100) * PARALLAX_SENSITIVITY;
        const playerCenterX = gameInstance.camera.element.getBoundingClientRect().left + (gameInstance.camera.element.getBoundingClientRect().width / 2);
        const playerCenterY = gameInstance.camera.element.getBoundingClientRect().top + (gameInstance.camera.element.getBoundingClientRect().height / 2);
        const objectCenterX = this.element.getBoundingClientRect().left + (this.element.getBoundingClientRect().width / 2);
        const objectCenterY = this.element.getBoundingClientRect().top + (this.element.getBoundingClientRect().height / 2);

        let xOffset = ((playerCenterX - objectCenterX) * parallaxSpeed) * -1;
        let yOffset = ((playerCenterY - objectCenterY) * parallaxSpeed) * -1;

        if (this.element.classList.contains('noplax-y')) {
            yOffset = 0;
        }
        if (this.element.classList.contains('noplax-x')) {
            xOffset = 0;
        }
        this.element.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(${1 + (parallaxSpeed)})`;
    }
};
ParallaxMixin.capabilities = ['parallax'];

export class LevelObject {
    constructor() {
        this.element = null;
        this.enabled = true;
    }

    static mixinMap = {
        solid: SolidMixin,
        trigger: TriggerMixin,
        interactable: InteractableMixin,
        toggle: InteractableToggleMixin,
        reciever: RecieverMixin,
        plax: ParallaxMixin,
    };

    initializeElement(element) {
        this.element = element;
        if (this.element.classList.contains('disabled')) {
            this.enabled = false;
            this.element.style.opacity = '0.5';
        }
    }

    update() {
        if (this.element.classList.contains('plax')) {
            this.calculateParallax();
        }
    }
}

export const applyMixins = (BaseClass, mixins) => {
    const updateFns = [];
    const initializeElementFunctions = []

    for (const mixin of mixins) {
        const Mixed = mixin(BaseClass);
        const proto = mixin.prototype || Object.getPrototypeOf(new Mixed());

        if (proto.update) {
            updateFns.push(proto.update);
        }
        if (proto.initializeElement) {
            initializeElementFunctions.push(proto.initializeElement)
        }

        BaseClass = Mixed;
    }

    return class extends BaseClass {
        update(...args) {
            for (const fn of updateFns) {
                fn.call(this, ...args);
            }
        }
        initializeElement(...args) {
            for (const func of initializeElementFunctions) {
                func.call(this, ...args)
            }
        }
    };
}

export const resolveLevelObject = (objectElement) => {
    
    let capabilities = [];
    const mixins = Array.from(objectElement.classList)
        .map(className => {
            LevelObject.mixinMap[className]
            const caps = LevelObject.mixinMap[className]?.capabilities || [];
            capabilities = [...capabilities, ...caps];
            return LevelObject.mixinMap[className];
        })
        .filter(Boolean); // Filter out undefined values for classes without a mixin

    const BaseClass = applyMixins(LevelObject, mixins);
    BaseClass.capabilities = capabilities;

    const CombinedObject = new BaseClass();
    CombinedObject.initializeElement(objectElement);

    return CombinedObject;
};