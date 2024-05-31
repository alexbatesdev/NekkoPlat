import gameInstance from "./game.js";

export const intersects = (rect1, rect2) => {
    let isIntersecting = !(rect2.left > rect1.right ||
        rect2.right < rect1.left ||
        rect2.top > rect1.bottom ||
        rect2.bottom < rect1.top);
    return isIntersecting;
}

export const getCollisionOverlap = (rect1, rect2) => {
    const rect1LeftSide = rect1.left;
    const rect1RightSide = rect1LeftSide + rect1.width;
    const rect1TopSide = rect1.top;
    const rect1BottomSide = rect1TopSide + rect1.height;
    const rect2LeftSide = rect2.left;
    const rect2RightSide = rect2LeftSide + rect2.width;
    const rect2TopSide = rect2.top;
    const rect2BottomSide = rect2TopSide + rect2.height;
    const rect1CenterX = rect1.left + rect1.width / 2;
    const rect1CenterY = rect1.top + rect1.height / 2;
    // This may be useful for slopes
    // const rect2CenterX = rect2.left + rect2.width / 2;
    // const rect2CenterY = rect2.top + rect2.height / 2;

    let collisionDirections = {
        left: false,
        right: false,
        top: false,
        bottom: false,
    }

    if (rect1RightSide > rect2LeftSide
        && rect1LeftSide < rect2LeftSide
        && rect1CenterY > rect2TopSide
        && rect1CenterY < rect2BottomSide
    ) {
        collisionDirections.right = rect1RightSide - rect2LeftSide;
    }

    if (rect1LeftSide < rect2RightSide
        && rect1RightSide > rect2RightSide
        && rect1CenterY > rect2TopSide
        && rect1CenterY < rect2BottomSide
    ) {
        collisionDirections.left = rect2RightSide - rect1LeftSide;
    }

    if (rect1BottomSide > rect2TopSide
        && rect1TopSide < rect2TopSide
        && rect1CenterX > rect2LeftSide
        && rect1CenterX < rect2RightSide
    ) {
        collisionDirections.bottom = rect1BottomSide - rect2TopSide;
    }

    if (rect1TopSide < rect2BottomSide
        && rect1BottomSide > rect2BottomSide
        && rect1CenterX > rect2LeftSide
        && rect1CenterX < rect2RightSide
    ) {
        collisionDirections.top = rect2BottomSide - rect1TopSide;
    }

    // Check if one rect is entirely inside the other
    if (rect1LeftSide >= rect2LeftSide
        && rect1RightSide <= rect2RightSide
        && rect1TopSide >= rect2TopSide
        && rect1BottomSide <= rect2BottomSide
    ) {
        collisionDirections = {
            left: rect1RightSide - rect2LeftSide,
            right: rect2RightSide - rect1LeftSide,
            top: rect1BottomSide - rect2TopSide,
            bottom: rect2BottomSide - rect1TopSide,
        }
    }

    return collisionDirections;
}

export const anyTrue = (comparison_list) => {
    for (let i = 0; i < comparison_list.length; i++) {
        if (comparison_list[i]) return true;
    }
    return false;
}

export const debugLog = (message) => {
    if (gameInstance.debug) {
        console.log(message);
    }
}

export const isSubset = (subset, set) => {
    return subset.every(element => set.includes(element));
}

export const hasSubstringInClassList = (classList, substring) => {
    return Array.from(classList).some(className => className.includes(substring));
}