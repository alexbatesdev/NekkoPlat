import { SolidObject, InteractableObject, InteractableToggle, Reciever, LevelObject, TriggerArea, MovingPlatform, SaggingPlatform } from "./levelObjects.js";

const objectFactory = {
    solid: SolidObject,
    trigger: TriggerArea,
    reciever: Reciever,
    interactable: InteractableObject,
    'interactable-toggle': InteractableToggle,
    plax: LevelObject
};

export function createObject(element) {
    const classes = Array.from(element.classList);
    if (classes.includes("sag-platform")) {
        return { type: "solid", instance: new SaggingPlatform(element) };
    }
    if (classes.includes("moving-platform")) {
        return { type: "solid", instance: new MovingPlatform(element) };
    }
    let type = classes.find(cls => objectFactory[cls]);

    if (type === 'interactable' && classes.includes('toggle')) {
        type = 'interactable-toggle';
    }

    if (classes.includes('plax')) {
        type = 'plax';
        const zClass = classes.find(cls => cls.startsWith('z'));
        if (zClass) {
            element.style.zIndex = zClass.substring(1);
        }
    }

    const Constructor = objectFactory[type];
    if (!Constructor) return null;

    return { type, instance: new Constructor(element) };
}

export default objectFactory;
