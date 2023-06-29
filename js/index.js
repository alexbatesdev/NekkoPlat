let cursor_balls = document.getElementsByClassName('ball');
let signs = document.getElementsByClassName('sign');
let sections = document.getElementsByClassName('section');
let walls = document.getElementsByClassName('wall');
let positionX = window.innerWidth / 2;
let positionY = window.innerHeight / 2;
let velocityX = 0;
let velocityY = 0;
let maxVelocity = 3;
let acceleration = 0.15;
let deceleration = 0.074;

let mouseX = 0;
let mouseY = 0;

let firstCLick = false;
let followMouse = false;

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

const toggleFollowMouse = () => {
    followMouse = !followMouse;
    if (followMouse) {
        for (let i = 0; i < signs.length; i++) {
            if (signs[i].querySelector(".secondary-text")) signs[i].querySelector(".secondary-text").innerHTML = "Click Me!"
        }
    } else {
        for (let i = 0; i < signs.length; i++) {
            if (signs[i].querySelector(".secondary-text")) signs[i].querySelector(".secondary-text").innerHTML = "Press Enter!"
        }
    }
}


//This is pretty much just my gameloop, not just element movement
const update = () => {
    if (!firstCLick) {
        positionX = window.innerWidth / 2;
        positionY = window.innerHeight / 2;
    }
    // console.log(keyState)
    const scopedMinSpeed = 5;
    const scopedStandardSpeed = 15;
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
                    acceleration = 0.3;
                    maxVelocity = 6;
                } else {
                    maxVelocity = 3;
                    acceleration = 0.15;
                }
                if (keyState.W && velocityY > -maxVelocity) velocityY -= acceleration;
                if (keyState.A && velocityX > -maxVelocity) velocityX -= acceleration;
                if (keyState.S && velocityY < maxVelocity) velocityY += acceleration;
                if (keyState.D && velocityX < maxVelocity) velocityX += acceleration;

                // Gradually decrease velocity when no keys are pressed
                if (!keyState.W && velocityY < 0) velocityY += deceleration;
                if (!keyState.A && velocityX < 0) velocityX += deceleration;
                if (!keyState.S && velocityY > 0) velocityY -= deceleration;
                if (!keyState.D && velocityX > 0) velocityX -= deceleration;
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
                velocityY = Math.sin(angle) * speed;

                // If the ball is going a certain speed, check for collision with a higher precision

            }

            // MOVEMENT CHUNK END --------------------------------------------------------------


            // if (velocityX > -0.15 && velocityX < 0.15) velocityX = 0;
            // if (velocityY > -0.15 && velocityY < 0.15) velocityY = 0;


            //if ball will be off screen next frame, stop the ball
            if (positionX + velocityX < 0) {
                velocityX = 0;
            }
            if (positionX + velocityX > window.innerWidth) {
                velocityX = 0;
            }

            if (positionY + velocityY < 0) {
                velocityY = 0;
            }

            // Check collision with each wall
            for (let j = 0; j < walls.length; j++) {
                if (walls[j].classList.contains('hidden')) continue;
                let wallRect = walls[j].getBoundingClientRect();

                let scalingFactor = Math.max(Math.abs(velocityX), Math.abs(velocityY));
                let stepSize = 1 / scalingFactor;

                const maxStepSize = 0.5;
                if (stepSize > maxStepSize) stepSize = maxStepSize;

                // console.log(velocityX, velocityY)
                // console.log(stepSize)

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
                        console.log("collision")
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

            // Now if you are ball-3 ignore all these calculations and set your position to the mouse position

            const velocityThreshold = 0.15;
            if (Math.abs(velocityX) < velocityThreshold) velocityX = 0;
            if (Math.abs(velocityY) < velocityThreshold) velocityY = 0;

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
        window.scrollBy(0, 10);
    }

    // if ball y value less than scroll, scroll up
    if (positionY < window.scrollY + scrollThreshold) {
        window.scrollBy(0, -10);
    }

    const maxSize = 300;
    const minSize = 100;
    const maxBlur = 120;
    const minBlur = 60;
    const ball = document.getElementById("ball-1");
    const ball_2 = document.getElementById("ball-2");
    const ballRect = ball.getBoundingClientRect();
    const prevBlur = parseInt(getComputedStyle(ball).getPropertyValue("--blur").replace("px", ""))
    const prevBlur_2 = parseInt(getComputedStyle(ball_2).getPropertyValue("--blur").replace("px", ""))
    if ((keyState.RIGHT_CLICK && followMouse) || (keyState.CONTROL && !followMouse)) {
        console.log(ballRect.width)
        if (ballRect.width < maxSize) {
            ball.style.setProperty("--ball-size", ballRect.width / 2 + 1 + "px")
            console.log("Growing")
        }
        if (prevBlur < maxBlur) {
            ball.style.setProperty("--blur", (prevBlur + 1) + "px")
            ball_2.style.setProperty("--blur", (prevBlur_2 + 1) + "px")
            console.log("Blurring")

        }
        if (scopedCurrentMaxSpeed > scopedMinSpeed) {
            scopedCurrentMaxSpeed -= 1;
        }

    } else {
        if (ballRect.width > minSize) {
            ball.style.setProperty("--ball-size", ballRect.width / 2 - 1 + "px")
            console.log("Shrinking")
            console.log(ballRect.width)
            console.log(ball.style.getPropertyValue("--ball-size"))
        }
        if (prevBlur > minBlur) {
            ball.style.setProperty("--blur", prevBlur - 1 + "px")
            ball_2.style.setProperty("--blur", prevBlur_2 - 1 + "px")
            console.log("Unblurring")
        }
        if (scopedCurrentMaxSpeed < scopedStandardSpeed) {
            scopedCurrentMaxSpeed += 1;
        }
    }
    if (ballRect.width > maxSize) {
        ball.style.setProperty("--ball-size", maxSize / 2 + "px")
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
            }

            // if start sign does not already have event listener, add one
            if (!signs[i].hasAttribute("hasListener")) {
                signs[i].setAttribute("hasListener", true);
                if (signs[i].id == "first-sign") signs[i].addEventListener("click", firstSignAction)
                if (signs[i].id === "start-sign") signs[i].addEventListener("click", startsignAction);
                if (signs[i].id === "end-sign") signs[i].addEventListener("click", mazeEndAction);
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

const firstSignAction = () => {
    toggleFollowMouse();
    firstCLick = true;

    const unhides = document.getElementById("part-1").querySelectorAll(".hidden-2");
    for (let i = 0; i < unhides.length; i++) {
        unhides[i].classList.remove("hidden-2");
    }

    const first_sign = document.getElementById("first-sign");
    first_sign.classList.add("hidden-2");
}

const mazeEndAction = () => {
    console.log("Congrats! You made it to the end of the maze!")
    const glow_cluster = document.getElementById("gc-1");
    glow_cluster.classList.remove("hidden-2");
    const glow_orbs = glow_cluster.querySelectorAll(".glow-orb");
    for (let i = 0; i < glow_orbs.length; i++) {
        glow_orbs[i].classList.remove("hidden-2");
    }
    const end_sign = document.getElementById("end-sign");
    end_sign.classList.add("hidden-2");
    const congrats_text = document.getElementById("congrats-text");
    congrats_text.classList.remove("hidden-2");
}



const startsignAction = () => {
    console.log("start sign action");
    document.getElementById("start-sign").innerHTML = "Proceed South"
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].id == "part-1") {
            // sections[i].style.display = "none";
        } else if (sections[i].id == "part-2") {
            showElement(sections[i]);
            showElement(sections[i + 1]);
            document.getElementById("wall-27").classList.add("hidden");
            // sections[i].classList.remove("hidden");
            // sections[i].querySelector(".maze").classList.remove("hidden");
            // sections[i].querySelectorAll(".wall.hidden").forEach((wall) => {
            //     wall.classList.remove("hidden");
            // })
        }
    }
}

