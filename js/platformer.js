// Code written by AI assistant

class Player {
    constructor(element, walls = []) {
        this.element = element;
        this.x = window.innerWidth / 2;
        this.y = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.maxVelocity = 10;
        this.acceleration = 0.7;
        this.deceleration = 0.2;
        this.grounded = false;
        this.airJumps = 0;
        this.maxAirJumps = 1;
        this.walls = walls;
        this.gravity = 0.9;
        this.jumpProcessed = false;
        this.animations = {
            idle: "url('./img/cat_stand.gif')",
            walk: "url('./img/cat_walk.gif')",
            jump: "url('./img/cat_jump.gif')",
            waiting: "url('./img/cat_fall_asleep.gif')",
        }
        this.currentAnimation = 'idle';
        this.collisionState = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        }
    }

    update(keyState) {
        this.processInput(keyState);
        this.applyPhysics();
        this.x += this.velocityX;
        this.y += this.velocityY;

        let vert_collision_count = this.checkVerticalCollisions();
        let hori_collision_count = this.checkHorizontalCollisions();

        if (hori_collision_count > 0) {
            if (this.velocityY > 0) this.velocityY *= 0.5;
            // this.velocityX = 0;
        }

        if (vert_collision_count > 0) {
            this.velocityY = 0;
        }

        if (vert_collision_count == 0 && hori_collision_count == 0) {
            this.changeAnimation('jump');
            this.collisionState = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            }
        }

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    processInput(keyState) {
        let acceleration = this.acceleration;
        let maxVelocity = this.maxVelocity;
        if (keyState['SHIFT'] && this.grounded) {
            acceleration = 2;
            maxVelocity = 18;
        }

        // Movement calculations here
        if (keyState['A']) {
            this.changeAnimation('walk');
            this.lookLeft();
            this.velocityX -= acceleration;
        }
        if (keyState['D']) {
            this.changeAnimation('walk');
            this.lookRight();
            this.velocityX += acceleration;
        }
        if (keyState['W']) {
            if (this.velocityY < 0) this.velocityY -= 0.25;
        }
        if (keyState['S']) this.velocityY += acceleration;
        // Similar for other directions

        if (keyState['W'] && (this.grounded || this.airJumps < this.maxAirJumps)) {
            if (!this.jumpProcessed) {
                this.jumpProcessed = true; // Set the flag to true after processing the jump
                if (this.collisionState.bottom == 0) {
                    this.airJumps += 1;
                } else {
                    this.grounded = false;
                }
                if (this.collisionState.left > 0) {
                    this.velocityX += 12;
                } else if (this.collisionState.right > 0) {
                    this.velocityX -= 12;
                }
                this.velocityY = -20;
            }
        } else {
            this.jumpProcessed = false; // Reset the flag when 'W' is not pressed
        }

        if (this.collisionState.bottom > 0) {
            // Apply max velocity
            if (this.velocityX > maxVelocity) {
                this.velocityX = maxVelocity;
            } else if (this.velocityX < -maxVelocity) {
                this.velocityX = -maxVelocity;
            }
        }
    }

    applyPhysics() {
        this.velocityY += this.gravity;
        if (this.grounded && Math.abs(this.velocityX) > 0.1) {
            this.velocityX *= 0.94;
        } else if (!this.grounded && Math.abs(this.velocityX) > 0.1) {
            this.velocityX *= 0.97;
        } else if (this.grounded) {
            this.velocityX = 0;
            this.changeAnimation('idle');
        } else {
            this.velocityX = 0;
        }
    }

    checkVerticalCollisions() {
        const playerRect = this.element.getBoundingClientRect();
        let playerRectNext = {
            left: playerRect.left + 20,
            right: playerRect.right - 20,
            top: playerRect.top,
            bottom: playerRect.bottom + ((this.velocityY - this.gravity) * 2) - 1,
            x: playerRect.x,
            y: playerRect.y,
            width: playerRect.width,
            height: playerRect.height,
        }
        let collisionCount = 0;
        this.walls.forEach(wall => {
            if (this.intersects(playerRectNext, wall.rect)) {
                this.velocityY = 0;
            }
            if (this.intersects(playerRect, wall.rect)) {
                const collision = this.getCollisionOverlap(playerRect, wall.rect);
                if (collision.bottom) {
                    collisionCount++;
                    this.y -= collision.bottom; // Adjust the y position by the overlap
                    if (!this.grounded) { // Reset jumpProcessed if the player was not previously grounded
                        this.jumpProcessed = false;
                    }
                    this.grounded = true;
                    this.airJumps = 0;
                } else {
                    this.grounded = false;
                }
                if (collision.top) {
                    this.y += collision.top; // Adjust the y position by the overlap
                    collisionCount++;
                }
            }
        });
        return collisionCount;
    }

    checkHorizontalCollisions() {
        const playerRect = this.element.getBoundingClientRect();
        let playerRectNext = {
            left: playerRect.left + this.velocityX + 1,
            right: playerRect.right + this.velocityX - 1,
            top: playerRect.top,
            bottom: playerRect.bottom - 25,
            x: playerRect.x,
            y: playerRect.y,
            width: playerRect.width,
            height: playerRect.height,
        }
        let collisionCount = 0;
        this.walls.forEach(wall => {
            if (this.intersects(playerRectNext, wall.rect)) {
                this.velocityX = 0;
            }
            if (this.intersects(playerRect, wall.rect)) {
                const collision = this.getCollisionOverlap(playerRect, wall.rect);
                if (collision.left) {
                    this.x += collision.left; // Adjust the x position by the overlap
                    collisionCount++;
                }
                if (collision.right) {
                    this.x -= collision.right; // Adjust the x position by the overlap
                    collisionCount++;
                }
            }
        });
        return collisionCount;
    }

    intersects(rect1, rect2) {
        return !(rect2.left > rect1.right ||
            rect2.right < rect1.left ||
            rect2.top > rect1.bottom ||
            rect2.bottom < rect1.top);
    }

    getCollisionOverlap(playerRect, wallRect) {
        const playerLeftSide = playerRect.left;
        const playerRightSide = playerLeftSide + playerRect.width;
        const playerTopSide = playerRect.top;
        const playerBottomSide = playerTopSide + playerRect.height;
        const wallLeftSide = wallRect.left;
        const wallRightSide = wallLeftSide + wallRect.width;
        const wallTopSide = wallRect.top;
        const wallBottomSide = wallTopSide + wallRect.height;
        const playerCenterX = playerRect.left + playerRect.width / 2;
        const playerCenterY = playerRect.top + playerRect.height / 2;
        const wallCenterX = wallRect.left + wallRect.width / 2;
        const wallCenterY = wallRect.top + wallRect.height / 2;

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
            this.collisionState.right = collisionDirections.right;
        }

        if (playerLeftSide < wallRightSide
            && playerRightSide > wallRightSide
            && playerCenterY > wallTopSide
            && playerCenterY < wallBottomSide
        ) {
            collisionDirections.left = wallRightSide - playerLeftSide;
            this.collisionState.left = collisionDirections.left;
        }

        if (playerBottomSide > wallTopSide
            && playerTopSide < wallTopSide
            && playerCenterX > wallLeftSide
            && playerCenterX < wallRightSide
        ) {
            collisionDirections.bottom = playerBottomSide - wallTopSide;
            this.collisionState.bottom = collisionDirections.bottom;
        }

        if (playerTopSide < wallBottomSide
            && playerBottomSide > wallBottomSide
            && playerCenterX > wallLeftSide
            && playerCenterX < wallRightSide
        ) {
            collisionDirections.top = wallBottomSide - playerTopSide;
            this.collisionState.top = collisionDirections.top;
        }

        return collisionDirections;

    }

    changeAnimation(animationName) {
        if (this.currentAnimation === animationName) return;
        this.currentAnimation = animationName;
        const animationUrl = this.animations[this.currentAnimation];
        if (animationUrl) {
            this.element.style.backgroundImage = animationUrl;
        }
    }

    lookRight() {
        this.element.style.transform = 'rotateY(180deg)';
    }

    lookLeft() {
        this.element.style.transform = 'rotateY(0deg)';
    }
}

