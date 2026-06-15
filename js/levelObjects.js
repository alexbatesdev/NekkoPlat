import gameInstance from "./game.js";
import { debugLog } from "./tools.js";
import ToggleManager, { MultiStateManager } from "./elementStateManagers.js";
import { InventoryItem } from "./inventory.js";

export class LevelObject {
  constructor(element) {
    this.element = element;
    this.enabled = true;
    if (this.element.classList.contains("disabled")) {
      this.enabled = false;
      this.element.style.opacity = "0.5";
    }
  }

  update() {
    if (this.element.classList.contains("plax")) {
      this.calculateParallax();
    }
  }

  calculateParallax() {
    // Make this a CONFIGURABLE CONSTANT within the HTML setup
    // Where this goes?? I don't know yet
    const PARALLAX_SENSITIVITY = 10;
    let zIndex = null;
    for (let i = 0; i < this.element.classList.length; i++) {
      if (this.element.classList[i].includes("z")) {
        zIndex = this.element.style.zIndex;
      }
    }
    if (zIndex === null) {
      zIndex = this.element.computedStyleMap().get("z-index").value;
    }

    const parallaxSpeed = (parseInt(zIndex) / 100) * PARALLAX_SENSITIVITY;
    const playerCenterX =
      gameInstance.camera.element.getBoundingClientRect().left +
      gameInstance.camera.element.getBoundingClientRect().width / 2;
    const playerCenterY =
      gameInstance.camera.element.getBoundingClientRect().top +
      gameInstance.camera.element.getBoundingClientRect().height / 2;
    const objectCenterX =
      this.element.getBoundingClientRect().left +
      this.element.getBoundingClientRect().width / 2;
    const objectCenterY =
      this.element.getBoundingClientRect().top +
      this.element.getBoundingClientRect().height / 2;

    let xOffset = (playerCenterX - objectCenterX) * parallaxSpeed * -1;
    let yOffset = (playerCenterY - objectCenterY) * parallaxSpeed * -1;

    if (this.element.classList.contains("noplax-y")) {
      yOffset = 0;
    }
    if (this.element.classList.contains("noplax-x")) {
      xOffset = 0;
    }
    this.element.style.transform = `translate(${xOffset}px, ${yOffset}px) scale(${
      1 + parallaxSpeed
    })`;
  }
}

export class SolidObject extends LevelObject {
  constructor(element) {
    super(element);
  }

  reinitStyles() {
    if (gameInstance.debug) {
      this.element.style.outline = "3px solid red";
      this.element.style.outlineOffset = "-3px";
    } else {
      this.element.style.outline = "none";
    }
  }
}

export class OneWaySolidObject extends LevelObject {
  constructor(element) {
    super(element);
    const dirClass = Array.from(element.classList).find((cls) =>
      cls.startsWith("oneway-"),
    );
    this.direction = dirClass ? dirClass.split("-")[1] : "up";
    this.dropthrough = element.classList.contains("dropthrough");
    this.dropTimer = 0;
    this.initialBackgroundColor = this.element.style.backgroundColor;
  }

  update() {
    super.update();
    if (this.dropTimer > 0) this.dropTimer--;

    const rect = this.element.getBoundingClientRect();
    const playerRect = gameInstance.player.element.getBoundingClientRect();
    const rectCenterX = rect.left + rect.width / 2;
    const rectCenterY = rect.top + rect.height / 2;

    let shouldEnable = true;
    switch (this.direction) {
      case "up":
        shouldEnable =
          playerRect.bottom <= rectCenterY &&
          this.dropTimer === 0 &&
          gameInstance.player.velocityY >= 0;
        break;
      case "down":
        shouldEnable = playerRect.top >= rectCenterY;
        break;
      case "left":
        shouldEnable = playerRect.right <= rectCenterX;
        break;
      case "right":
        shouldEnable = playerRect.left >= rectCenterX;
        break;
    }
    this.enabled = shouldEnable;
    if (gameInstance.debug) {
      this.element.style.backgroundColor = this.enabled
        ? "rgba(0, 255, 0, 0.5)"
        : "rgba(255, 0, 0, 0.5)";
    } else {
      this.element.style.backgroundColor = this.initialBackgroundColor;
    }
  }
}

