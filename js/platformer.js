let player = document.getElementById('player');

let walls = document.getElementsByClassName('wall');
let positionX = window.innerWidth / 2;
let positionY = 0;
let velocityX = 0;
let velocityY = 0;
let maxVelocity = 3;
let acceleration = 0.15;
let deceleration = 0.074;
let airJumps = 0;
let maxAirJumps = 1;
let airborn = false;
let recentInputs = [];
let warping = false;

let keyState = {
    W: false,
    A: false,
    S: false,
    D: false,
    SHIFT: false,
    ENTER: false,
    E: false,
    LEFT_CLICK: false,
    RIGHT_CLICK: false,
    CONTROL: false,
};


// TODO ---------------------- 1. Seperate Ball logic from platformer logic for everything lower than this line
const update = () => {
    if (!firstCLick) {
        positionX = window.innerWidth / 2;
        positionY = window.innerHeight / 2;
    }
    // console.log(keyState)
    const scopedMinSpeed = 5;
    const scopedStandardSpeed = 25;
    let scopedCurrentMaxSpeed = scopedStandardSpeed;

    for (let i = 0; i < cursor_balls.length; i++) {
        let ballRect = cursor_balls[i].getBoundingClientRect();
        if (cursor_balls[i].id == "ball-3") {
            cursor_balls[i].style.top = mouseY + scrollY - (ballRect.height / 2) + 'px';
            cursor_balls[i].style.left = mouseX - (ballRect.width / 2) + 'px';
            continue;
        }


        if (cursor_balls[i].id == "ball-1") {
            cursor_balls[i].style.top = positionY - (ballRect.height / 2) + "px";
            cursor_balls[i].style.left = positionX - (ballRect.width / 2) + "px";
            continue;
        }


        if (cursor_balls[i].id == "ball-2") {

            // MOVEMENT CHUNK --------------------------------------------------------------
            let scopedSpeed = 0;
            // Update velocity based on key states
            if (!followMouse) {
                if (keyState.SHIFT) {
                    acceleration = 0.5;
                    maxVelocity = 6;
                } else {
                    maxVelocity = 3;
                    acceleration = 0.25;
                }
                if (keyState.W && velocityY > -maxVelocity) velocityY -= acceleration;
                if (keyState.A && velocityX > -maxVelocity * (doGravity ? 2.4 : 1)) velocityX -= acceleration * (doGravity ? 2.4 : 1);
                if (keyState.S && velocityY < maxVelocity) velocityY += acceleration;
                if (keyState.D && velocityX < maxVelocity * (doGravity ? 2.4 : 1)) velocityX += acceleration * (doGravity ? 2.4 : 1);


                // Gradually decrease velocity when no keys are pressed
                if (!airborn && !keyState.W && velocityY < 0) velocityY += (deceleration * (doGravity ? 2 : 1));
                if (!airborn && !keyState.A && velocityX < 0) velocityX += (deceleration * (doGravity ? 2.3 : 1));
                if (!airborn && !keyState.S && velocityY > 0) velocityY -= (deceleration * (doGravity ? 2 : 1));
                if (!airborn && !keyState.D && velocityX > 0) velocityX -= (deceleration * (doGravity ? 2.3 : 1));
            } else {
                // Ball Following Mouse
                let ballX = cursor_balls[i].getBoundingClientRect().x;
                let ballY = cursor_balls[i].getBoundingClientRect().y;
                let ballWidth = cursor_balls[i].getBoundingClientRect().width;
                let ballHeight = cursor_balls[i].getBoundingClientRect().height;
                let deltaX = Math.floor(mouseX - (ballX + ballWidth / 2));
                let deltaY = Math.floor(mouseY - (ballY + ballHeight / 2));
                let distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
                let angle = Math.atan2(deltaY, deltaX);
                if (keyState.LEFT_CLICK) {
                    scopedCurrentMaxSpeed = 20;
                } else {
                    scopedCurrentMaxSpeed = scopedStandardSpeed;
                }

                let speed = (Math.min((2 * distance) / 20, scopedCurrentMaxSpeed)) * (keyState.LEFT_CLICK ? 1.5 : 1.0);
                if (distance > 10000) {
                    speed = 0;
                    positionX = mouseX;
                    positionY = mouseY;
                }

                scopedSpeed = speed;
                velocityX = Math.cos(angle) * speed;
                velocityY = (Math.sin(angle) * speed);



            }

            // MOVEMENT CHUNK END --------------------------------------------------------------


            if (doGravity) {
                if (velocityY < 0 && keyState.W) {
                    velocityY += 0.7;
                } else {
                    velocityY += 1;
                }
            }


            //if ball will be off screen next frame, stop the ball
            if (positionX + velocityX < 0) {
                velocityX = 0;
            }

            if (positionY + velocityY < 0) {
                velocityY = 0;
            }

            // Check collision with each wall
            for (let j = 0; j < walls.length; j++) {
                if (walls[j].classList.contains('hidden')) continue;
                if (warping && walls[j].classList.contains("pipe")) {
                    console.log("sKIPPING COLLision")
                    continue;
                }
                let wallRect = walls[j].getBoundingClientRect();

                let scalingFactor = Math.max(Math.abs(velocityX), Math.abs(velocityY));
                let stepSize = 1 / scalingFactor;

                const maxStepSize = 0.5;
                if (stepSize > maxStepSize) stepSize = maxStepSize;

                let deltaX = velocityX * stepSize;
                let deltaY = velocityY * stepSize;


                let tempBallX = ballRect.x;
                let tempBallY = ballRect.y;
                for (let k = 0; k < 1; k += stepSize) {
                    // If where the ball will be next frame is inside the wall, stop the ball
                    if (
                        tempBallX + deltaX < wallRect.x + wallRect.width &&
                        tempBallX + ballRect.width + deltaX > wallRect.x &&
                        tempBallY + deltaY < wallRect.y + wallRect.height &&
                        tempBallY + ballRect.height + deltaY > wallRect.y
                    ) {
                        let collisionType = null;
                        if (tempBallX + ballRect.width + deltaX > wallRect.x && tempBallX + deltaX < wallRect.x) collisionType = "right";
                        if (tempBallX + deltaX < wallRect.x + wallRect.width && tempBallX + ballRect.width + deltaX > wallRect.x + wallRect.width) collisionType = "left";
                        if (tempBallY + ballRect.height + deltaY > wallRect.y && tempBallY + deltaY < wallRect.y) collisionType = "bottom";
                        if (tempBallY + deltaY < wallRect.y + wallRect.height && tempBallY + ballRect.height + deltaY > wallRect.y + wallRect.height) collisionType = "top";

                        if (collisionType == "right" || collisionType == "left") {
                            airborn = false;
                            if (velocityY > 0) {
                                velocityY *= 0.5;

                            } else {
                                if (keyState.W) {
                                    velocityX += collisionType == "right" ? -12 : 12;
                                }
                            }
                        }

                        if (collisionType == "bottom") {
                            if (doGravity) {
                                airJumps = maxAirJumps;
                                airborn = false;
                                if (velocityX != 0) {
                                    let ball_2 = document.getElementById("ball-2");
                                    ball_2.style.backgroundImage = "url('./img/cat_walk.gif')";
                                }
                                if (keyState.S) {
                                    console.log(ballRect.x)
                                    if (walls[j].classList.contains("pipe")) {
                                        let pipeRect = walls[j].getBoundingClientRect();
                                        let pipeX = pipeRect.x;
                                        let pipeY = pipeRect.y;
                                        let pipeWidth = pipeRect.width;
                                        let pipeHeight = pipeRect.height;
                                        let pipeCenterX = pipeX + (pipeWidth / 2);
                                        let pipeCenterY = pipeY + (pipeHeight / 2);
                                        let ballCenterX = ballRect.x + (ballRect.width / 2);
                                        let ballCenterY = ballRect.y + (ballRect.height / 2);

                                        console.log(pipeCenterX)

                                        if (ballCenterX < pipeCenterX) {
                                            velocityX += 0.5;
                                        } else {
                                            velocityX -= 0.5;
                                        }

                                        if (ballCenterX > pipeCenterX - 10 && ballCenterX < pipeCenterX + 10) {
                                            velocityX = 0;
                                            warping = true;

                                            setInterval(() => {
                                                warping = false;
                                                window.location.href = "./platformer.html";
                                            }, 1000);
                                        }


                                    }
                                }
                            }
                        }

                        // Check if the ball is already inside the wall
                        if (
                            ballRect.x >= wallRect.x &&
                            ballRect.x + ballRect.width <= wallRect.x + wallRect.width &&
                            ballRect.y >= wallRect.y &&
                            ballRect.y + ballRect.height <= wallRect.y + wallRect.height
                        ) {
                            // Ball is already inside the wall, reflect the velocity based on the wall's position
                            if (velocityX > 0 && tempBallX + ballRect.width >= wallRect.x) velocityX = 5 * -velocityX;
                            if (velocityX < 0 && tempBallX <= wallRect.x + wallRect.width) velocityX = 5 * -velocityX;
                            if (velocityY > 0 && tempBallY + ballRect.height >= wallRect.y) velocityY = 5 * -velocityY;
                            if (velocityY < 0 && tempBallY <= wallRect.y + wallRect.height) velocityY = 5 * -velocityY;
                            console.log("Ball in Wall")
                            break;
                        } else {

                            // Ball is entering the wall, stop the ball
                            if (tempBallX + ballRect.width < wallRect.x + 10 && velocityX > 0) velocityX = 0;
                            if (tempBallX > wallRect.x + wallRect.width - 10 && velocityX < 0) velocityX = 0;
                            if (tempBallY + ballRect.height < wallRect.y + 10 && velocityY > 0) velocityY = 0;
                            if (tempBallY > wallRect.y + wallRect.height - 10 && velocityY < 0) velocityY = 0;



                            break;
                        }
                    }

                    // Update the ball's position for the next step
                    tempBallX += deltaX;
                    tempBallY += deltaY;
                }
            }

            // Update position based on velocity
            positionX += velocityX;
            positionY += velocityY;

            const velocityThreshold = 0.2;
            if (Math.abs(velocityX) < velocityThreshold) velocityX = 0;
            if (Math.abs(velocityY) < velocityThreshold) velocityY = 0;

            if (velocityX == 0 && velocityY == 0 && doGravity && !keyState.A && !keyState.D) {
                let ball_2 = document.getElementById("ball-2");
                if (!listsAreEqual(recentInputs, [null, null, null, null, null,])) {
                    ball_2.style.backgroundImage = "url('./img/cat_stand.gif')";
                }
            }

            cursor_balls[i].style.top = positionY - ballRect.height / 2 + 'px';
            cursor_balls[i].style.left = positionX - ballRect.width / 2 + 'px';
        }

        syncBackgrounds();
    }

    let scrollThreshold = 100;

    if (!followMouse) {
        scrollThreshold = 200;
    }

    // if ball y value greater than window height + scroll, scroll down
    if (positionY > window.innerHeight + window.scrollY - scrollThreshold) {
        window.scrollBy(0, (velocityY > 0) ? velocityY : 10);
    }

    // if ball y value less than scroll, scroll up
    if (positionY < window.scrollY + scrollThreshold && !doGravity) {
        window.scrollBy(0, (velocityY < 0) ? velocityY : -10);
    }
    const ball_2 = document.getElementById("ball-2");
    const ball_2_rect = ball_2.getBoundingClientRect();

    let scrollLeftBoundary = document.getElementById("scroll-edge-left").getBoundingClientRect();
    let scrollRightBoundary = document.getElementById("scroll-edge-right").getBoundingClientRect();

    // Get root css variable values
    let sectionBodyWidth = getComputedStyle(document.documentElement).getPropertyValue("--section-body-width").replace("px", "");

    // if ball x value less than scroll, scroll left
    if (ball_2_rect.x < scrollLeftBoundary.right && doGravity) {
        window.scrollBy(velocityX < 0 ? -sectionBodyWidth : 0, 0);
        positionX -= ball_2_rect.width;
        console.log("scrolling left")
    }

    // if ball x value greater than scroll, scroll right
    if (ball_2_rect.x + ball_2_rect.width > scrollRightBoundary.left && doGravity) {
        window.scrollBy(velocityX > 0 ? sectionBodyWidth : 0, 0);
        positionX += ball_2_rect.width;
        console.log("scrolling right")
    }

    const maxSize = 300;
    const minSize = 100;
    const maxBlur = 120;
    const minBlur = 60;
    const ball = document.getElementById("ball-1");
    const ballRect = ball.getBoundingClientRect();
    const prevBlur = parseInt(getComputedStyle(ball).getPropertyValue("--blur").replace("px", ""))
    const prevBlur_2 = parseInt(getComputedStyle(ball_2).getPropertyValue("--blur").replace("px", ""))
    if ((keyState.RIGHT_CLICK && followMouse) || (keyState.CONTROL && !followMouse)) {
        console.log(ballRect.width)
        if (ballRect.width < maxSize) {
            ball.style.setProperty("--ball-size", ballRect.width / 2 + 1 + "px")

        }
        if (prevBlur < maxBlur) {
            ball.style.setProperty("--blur", (prevBlur + 1) + "px")
            ball_2.style.setProperty("--blur", (prevBlur_2 + 1) + "px")


        }
        if (scopedCurrentMaxSpeed > scopedMinSpeed) {
            scopedCurrentMaxSpeed -= 1;
        }

    } else {
        if (ballRect.width > minSize) {
            ball.style.setProperty("--ball-size", ballRect.width / 2 - 2 + "px")
        }
        if (prevBlur > minBlur) {
            ball.style.setProperty("--blur", prevBlur - 1 + "px")
            ball_2.style.setProperty("--blur", prevBlur_2 - 1 + "px")
        }
        if (scopedCurrentMaxSpeed < scopedStandardSpeed) {
            scopedCurrentMaxSpeed += 1;
        }
    }


    // if element overlapping sign, change sign text and allow click/press enter action
    for (let i = 0; i < signs.length; i++) {
        let signX = signs[i].getBoundingClientRect().x;
        let signY = signs[i].getBoundingClientRect().y;
        let signWidth = signs[i].getBoundingClientRect().width;
        let signHeight = signs[i].getBoundingClientRect().height;
        const checkedBall = document.getElementById("ball-2");
        let ballX = checkedBall.getBoundingClientRect().x;
        let ballY = checkedBall.getBoundingClientRect().y;
        let ballWidth = checkedBall.getBoundingClientRect().width;
        let ballHeight = checkedBall.getBoundingClientRect().height;
        if (ballX < signX + signWidth && ballX + ballWidth > signX && ballY < signY + signHeight && ballY + ballHeight > signY) {
            if (signs[i].querySelector(".secondary-text")) signs[i].querySelector(".secondary-text").classList.remove("hidden");
            if (signs[i].querySelector(".primary-text")) signs[i].querySelector(".primary-text").classList.add("hidden");

            // if enter key pressed, start sign action
            if (!followMouse && keyState["ENTER"]) {
                console.log("button pressed by enter")
                if (signs[i].id === "start-sign") startsignAction();
                if (signs[i].id === "end-sign") mazeEndAction();
                if (signs[i].id === "start-platformer-sign") activatePlatformerMode();
            }

            // if start sign does not already have event listener, add one
            if (!signs[i].hasAttribute("hasListener")) {
                signs[i].setAttribute("hasListener", true);
                if (signs[i].id == "first-sign") signs[i].addEventListener("click", firstSignAction)
                if (signs[i].id === "start-sign") signs[i].addEventListener("click", startsignAction);
                if (signs[i].id === "end-sign") signs[i].addEventListener("click", mazeEndAction);
                if (signs[i].id === "start-platformer-sign") signs[i].addEventListener("click", activatePlatformerMode);
            }


        } else {
            if (signs[i].querySelector(".secondary-text")) signs[i].querySelector(".secondary-text").classList.add("hidden");
            if (signs[i].querySelector(".primary-text")) signs[i].querySelector(".primary-text").classList.remove("hidden");

            signs[i].removeAttribute("hasListener");
            signs[i].removeEventListener("click", firstSignAction)
            signs[i].removeEventListener("click", startsignAction);
            signs[i].removeEventListener("click", mazeEndAction);

        }

    }

    requestAnimationFrame(update);
}