class Game {
    constructor(player) {
        this.player = player;
        this.keyState = {
            W: false,
            A: false,
            S: false,
            D: false,
            SHIFT: false,
            SPACE: false,
            CONTROL: false,
        };
        this.walls = [];
        this.initKeyStateListeners();
        this.initWalls();
    }

    initKeyStateListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.keyState['SHIFT'] && this.keyState['CONTROL']) {
                return;
            }
            event.preventDefault();
            this.keyState[event.key.toUpperCase()] = true;
        });

        document.addEventListener('keyup', (event) => {
            this.keyState[event.key.toUpperCase()] = false;
        });
    }

    initWalls() {
        const wallElements = document.querySelectorAll('.wall');
        this.walls = Array.from(wallElements).map(wall => new Wall(wall));
        this.player.walls = this.walls; // Pass walls to player

        window.addEventListener('resize', () => {
            this.walls.forEach(wall => {
                wall.updateRect();
            });
        });
    }

    start() {
        requestAnimationFrame(this.update.bind(this));
    }

    update() {
        this.player.update(this.keyState);
        // Main Game Loop

        requestAnimationFrame(this.update.bind(this));
    }
}

class Wall {
    constructor(element) {
        this.element = element;
        this.rect = this.element.getBoundingClientRect();
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }
}


