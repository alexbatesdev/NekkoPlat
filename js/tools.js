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
    const wallLeftSide = rect2.left;
    const wallRightSide = wallLeftSide + rect2.width;
    const wallTopSide = rect2.top;
    const wallBottomSide = wallTopSide + rect2.height;
    const playerCenterX = rect1.left + rect1.width / 2;
    const playerCenterY = rect1.top + rect1.height / 2;
    const wallCenterX = rect2.left + rect2.width / 2;
    const wallCenterY = rect2.top + rect2.height / 2;

    let collisionDirections = {
        left: false,
        right: false,
        top: false,
        bottom: false,
    }

    if (playerRightSide > wallLeftSide
        && playerLeftSide < wallLeftSide
        && playerCenterY > wallTopSide
        && playerCenterY < wallBottomSide
    ) {
        collisionDirections.right = playerRightSide - wallLeftSide;
    }

    if (playerLeftSide < wallRightSide
        && playerRightSide > wallRightSide
        && playerCenterY > wallTopSide
        && playerCenterY < wallBottomSide
    ) {
        collisionDirections.left = wallRightSide - playerLeftSide;
    }

    if (playerBottomSide > wallTopSide
        && playerTopSide < wallTopSide
        && playerCenterX > wallLeftSide
        && playerCenterX < wallRightSide
    ) {
        collisionDirections.bottom = playerBottomSide - wallTopSide;
    }

    if (playerTopSide < wallBottomSide
        && playerBottomSide > wallBottomSide
        && playerCenterX > wallLeftSide
        && playerCenterX < wallRightSide
    ) {
        collisionDirections.top = wallBottomSide - playerTopSide;
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