export class MovingPlatform extends LevelObject {
  constructor(element) {
    super(element);
    const pos = this.getCurrentTranslation();
    this.prevX = pos.x;
    this.prevY = pos.y;
  }

  getCurrentTranslation() {
    const style = window.getComputedStyle(this.element);
    const transform = style.transform;
    if (transform && transform !== "none") {
      const matrix = new DOMMatrixReadOnly(transform);
      return { x: matrix.m41, y: matrix.m42 };
    }
    return { x: 0, y: 0 };
  }

  update() {
    super.update();
    const pos = this.getCurrentTranslation();
    const deltaX = pos.x - this.prevX;
    const deltaY = pos.y - this.prevY;
    this.prevX = pos.x;
    this.prevY = pos.y;
    const player = gameInstance.player;
    if (player.grounded && player.groundedObject === this) {
      player.x += deltaX;
      player.y += deltaY;
      player.updateTransform();
    }
  }
}

export class SaggingPlatform extends LevelObject {
  constructor(element) {
    super(element);
    this.sagAmount = 8;
    this.sagDuration = 200;
    for (const cls of element.classList) {
      if (cls.startsWith("sag-time-")) {
        const duration = parseFloat(cls.slice(9));
        if (!isNaN(duration)) this.sagDuration = duration;
      } else if (cls.startsWith("sag-") && cls !== "sag-platform") {
        const amount = parseFloat(cls.slice(4));
        if (!isNaN(amount)) this.sagAmount = amount;
      }
    }
    this.element.style.transition = `transform ${this.sagDuration}ms ease`;
  }

  update() {
    const player = gameInstance.player;
    if (player.grounded && player.groundedObject === this) {
      this.element.style.transform = `translateY(${this.sagAmount}px)`;
    } else {
      this.element.style.transform = "translateY(0px)";
    }
    super.update();
  }
}

export class TriggerArea extends LevelObject {
  constructor(element) {
    super(element);
    this.element.style.pointerEvents = "none";
    if (this.element.classList.contains("disabled")) {
      this.enabled = false;
    }
  }

  trigger() {
    if (!this.enabled) return;
    if (this.element.classList.contains("once")) {
      this.enabled = false;
      this.element.classList.add("disabled");
    }
    // TODO: 🐢<(I am the TODO TURTLE)
    // If this trigger can be triggered multiple times, we probably
    // want a configurable cooldown to prevent it from triggering
    // multiple times in one frame
    debugLog("Triggered");
    this.element.click();
  }

  reinitStyles() {
    if (gameInstance.debug) {
      this.element.style.outline = "3px solid plum";
      this.element.style.outlineOffset = "-3px";
    } else {
      this.element.style.outline = "none";
    }
  }
}

export class InteractableObject extends LevelObject {
  constructor(element) {
    super(element);
    if (this.element.classList.contains("clickable")) {
      this.element.addEventListener("pointerup", () => {
        this.interact();
      });
      this.element.style.cursor = "pointer";
    } else {
      this.element.style.pointerEvents = "none";
    }
  }

  interact() {
    if (!this.enabled) return;
    debugLog("Interacted");
    debugLog(this.element);
    this.element.click();
  }

  update() {
    if (gameInstance.debug) {
      this.element.style.outline = "3px solid blue";
    } else {
      this.element.style.outline = "none";
    }
  }
}

export class InteractableToggle extends InteractableObject {
  constructor(element) {
    super(element);
    this.stateManager = new ToggleManager(element);
  }

  interact() {
    if (!this.enabled) return;
    this.stateManager.toggle();
  }
}