// Usage
const playerElement = document.getElementById('player');
const player = new Player(playerElement);
const game = new Game(player);
game.start();

// End of code

// Pre-OOPified code

// let player = document.getElementById('player');

// let walls = document.getElementsByClassName('wall');
// let positionX = window.innerWidth / 2;
// let positionY = 0;
// let velocityX = 0;
// let velocityY = 0;
// let maxVelocity = 3;
// let acceleration = 0.15;
// let deceleration = 0.1;
// let airJumps = 0;
// let maxAirJumps = 1;
// let grounded = false;
// let recentInputs = [];
// let warping = false;

// let keyState = {
//     W: false,
//     A: false,
//     S: false,
//     D: false,
//     SHIFT: false,
//     ENTER: false,
//     E: false,
//     LEFT_CLICK: false,
//     RIGHT_CLICK: false,
//     CONTROL: false,
//     SPACE: false,
//     ALT: false,
//     R: false,
// };

// // TODO:
// // Change Screen Layout system to use css grid
// // Rework camera movement to be based on player position


// // TODO ---------------------- 1. Seperate Ball logic from platformer logic for everything lower than this line
// const update = () => {
//     if (positionX > window.innerWidth) {
//         document.getElementById("img-5").classList.remove("hidden");
//     }


//     const player_rect = player.getBoundingClientRect();

//     // MOVEMENT CHUNK --------------------------------------------------------------
//     // Update velocity based on key states
//     if (keyState.SHIFT) {
//         acceleration = 0.5;
//         maxVelocity = 6;
//     } else {
//         maxVelocity = 3;
//         acceleration = 0.25;
//     }
//     if (keyState.W && velocityY > -maxVelocity) velocityY -= acceleration;
//     if (keyState.A && velocityX > -maxVelocity * 2.4) velocityX -= acceleration * 2.4;
//     if (keyState.S && velocityY < maxVelocity) velocityY += acceleration;
//     if (keyState.D && velocityX < maxVelocity * 2.4) velocityX += acceleration * 2.4;


//     // Gradually decrease velocity when no keys are pressed
//     if (grounded && !keyState.W && velocityY < 0) velocityY += (deceleration * 2);
//     if (grounded && !keyState.A && velocityX < 0) velocityX += (deceleration * 2.3);
//     if (grounded && !keyState.S && velocityY > 0) velocityY -= (deceleration * 2);
//     if (grounded && !keyState.D && velocityX > 0) velocityX -= (deceleration * 2.3);


//     // MOVEMENT CHUNK END --------------------------------------------------------------


//     if (velocityY < 0 && keyState.W) {
//         velocityY += 0.7;
//     } else {
//         velocityY += 1;
//     }


//     //if ball will be off screen next frame, stop the ball
//     if (positionX + velocityX < 0) {
//         velocityX = 0;
//     }

//     if (positionY + velocityY < 0) {
//         velocityY = 0;
//     }

