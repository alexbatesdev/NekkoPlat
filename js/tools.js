import gameInstance from "./game.js";

export const intersects = (rect1, rect2) => {
    let isIntersecting = !(rect2.left > rect1.right ||
        rect2.right < rect1.left ||
        rect2.top > rect1.bottom ||
        rect2.bottom < rect1.top);
    return isIntersecting;
}

export const getCollisionOverlap = (rect1, rect2) => {
    const playerLeftSide = rect1.left;
    const playerRightSide = playerLeftSide + rect1.width;
    const playerTopSide = rect1.top;
    const playerBottomSide = playerTopSide + rect1.height;
    const soldObjectLeftSide = rect2.left;
    const soldObjectRightSide = soldObjectLeftSide + rect2.width;
    const soldObjectTopSide = rect2.top;
    const soldObjectBottomSide = soldObjectTopSide + rect2.height;
    const playerCenterX = rect1.left + rect1.width / 2;
    const playerCenterY = rect1.top + rect1.height / 2;
    const soldObjectCenterX = rect2.left + rect2.width / 2;
    const soldObjectCenterY = rect2.top + rect2.height / 2;

    let collisionDirections = {
        left: false,
        right: false,
        top: false,
        bottom: false,
    }

    if (playerRightSide > soldObjectLeftSide
        && playerLeftSide < soldObjectLeftSide
        && playerCenterY > soldObjectTopSide
        && playerCenterY < soldObjectBottomSide
    ) {
        collisionDirections.right = playerRightSide - soldObjectLeftSide;
    }

    if (playerLeftSide < soldObjectRightSide
        && playerRightSide > soldObjectRightSide
        && playerCenterY > soldObjectTopSide
        && playerCenterY < soldObjectBottomSide
    ) {
        collisionDirections.left = soldObjectRightSide - playerLeftSide;
    }

    if (playerBottomSide > soldObjectTopSide
        && playerTopSide < soldObjectTopSide
        && playerCenterX > soldObjectLeftSide
        && playerCenterX < soldObjectRightSide
    ) {
        collisionDirections.bottom = playerBottomSide - soldObjectTopSide;
    }

    if (playerTopSide < soldObjectBottomSide
        && playerBottomSide > soldObjectBottomSide
        && playerCenterX > soldObjectLeftSide
        && playerCenterX < soldObjectRightSide
    ) {
        collisionDirections.top = soldObjectBottomSide - playerTopSide;
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