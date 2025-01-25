const syncBackgrounds = () => {
    const backgroundWidth = 150;
    // const aspectRatio = 1.14285714;
    const backgroundHeight = 131.25 // backgroundWidth / aspectRatio //= 842.943201376;


    const backgrounds = document.getElementsByClassName("hexBackground");
    for (let i = 0; i < backgrounds.length; i++) {
        const element = backgrounds[i];
        const elementRect = element.getBoundingClientRect();
        console.log(elementRect.x, elementRect.y, elementRect.width, elementRect.height)
        element.style.backgroundPositionX = "-" + elementRect.x + "px";
        element.style.backgroundPositionY = "-" + elementRect.y + "px";
        element.style.setProperty("--background-size", backgroundWidth + "px")
        element.style.setProperty("--starting-position", (elementRect.x * -1) + "px " + (elementRect.y * -1) + "px");
        element.style.setProperty("--ending-position", ((elementRect.x * -1) + backgroundWidth) + "px " + ((elementRect.y * -1) + backgroundHeight) + "px");
        element.style.animation = "background-scroll 15s linear infinite"
    }
}

syncBackgrounds();
window.addEventListener("resize", syncBackgrounds)