//     // Check collision with each wall
//     for (let j = 0; j < walls.length; j++) {
//         if (walls[j].classList.contains('hidden')) continue;
//         if (warping && walls[j].classList.contains("pipe")) {
//             continue;
//         }
//         let wallRect = walls[j].getBoundingClientRect();

//         let scalingFactor = Math.max(Math.abs(velocityX), Math.abs(velocityY));
//         let stepSize = 1 / scalingFactor;

//         const maxStepSize = 0.5;
//         if (stepSize > maxStepSize) stepSize = maxStepSize;

//         let deltaX = velocityX * stepSize;
//         let deltaY = velocityY * stepSize;


//         let playerNextStepX = player_rect.x;
//         let playerNextStepY = player_rect.y;
//         for (let k = 0; k < 1; k += stepSize) {
//             // If where the ball will be next frame is inside the wall, stop the ball
//             if (
//                 playerNextStepX + deltaX < wallRect.x + wallRect.width &&
//                 playerNextStepX + player_rect.width + deltaX > wallRect.x &&
//                 playerNextStepY + deltaY < wallRect.y + wallRect.height &&
//                 playerNextStepY + player_rect.height + deltaY > wallRect.y
//             ) {
//                 // Check if the ball is already inside the wall
//                 if (
//                     player_rect.x >= wallRect.x &&
//                     player_rect.x + player_rect.width <= wallRect.x + wallRect.width &&
//                     player_rect.y >= wallRect.y &&
//                     player_rect.y + player_rect.height <= wallRect.y + wallRect.height
//                 ) {
//                     // Ball is already inside the wall, reflect the velocity based on the wall's position
//                     if (velocityX > 0 && playerNextStepX + player_rect.width >= wallRect.x) velocityX = 5 * -velocityX;
//                     if (velocityX < 0 && playerNextStepX <= wallRect.x + wallRect.width) velocityX = 5 * -velocityX;
//                     if (velocityY > 0 && playerNextStepY + player_rect.height >= wallRect.y) velocityY = 5 * -velocityY;
//                     if (velocityY < 0 && playerNextStepY <= wallRect.y + wallRect.height) velocityY = 5 * -velocityY;
//                     break;
//                 } else {
//                     let collisionTypes = [];
//                     // Ball is entering the wall, stop the ball
//                     if (playerNextStepX + player_rect.width < wallRect.x + 10 && velocityX > 0) {
//                         velocityX = 0;
//                         collisionTypes.push("right")
//                     }
//                     if (playerNextStepY + player_rect.height < wallRect.y + 10 && velocityY > 0) {
//                         velocityY = 0;
//                         collisionTypes.push("bottom")
//                     }
//                     if (playerNextStepX > wallRect.x + wallRect.width - 10 && velocityX < 0) {
//                         velocityX = 0;
//                         collisionTypes.push("left")
//                     }
//                     if (playerNextStepY > wallRect.y + wallRect.height - 10 && velocityY < 0) {
//                         velocityY = 0;
//                         collisionTypes.push("top")
//                     }

//                     if (collisionTypes.includes("left") && collisionTypes.includes("bottom")) {
//                         positionX -= 4;
//                         positionY -= 4;
//                         console.log("Poke")
//                     }

//                     if (collisionTypes.includes("right") || collisionTypes.includes("left")) {
//                         if (velocityY > 0) {
//                             velocityY *= 0.5;
//                             grounded = 2;
//                         }
//                     }

//                     if (collisionTypes.includes("bottom")) {
//                         airJumps = maxAirJumps;
//                         grounded = 1;
//                         if (velocityX != 0) {
//                             player.style.backgroundImage = "url('./img/cat_walk.gif')";
//                         }
//                         if (keyState.S) {
//                             if (walls[j].classList.contains("pipe")) {
//                                 let pipeRect = walls[j].getBoundingClientRect();
//                                 let pipeX = pipeRect.x;
//                                 let pipeY = pipeRect.y;
//                                 let pipeWidth = pipeRect.width;
//                                 let pipeHeight = pipeRect.height;
//                                 let pipeCenterX = pipeX + (pipeWidth / 2);
//                                 let pipeCenterY = pipeY + (pipeHeight / 2);
//                                 let playerCenterX = player_rect.x + (player_rect.width / 2);
//                                 let playerCenterY = player_rect.y + (player_rect.height / 2);