export class Reciever extends LevelObject {
  constructor(element) {
    super(element);
    this.signals = [];
    //Array.from(this.element.querySelectorAll('.signal')).map(signal => signal.classList[1]);
    Array.from(this.element.children).forEach((child) => {
      child.classList.forEach((className) => {
        if (className.includes("signal-")) {
          this.signals.push(className.split("-")[1]);
        }
      });
    });
    this.broadcastChannel = "";
    this.element.querySelectorAll(".broadcast").forEach((element) => {
      element.style.display = "none";
      element.classList.forEach((className) => {
        if (className.includes("channel-")) {
          this.broadcastChannel = className.split("-")[1];
        }
      });
    });
    this.stateManager = new MultiStateManager(
      element,
      this.signals,
      this.signals[0],
    );
    this.stateManager.listenToBroadcast(this.broadcastChannel);
  }

  update() {
    if (gameInstance.debug) {
      this.element.style.outline = "3px solid purple";
    } else {
      this.element.style.outline = "none";
    }
  }
}

export class ItemPickup extends LevelObject {
  constructor(element) {
    super(element);
    this.element.onclick = () => this.pickup();

    // Disable the pickup if it's already in the player's inventory and not meant to respawn
    if (
      !this.element.classList.contains("respawn") &&
      gameInstance.player.inventory.pickupIDs.includes(this.element.id)
    ) {
      this.enabled = false;
    }

    // Hide the pickup if it's disabled and not meant to show a ghost
    if (!this.enabled && !this.element.classList.contains("show-ghost")) {
      this.element.style.opacity = "0";
    }
  }

  pickup() {
    if (!this.enabled) return;
    this.enabled = false;
    this.element.click();
    
    let itemName = "";
    for (let i = 0; i < this.element.classList.length; i++) {
      if (this.element.classList[i].includes("name-")) {
        itemName = this.element.classList[i].replace("name-", "");
      }
    }
    // TODO: 🐢
    // This onClick extraction will need a different approach.
    // The item pickup's onClick is used for the "pickup" action,
    // meaning the actual item's onClick will need to be stored elsewhere
    // I'm thinking I might want to rethink the item structure so that item
    // definitions are separate from their in-game representations, 
    // which would solve this problem and also make it easier to manage item data in general


    // const onClick = this.element.onclick;
    // let onClickString;
    // if (onClick) {
    //   onClickString = onClick.toString();
    //   onClickString = onClickString.replace("function", "");
    //   onClickString = onClickString.replace(/\(.*?\)/, "");
    // }
    const inspectElement = this.element.querySelector(".inspectElement");
    const iconElement = this.element.querySelector(".iconElement");
    const description = this.element.querySelector(".description").innerHTML;
    const count = parseInt(this.element.querySelector(".count").innerHTML);
    const item = new InventoryItem(
      itemName,
      this.element.id,
      description,
      count,
      iconElement,
      inspectElement,
      // onClickString,
    );
    this.element.remove();
    if (this.element.classList.contains("instant-use")) {
      // item.triggerOnClick();
      return;
    }
    gameInstance.player.inventory.addItem(item);
  }
}

// export const ItemPickupMixin = Base => class extends Base {
//     constructor() {
//         super();
//         this.element = null;
//         this.isTrigger = false;
//         this.isInteractable = false;
//         this.isClickable = false;
//     }

//     initializeElement(element) {
//         this.element = element;

//         // Determine behavior based on class list
//         this.isTrigger = this.element.classList.contains('on-touch');
//         this.isInteractable = this.element.classList.contains('on-interact');
//         this.isClickable = this.element.classList.contains('on-click');

//         // Set pointer events and styles
//         if (this.isClickable) {
//             this.element.style.pointerEvents = 'auto';
//             this.element.style.cursor = 'pointer';
//             // this.element.addEventListener('pointerup', () => this.interact());
//         } else {
//             this.element.style.pointerEvents = 'none';
//         }

//         if (this.element.classList.contains('disabled')) {
//             this.enabled = false;
//             this.element.style.opacity = '0.5';
//         }

//         if (!this.element.classList.contains('respawn') && player.inventory.pickupIDs.includes(this.element.id)) {
//             this.enabled = false;
//             if (this.element.classList.contains('show-ghost')) {
//                 this.element.style.opacity = '0.5';
//             } else {
//                 this.element.style.display = 'none';
//             }
//         }
//     }

