import { SolidObject, InteractableObject, InteractableToggle, Reciever, LevelObject, TriggerArea, MovingPlatform, SaggingPlatform, OneWaySolidObject } from "./levelObjects.js";

const objectFactory = {
    solid: SolidObject,
    trigger: TriggerArea,
    reciever: Reciever,
    interactable: InteractableObject,
    'interactable-toggle': InteractableToggle,
    plax: LevelObject,
    'moving-platform': MovingPlatform,
    'oneway': OneWaySolidObject,
    'sag-platform': SaggingPlatform
};

export function createObject(element) {
    const classes = Array.from(element.classList);

    // Find all matching types
    let types = classes.filter(cls => objectFactory[cls]);

    // Special handling for interactable-toggle
    if (types.includes('interactable') && classes.includes('toggle')) {
        types = types.filter(t => t !== 'interactable');
        types.push('interactable-toggle');
    }

    const oneWayClass = classes.find(cls => cls.startsWith('oneway-'));
    if (oneWayClass) {
        if (!types.includes('oneway')) types.push('oneway');
    }

    // Special handling for plax
    if (classes.includes('plax')) {
        if (!types.includes('plax')) types.push('plax');
        const zClass = classes.find(cls => cls.startsWith('z'));
        if (zClass) {
            element.style.zIndex = zClass.substring(1);
        }
    }

    if (types.length === 0) return null;

    // Compose mixin object
    let instance = {};
    // Collect all update methods
    const updateMethods = [];
    // Call all constructors and copy their properties/methods
    types.forEach(type => {
        const Constructor = objectFactory[type];
        if (Constructor) {
            // Call constructor, bind properties/methods
            const temp = new Constructor(element);
            Object.getOwnPropertyNames(temp).forEach(key => {
                instance[key] = temp[key];
            });
            // Also copy prototype methods
            getAllPrototypeMethods(Constructor.prototype).forEach(key => {
                if (key !== 'constructor') {
                    if (key === 'update' && typeof Constructor.prototype[key] === 'function') {
                        updateMethods.push(Constructor.prototype[key]);
                    }
                    instance[key] = Constructor.prototype[key].bind(instance);
                }
            });

            
        }
    });

    // Combine all update methods into one
    if (updateMethods.length > 0) {
        instance.update = function() {
            updateMethods.forEach(fn => fn.call(this));
        };
    }
    console.log(types)

    return { types, instance };
}

function getAllPrototypeMethods(obj) {
    const methods = new Set();
    let proto = obj;
    while (proto && proto !== Object.prototype) {
        Object.getOwnPropertyNames(proto).forEach(name => {
            if (typeof proto[name] === 'function' && name !== 'constructor') {
                methods.add(name);
            }
        });
        proto = Object.getPrototypeOf(proto);
    }
    return Array.from(methods);
}

export default objectFactory;