const activatePlatformerMode = () => {
    doGravity = true;
    deceleration = 0.1;
    followMouse = false;
    document.getElementById("filter").classList.remove("hidden");

    let ball_2 = document.getElementById("ball-2");


    ball_2.classList.remove("glow-orb-2");
    ball_2.classList.remove("hexBackground");
    ball_2.style.animation = "none";
    // Move to a class
    ball_2.style.border = "none";
    ball_2.style.backgroundColor = "transparent";
    ball_2.style.backgroundImage = "url('./img/cat_stand.gif')";
    ball_2.style.backgroundSize = "cover";
    ball_2.style.backgroundPosition = "center";
    ball_2.style.imageRendering = "pixelated";
    ball_2.style.borderRadius = "25%";
    ball_2.style.zIndex = "5";
    document.getElementById("space-1").classList.remove("hidden-2");
    document.getElementById("space-2").classList.remove("hidden-2");
    document.getElementById("space-3").classList.remove("hidden-2");
    document.getElementById("surface").classList.remove("hidden-2");
    document.getElementById("scroll-edge-left").classList.remove("hidden-3");
    document.getElementById("scroll-edge-right").classList.remove("hidden-3");

    let ball_1 = document.getElementById("ball-1");
    ball_1.style.display = "none";

    document.title = "Nekko's Journey to the right";
}