//                                 if (playerCenterX < pipeCenterX) {
//                                     velocityX += 0.5;
//                                 } else {
//                                     velocityX -= 0.5;
//                                 }

//                                 if (playerCenterX > pipeCenterX - 10 && playerCenterX < pipeCenterX + 10) {
//                                     velocityX = 0;
//                                     warping = true;

//                                     setInterval(() => {
//                                         warping = false;
//                                         window.location.href = "./platformer.html";
//                                     }, 1000);
//                                 }


//                             }
//                         }

//                     }

//                     break;
//                 }
//             }

//             // Update the ball's position for the next step
//             playerNextStepX += deltaX;
//             playerNextStepY += deltaY;
//         }
//     }

//     // Update position based on velocity
//     positionX += velocityX;
//     positionY += velocityY;

//     const velocityThreshold = 0.2;
//     if ((Math.floor(Math.abs(velocityX) * 10) / 10) <= velocityThreshold) velocityX = 0;
//     if ((Math.floor(Math.abs(velocityY) * 10) / 10) <= velocityThreshold) velocityY = 0;

//     if (velocityX == 0 && velocityY == 0 && !keyState.A && !keyState.D) {
//         if (!listsAreEqual(recentInputs, [null, null, null, null, null,])) {
//             player.style.backgroundImage = "url('./img/cat_stand.gif')";
//         }
//     }

//     player.style.top = positionY - player_rect.height / 2 + 'px';
//     player.style.left = positionX - player_rect.width / 2 + 'px';

//     // if ball x value less than scroll, scroll left
//     if (player_rect.x + (player_rect.width / 2) < 0) {
//         console.log("scrolling left")
//         window.scrollBy(-window.innerWidth, 0);
//         positionX -= player_rect.width;
//     } // else if ball x value greater than scroll, scroll right
//     else if (player_rect.x + (player_rect.width / 2) > window.innerWidth) {
//         console.log("scrolling right")
//         window.scrollBy(window.innerWidth, 0);
//         positionX += player_rect.width;
//     }

//     // End of section to rework


//     requestAnimationFrame(update);
// }

// document.addEventListener('keydown', function (event) {

//     if (keyState.CONTROL && keyState.SHIFT) {
//         return;
//     }

//     event.preventDefault();
//     let key = event.key.toUpperCase();
//     if (key == " ") key = "SPACE";

//     if (key == "A" && !keyState.A) {
//         player.style.transform = "rotate3d(0, 1, 0, 0deg)";
//         player.style.backgroundImage = "url('./img/cat_walk.gif')";
//         console.log("set_cat_walk")
//         if (velocityX > 0) velocityX *= -0.2;
//     }

//     if (key == "D" && !keyState.D) {
//         player.style.transform = "rotate3d(0, 1, 0, 180deg)";
//         player.style.backgroundImage = "url('./img/cat_walk.gif')";
//         console.log("set_cat_walk")
//         if (velocityX < 0) velocityX *= -0.2;
//     }

//     if ((key == "W" && !keyState.W) || (key == "SPACE" && !keyState.SPACE)) {
//         if (grounded) {
//             velocityY = -20;
//             if (grounded == 2 && keyState.A) {
//                 velocityX = 12;
//             } else if (grounded == 2 && keyState.D) {
//                 velocityX = -12;
//             }

//             grounded = 0;
//             player.style.backgroundImage = "url('./img/cat_jump.gif')";
//         } else if (airJumps > 0) {
//             console.log(airJumps + "th Air Jump Used!")
//             airJumps -= 1;
//             velocityY = -15;
//             player.style.backgroundImage = "url('./img/cat_jump.gif')";

//         }
//     }

//     if (key in keyState) {
//         keyState[key] = true;
//         recentInputs.push(key);
//         while (recentInputs.length > 20) recentInputs.shift();
//     }
// });

// document.addEventListener('mousedown', (event) => {
//     event.preventDefault();
//     if (event.button == 0) {
//         keyState["LEFT_CLICK"] = true;
//     } else if (event.button == 2) {
//         keyState["RIGHT_CLICK"] = true;
//     }
// });