//     reinitStyles() {
//         if (gameInstance.debug) {
//             this.element.style.outline = '3px solid green';
//             this.element.style.outlineOffset = '-3px';
//         } else {
//             this.element.style.outline = 'none';
//         }
//     }

//     trigger() {
//         if (!this.enabled || !this.isTrigger) return;
//         this.pickup();
//     }

//     interact() {
//         if (!this.enabled || !this.isInteractable) return;
//         this.pickup();
//     }

//     pickup() {
//         this.enabled = false;
//         this.element.click();
//         const itemElement = this.element.querySelector('.item')
//         let itemName = "";
//         // extract item name from name-ITEMNAME class
//         for (let i = 0; i < itemElement.classList.length; i++) {
//             if (itemElement.classList[i].includes('name-')) {
//                 itemName = itemElement.classList[i].replace('name-', '');
//             }
//         }
//         const onClick = itemElement.onclick
//         // convert onClick to a string
//         let onClickString;
//         if (onClick) {
//             onClickString = onClick.toString();
//             // remove the function keyword and the parameters
//             onClickString = onClickString.replace('function', '');
//             onClickString = onClickString.replace(/\(.*?\)/, '');
//         }
//         const inspectElement = itemElement.querySelector('.inspectElement')
//         const iconElement = itemElement.querySelector('.iconElement')
//         const description = itemElement.querySelector('.description').innerHTML
//         const count = parseInt(itemElement.querySelector('.count').innerHTML)
//         const item = new InventoryItem(itemName, this.element.id, description, count, iconElement, inspectElement, onClickString);
//         this.element.remove();
//         if (this.element.classList.contains('instant-use')) {
//             item.triggerOnClick();
//             return;
//         }
//         player.inventory.addItem(item)
//     }
// };
// ItemPickupMixin.tags = ['collision', 'trigger', 'interactable'];

// USE THIS AS A BASE FOR OTHER INTERACTABLE OBJECTS
// Effect Area - an object that does something when the player enters it
// Features:
// - Run javascript code on player overlap
// - Run javascript code on player interaction
// Interactable Toggle - an object that toggles between two states on interaction
// Features:
// - Toggle between two states on interaction
// - Trigger other objects on toggle
// Interactable Button - an object that triggers other objects on interaction
// Features:
// - Trigger other objects on interaction

// Floor - a solid object that the player can stand on
// Features:
// - Automatically places itself at the bottom of the screen

// One Way SolidObject - a solidObject that can be passed through in one direction
// Features:
// - Can be passed through in one direction
// - Can't be passed through in the other direction
// - Vertical or horizontal orientation

// Moving platform - a type of solidObject that moves
// Easy example of extending a class
// Features:
// - Move between two points
// - Carry player

// Sign - an interactable object that displays a message
// Features:
// - Display on interaction
// - Display on player overlap
// - Pause game on interaction-display

// Door - an interactable object that changes player location
// Instead of making a "door" object,
// I just made an interactable that changes player location with the onclick event
// Less code, more flexibility, same result, I daresay more elegant
// Features:
// - Teleport player on interaction
//   - Teleport to coordinates
//   - Teleport to linked door? (optional)
// - Change level on interaction

// Hazard - an object that teleports player to a checkpoint on collision
// This should just be an effect area that teleports the player with the onclick
// This is because the player can't die
// Features:
// - Teleport player on collision
//   - Teleport to coordinates
//   - Teleport to checkpoint? (optional)
// - Display a message on collision (optional)

// Box - an object that can be pushed by the player
// https://chatgpt.com/c/81b5a9bb-778d-4388-8d13-b3ebd16a8895
// ChatGPT answer is probably wrong but on the right track
// Features:
// - Can rotate based on physics calculations
// - Can be pushed by player
// - Stops on collision with solidObject
// - Pushes other boxes
// - Pushes player
// - Pushes other objects
// - Falls off ledges
// - Can be pulled by player (maybe)
// - Can be picked up by player (maybe)
// - Can be thrown by player (maybe)

// Classic Mario Block - an object that changes state on collision
// Features:
// - Change state on collision
// - Choose direction impact is needed for state change