document.addEventListener('keydown', function (event) {
    event.preventDefault();
    let key = event.key.toUpperCase();
    let ball_2 = document.getElementById("ball-2");

    if (doGravity) {

        if (key == "A" && !keyState.A) {
            ball_2.style.transform = "rotate3d(0, 1, 0, 0deg)";
            ball_2.style.backgroundImage = "url('./img/cat_walk.gif')";
            console.log("set_cat_walk")
            if (velocityX > 0) velocityX *= -0.2;
        }

        if (key == "D" && !keyState.D) {
            ball_2.style.transform = "rotate3d(0, 1, 0, 180deg)";
            ball_2.style.backgroundImage = "url('./img/cat_walk.gif')";
            console.log("set_cat_walk")
            if (velocityX < 0) velocityX *= -0.2;
        }

        if (key == "W" && !keyState.W) {
            console.log("Airborn: " + airborn)
            if (!airborn) {
                velocityY = -24;
                airborn = true;
                ball_2.style.backgroundImage = "url('./img/cat_jump.gif')";
            } else if (airJumps > 0) {
                console.log(airJumps + "th Air Jump Used!")
                airJumps -= 1;
                velocityY = -24;
                ball_2.style.backgroundImage = "url('./img/cat_jump.gif')";

            }
        }
    }


    if (key == "E") {
        document.addEventListener('click', (event) => {
            console.log(event.pageX, event.pageY);
            positionX = event.pageX;
            positionY = event.pageY;
            velocityX = 0;
            velocityY = 0;
        });
    }

    if (key == " ") {
        toggleFollowMouse();
    }

    if (key in keyState) {
        keyState[key] = true;
        recentInputs.push(key);
    }
});