// document.addEventListener('mouseup', (event) => {
//     if (event.button == 0) {
//         keyState["LEFT_CLICK"] = false;
//     } else if (event.button == 2) {
//         keyState["RIGHT_CLICK"] = false;
//     }
// });


// document.addEventListener('keyup', function (event) {
//     let key = event.key.toUpperCase();
//     if (key == " ") key = "SPACE";

//     if ((keyState.A && key == "A") || (keyState.D && key == "D")) {
//         grounded = 0;
//     }

//     if (key in keyState) {
//         keyState[key] = false;
//     }
// });

// document.addEventListener('mousemove', function (event) {
//     mouseX = event.clientX;
//     mouseY = event.clientY;
// });

// setInterval(() => {
//     let recentInputsNoNulls = recentInputs.filter((input) => input != null);

//     let sevenRecentInputs = [...recentInputsNoNulls];
//     while (sevenRecentInputs.length > 7) sevenRecentInputs.shift();
//     // Teleport Cheat
//     if (listsAreEqual(sevenRecentInputs, ["W", "W", "S", "W", "S", "W", "W"])) {
//         alert("Teleport Cheat Activated!");
//         document.addEventListener('click', (event) => {
//             console.log(event.pageX, event.pageY);
//             positionX = event.pageX;
//             positionY = event.pageY;
//             velocityX = 0;
//             velocityY = 0;
//         });
//         recentInputs[recentInputs.length] = "Cheat Activated";
//     }
//     // Toggle CRT Filter
//     if (listsAreEqual(sevenRecentInputs, ["D", "D", "A", "D", "A", "D", "D"])) {
//         if (document.getElementById("filter").classList.contains("hidden")) {
//             document.getElementById("filter").classList.remove("hidden");
//             document.getElementById("scroll-edge-left").style.backgroundColor = "black";
//             document.getElementById("scroll-edge-right").style.backgroundColor = "black";
//         } else {
//             document.getElementById("filter").classList.add("hidden");
//             document.getElementById("scroll-edge-left").style.backgroundColor = "transparent";
//             document.getElementById("scroll-edge-right").style.backgroundColor = "transparent";
//         }
//         recentInputs[recentInputs.length] = "Cheat Activated";
//     }

//     recentInputs[recentInputs.length] = null;
//     let fiveRecentInputs = [...recentInputs];
//     while (fiveRecentInputs.length > 5) fiveRecentInputs.shift();
//     //Cat fall asleep idle animation
//     if (listsAreEqual(fiveRecentInputs, [null, null, null, null, null,])) {
//         console.log("Cat fell asleep!")
//         player.style.backgroundImage = "url('./img/cat_fall_asleep.gif')";
//     }
//     while (recentInputs.length > 20) recentInputs.shift();
// }, 2000);

// const listsAreEqual = (list1, list2) => {
//     if (list1.length != list2.length) return false;
//     for (let i = 0; i < list1.length; i++) {
//         if (list1[i] != list2[i]) return false;
//     }
//     return true;
// }


// // requestAnimationFrame(update);
// let prevInnerWidth = window.innerWidth;
// const screenResize = () => {
//     let screens = document.getElementsByClassName("screen");
//     let screenIndex = 0;

//     // For each screen, set the left position to the screen's index times the window width
//     for (let i = 0; i < screens.length; i++) {
//         screens[i].style.left = (i * window.innerWidth) - 1 + "px";
//     }

//     document.body.style.width = screens.length * window.innerWidth + "px";
// }

// screenResize();

// window.onresize = (one) => {
//     console.log(one.target.innerWidth - prevInnerWidth);
//     positionX += (positionX / one.target.innerWidth) * (one.target.innerWidth - prevInnerWidth);
//     console.log()
//     // window.scrollBy(one.target.innerWidth - prevInnerWidth, 0);
//     prevInnerWidth = one.target.innerWidth;
//     screenResize();
// }


// window.onload = () => {
//     requestAnimationFrame(update);
//     setTimeout(() => {
//         document.getElementById("pipe-1").classList.add("wall");
//         window.scrollTo(0, 0);
//     }, 400);
// }