document.addEventListener('keydown', function (event) {
    event.preventDefault();
    let key = event.key.toUpperCase();
    if (key in keyState) {
        keyState[key] = true;
    }
    if (key == "E") {
        document.addEventListener('click', (event) => {
            positionX = event.pageX;
            positionY = event.pageY;
            velocityX = 0;
            velocityY = 0;
        });
    }

    if (key == " ") {
        event.preventDefault();
        toggleFollowMouse();
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

//add hidden class to every item in a section
const hideElement = (element) => {
    let items = element.querySelectorAll("*");
    element.classList.add("hidden");
    for (let i = 0; i < items.length; i++) {
        items[i].classList.add("hidden");
    }
}

//remove hidden class to every item in a section
const showElement = (element) => {
    let items = element.querySelectorAll("*");
    element.classList.remove("hidden");
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove("hidden");
    }
}


let sectionsToHide = document.querySelectorAll(".section.hidden");
for (let i = 0; i < sectionsToHide.length; i++) {
    hideElement(sectionsToHide[i]);
}

requestAnimationFrame(update);


function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const changeColor = () => {
    // Colors are two shades of blue, and a green. The blues are each in twice to make them more likely to be chosen.
    let colors = ["#030dd8", "#41acd6", "#63d80c", "#030dd8", "#41acd6"]
    // let bgColor = getRandomColor();
    bgColor = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < cursor_balls.length; i++) {
        if (cursor_balls[i].id == "ball-3") continue;
        cursor_balls[i].style.setProperty('--background-color', bgColor);
    }
}

setInterval(changeColor, 4000);