document.addEventListener('click', function (event) {
    console.log(event.pageX, event.pageY);
    console.log(cursor_balls);
    for (let i = 0; i < cursor_balls.length; i++) {
        console.log("Ball " + (i + 1))
        console.log("X: " + cursor_balls[i].getBoundingClientRect().x + " Y: " + cursor_balls[i].getBoundingClientRect().y);
        console.log("Width: " + cursor_balls[i].getBoundingClientRect().width + " Height: " + cursor_balls[i].getBoundingClientRect().height);

    }
});

document.addEventListener('mousedown', (event) => {
    event.preventDefault();
    if (event.button == 0) {
        keyState["LEFT_CLICK"] = true;
    } else if (event.button == 2) {
        keyState["RIGHT_CLICK"] = true;
    }
});

document.addEventListener('mouseup', (event) => {
    if (event.button == 0) {
        keyState["LEFT_CLICK"] = false;
    } else if (event.button == 2) {
        keyState["RIGHT_CLICK"] = false;
    }
});


document.addEventListener('keyup', function (event) {
    let key = event.key.toUpperCase();
    if (key in keyState) {
        keyState[key] = false;
    }
});

document.addEventListener('mousemove', function (event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

setInterval(() => {
    if (!doGravity) return;

    recentInputs[recentInputs.length] = null;
    while (recentInputs.length > 5) recentInputs.shift();
    if (listsAreEqual(recentInputs, [null, null, null, null, null,])) {
        console.log("Cat fell asleep!")
        let ball_2 = document.getElementById("ball-2");
        ball_2.style.backgroundImage = "url('./img/cat_fall_asleep.gif')";
    }
    console.log(recentInputs);
}, 2000);

const listsAreEqual = (list1, list2) => {
    if (list1.length != list2.length) return false;
    for (let i = 0; i < list1.length; i++) {
        if (list1[i] != list2[i]) return false;
    }
    return true;
}