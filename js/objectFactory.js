import { SolidObject, InteractableObject, InteractableToggle, Reciever, LevelObject, TriggerArea, OneWaySolidObject } from "./levelObjects.js";

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
    const oneWayClass = classes.find(cls => cls.startsWith('oneway-'));
    if (oneWayClass && classes.includes('solid')) {
        return { type: 'solid', instance: new OneWaySolidObject(element) };
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
