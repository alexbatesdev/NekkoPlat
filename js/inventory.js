import gameInstance from "./game.js";
import { loadInventoryItemFragment } from "./tools.js"

export default class Inventory {
  constructor() {
    this.pickupIDs = [];
    this.itemsList = [];
    this.syncToInventory();
    this.HUD = new HUD(this);
  }

  // Sync itemsList with localstorage
  syncToLocalStorage() {
    localStorage.setItem("itemsList", JSON.stringify(this.itemsList));
  }

  // Sync localstorage with itemsList
  syncToInventory() {
    // Check if localstorage is empty
    if (localStorage.getItem("itemsList") === null) {
      this.itemsList = [];
    } else {
      const storedItems = JSON.parse(localStorage.getItem("itemsList"));
      this.itemsList = storedItems.map((itemData) =>
        this.normalizeItem(itemData),
      );
      for (let i = 0; i < this.itemsList.length; i++) {
        const item = this.itemsList[i];
        const pickupIDs = Array.isArray(item.pickupIDs)
          ? item.pickupIDs
          : item.pickupID
            ? [item.pickupID]
            : [];
        this.pickupIDs = this.pickupIDs.concat(pickupIDs);
        // Remove duplicate pickupIDs
        this.pickupIDs = [...new Set(this.pickupIDs)];
      }
    }
  }

  normalizeItem(item) {
    if (item instanceof InventoryItem) {
      this.attachInventory(item);
      return item;
    }

    const pickupIDs = Array.isArray(item.pickupIDs)
      ? item.pickupIDs
      : item.pickupID
        ? [item.pickupID]
        : [];

    const normalizedItem = new InventoryItem(
      item.name,
      pickupIDs,
      item.description,
      item.count,
      item.iconElement,
      item.inspectElement,
      item.onclick,
      item.tags || [],
    );

    this.attachInventory(normalizedItem);
    return normalizedItem;
  }

  attachInventory(item) {
    if (!item || typeof item !== "object") {
      return;
    }

    Object.defineProperty(item, "inventory", {
      value: this,
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }

  // Add item to the inventory
  addItem(item) {
    const normalizedItem = this.normalizeItem(item);
    normalizedItem.inspectElement =
      normalizedItem.inspectElement &&
      typeof normalizedItem.inspectElement === "object"
        ? normalizedItem.inspectElement.outerHTML
        : normalizedItem.inspectElement;
    normalizedItem.iconElement =
      normalizedItem.iconElement &&
      typeof normalizedItem.iconElement === "object"
        ? normalizedItem.iconElement.outerHTML
        : normalizedItem.iconElement;

    // Check if item is already in the inventory
    const existingItem = this.itemsList.find(
      (i) => i.name === normalizedItem.name,
    );
    if (existingItem) {
      existingItem.count += normalizedItem.count;
      existingItem.pickupIDs.push(normalizedItem.pickupID);
      // Remove duplicate pickupIDs
      existingItem.pickupIDs = [...new Set(existingItem.pickupIDs)];
      // Update the HUD count for the item
      this.HUD.updateCountForItem(normalizedItem.name);
    } else {
      const pickupID = normalizedItem.pickupID;
      delete normalizedItem.pickupID;
      normalizedItem.pickupIDs = [pickupID];
      this.itemsList.push(normalizedItem);
      // Update the HUD count for the item
      this.HUD.updateCountForItem(normalizedItem.name);
    }
    // Sync localstorage with itemsList
    this.syncToLocalStorage();
  }

  // Remove item from the inventory
  removeItemByName(name, count) {
    const item = this.itemsList.find((i) => i.name === name);
    if (item) {
      item.count -= count;
      // Sync localstorage with itemsList
      this.syncToLocalStorage();
      // Update the HUD count for the item
      this.HUD.updateCountForItem(name);
    }
  }
  // Remove item from the inventory by pickupID
  removeItemByPickupID(pickupID) {
    const item = this.itemsList.find((i) => i.pickupIDs.includes(pickupID));
    if (item) {
      item.count -= 1;
      item.pickupIDs = item.pickupIDs.filter((id) => id !== pickupID);
      if (item.count <= 0) {
        this.itemsList = this.itemsList.filter((i) => i.name !== item.name);
      }
      // Sync localstorage with itemsList
      this.syncToLocalStorage();
      // Update the HUD count for the item
      this.HUD.updateCountForItem(item.name);
    }
  }

  // Check if item is in the inventory
  hasItem(name) {
    return this.itemsList.some((i) => i.name === name);
  }

  // Get item by name
  getItemByName(name) {
    const result = this.itemsList.find((i) => i.name === name);
    return result;
  }

  // Get all items from the inventory
  getAllItems() {
    return this.itemsList;
  }

  // Get a page of items from the inventory
  getItemsPage(page, pageSize) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return this.itemsList.slice(start, end);
  }

  // Get Item Icon by name
  getItemIcon(name) {
    const item = this.itemsList.find((i) => i.name === name);
    if (item) {
      return item.iconElement;
    }
    return null;
  }

  // TODO (?): Get all items from the inventory with a specific tag

  // Modify item in the inventory
  modifyItem(name, newItem) {
    const item = this.itemsList.find((i) => i.name === name);
    if (item) {
      item.name = newItem.name;
      item.description = newItem.description;
      item.count = newItem.count;
      item.inspectElement = newItem.inspectElement.outerHTML;
      item.iconElement = newItem.iconElement.outerHTML;
      item.onclick = newItem.onclick;
      // Sync localstorage with itemsList
      this.syncToLocalStorage();
    }

    // Update the HUD count for the item
    this.HUD.updateCountForItem(newItem.name);
  }
}

export class InventoryItem {
  constructor(
    name,
    pickupID,
    description,
    count,
    iconElement,
    inspectElement,
    onclick,
    tags = [],
    inventory = null
  ) {
    // 🐢💭
    // I think this is a hacky thing AI suggested
    // I should study this more
    // AI thinks this is a way to allow the constructor to accept an object as the first argument, and then destructure it into the individual properties. This allows for more flexibility in how the constructor is called, and can make it easier to create new InventoryItem instances from existing objects.
    if (
      name &&
      typeof name === "object" &&
      typeof name.removeItemByName === "function" &&
      Array.isArray(name.pickupIDs)
    ) {
      inventory = name;
      name = pickupID;
      pickupID = description;
      description = count;
      count = iconElement;
      iconElement = inspectElement;
      inspectElement = onclick;
      onclick = tags;
      tags = inventory && inventory.tags ? inventory.tags : [];
    }

    if (inventory) {
      Object.defineProperty(this, "inventory", {
        value: inventory,
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }

    // The name of the item
    this.name = name;
    // The ID of the item's pickup container
    // We want to use this to track items that shouldnt appear as they have already been picked up
    // We will need to accomodate for stackables so pickupID needs to be an array
    this.pickupID = Array.isArray(pickupID) ? pickupID[0] : pickupID;
    this.pickupIDs = Array.isArray(pickupID)
      ? [...pickupID]
      : pickupID
        ? [pickupID]
        : [];
    // The description of the item
    this.description = description;
    // The count of the item in the inventory
    this.count = count;
    // The element that will be used to display the item in the inventory
    this.iconElement = iconElement;
    // The element that will be used if you want to inspect the item in the inventory
    this.inspectElement = inspectElement;
    // The code to be executed when the item is triggered
    this.onclick = onclick;
    // tags will be used to modify behavior of the item
    this.tags = tags;
    // tags for things such as:
    // hat-equipable, hand-equipable (uses interact button in the world),
    // stackable, permanent (for things we want to track even at 0 count like money/keys)
  }

  triggerOnClick() {
    // This should be hardened. Bad innerHTML can cause weird behavior.
    // I'd rather fail loudly than have weird behavior
    const body = this.onclick
      ? this.onclick
          .substring(
            this.onclick.indexOf("{") + 1,
            this.onclick.lastIndexOf("}"),
          )
          .trim()
      : null;
    if (!body) {
      console.warn(`No onclick function body found for item: ${this.name}`);
      return;
    }
    const func = new Function(body);
    func.call(this);
  }

  consume(count = 1) {
    this.inventory.removeItemByName(this.name, count);
  }
}

export class HUD {
  constructor(player_inventory) {
    this.inventory = player_inventory;
    this.HUD = {};
    this.initialize();
  }

  initialize() {
    this.mapHudElements();
    this.syncCounts();
    this.setIcons();
  }

  mapHudElements() {
    let elements = document.querySelectorAll(".hud-item");
    let itemsList = [];
    let hudElements = {};
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      for (let j = 0; j < element.classList.length; j++) {
        const className = element.classList[j];
        if (className.startsWith("hud-") && className !== "hud-item") {
          const tag = className.split("-")[1];
          itemsList.push(tag);
        }
        if (className.startsWith("hud-") && className !== "hud-item") {
          const tag = className.replace("hud-", "");
          hudElements[tag] = element;
        }
      }
    }
    for (let i = 0; i < itemsList.length; i++) {
      const item = itemsList[i];
      for (let j = 0; j < Object.keys(hudElements).length; j++) {
        const element = hudElements[Object.keys(hudElements)[j]];
        for (let k = 0; k < element.classList.length; k++) {
          const className = element.classList[k];
          if (className.includes(item)) {
            if (this.HUD[item] === undefined) {
              this.HUD[item] = [element];
            } else {
              this.HUD[item].push(element);
            }
          }
        }
      }
      // clear duplicates from this.HUD[item]
      if (this.HUD[item] !== undefined) {
        this.HUD[item] = [...new Set(this.HUD[item])];
      }
    }
  }

  setIcons() {
    for (let i = 0; i < Object.keys(this.HUD).length; i++) {
      const item = Object.keys(this.HUD)[i];
      const elements = this.HUD[item];
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j];
        const itemObj = this.inventory.getItemByName(item);
        for (let k = 0; k < element.classList.length; k++) {
          const className = element.classList[k];
          if (className.includes("-icon")) {
            if (itemObj) {
              element.innerHTML = itemObj.iconElement;
            } else {
              loadInventoryItemFragment(item).then(({ iconElement }) => {
                const iconToken = iconElement?.cloneNode(true);
                if (iconToken) {
                  element.appendChild(iconToken);
                } else {
                  console.warn("HUD element icon failed to load")
                  element.innerHTML = "?";
                }
              });
              element.innerHTML = "";
            }
          }
        }
      }
    }
  }

  syncCounts() {
    for (let i = 0; i < Object.keys(this.HUD).length; i++) {
      const item = Object.keys(this.HUD)[i];
      const elements = this.HUD[item];
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j];
        const itemObj = this.inventory.getItemByName(item);
        for (let k = 0; k < element.classList.length; k++) {
          const className = element.classList[k];
          if (className.includes("-count")) {
            if (itemObj) {
              element.innerHTML = itemObj.count;
            } else {
              element.innerHTML = "0";
            }
          }
        }
      }
    }
  }

  updateCountForItem(name) {
    const item = this.inventory.getItemByName(name);
    if (item) {
      for (let i = 0; i < Object.keys(this.HUD).length; i++) {
        const itemName = Object.keys(this.HUD)[i];
        if (itemName === name) {
          const elements = this.HUD[itemName];
          for (let j = 0; j < elements.length; j++) {
            const element = elements[j];
            for (let k = 0; k < element.classList.length; k++) {
              const className = element.classList[k];
              if (className.includes("-count")) {
                element.innerHTML = item.count;
              }
            }
          }
        }
      }
    } else {
      for (let i = 0; i < Object.keys(this.HUD).length; i++) {
        const itemName = Object.keys(this.HUD)[i];
        if (itemName === name) {
          const elements = this.HUD[itemName];
          for (let j = 0; j < elements.length; j++) {
            const element = elements[j];
            for (let k = 0; k < element.classList.length; k++) {
              const className = element.classList[k];
              if (className.includes("-count")) {
                element.innerHTML = "0";
              }
            }
          }
        }
      }
    }
    this.syncInventoryMenu();
    this.setIcons();
  }

  // Sync the inventory menu with the itemsList
  syncInventoryMenu() {
    const inventoryMenu = document.getElementById("inventory-menu");
    const itemList = inventoryMenu.querySelector(".item-list");
    const itemListPatternElement = inventoryMenu.querySelector(".list-pattern");
    const itemListPattern =
      itemListPatternElement.querySelector(".item-wrapper");

    // Create a copy of the itemListPattern to use as a template
    const itemListPatternTemplate = itemListPattern.cloneNode(true);
    // Clear the itemList
    itemList.innerHTML = "";
    itemList.appendChild(itemListPatternElement);
    if (!gameInstance.debug) {
      itemListPatternElement.style.display = "none";
    }

    for (let i = 0; i < this.inventory.itemsList.length; i++) {
      const item = this.inventory.itemsList[i];
      const itemElement = itemListPatternTemplate.cloneNode(true);
      const itemIcon = itemElement.querySelector(".item-icon");
      const itemName = itemElement.querySelector(".item-name");
      const itemCount = itemElement.querySelector(".item-count");
      const itemDescription = itemElement.querySelector(".item-description");

      // Replace the itemElement onClick with a method that displays the element's "inspectElement" in a window on screen

      // Set the item icon, name, count, and description if not undefined
      if (itemIcon && item.iconElement) {
        itemIcon.innerHTML = item.iconElement;
        if (itemIcon.title == "item-description") {
          itemIcon.title = item.description || "No description available";
        } else if (itemIcon.title == "item-name") {
          itemIcon.title = item.name || "No name available";
        } else if (itemIcon.title == "item-count") {
          itemIcon.title = item.count || "No count available";
        }
      }
      if (itemName) {
        itemName.innerHTML = item.name;
        if (itemName.title == "item-description") {
          itemName.title = item.description || "No description available";
        } else if (itemName.title == "item-name") {
          itemName.title = item.name || "No name available";
        } else if (itemName.title == "item-count") {
          itemName.title = item.count || "No count available";
        }
      }
      if (itemCount) {
        itemCount.innerHTML = item.count;
        if (itemCount.title == "item-description") {
          itemCount.title = item.description || "No description available";
        } else if (itemCount.title == "item-name") {
          itemCount.title = item.name || "No name available";
        } else if (itemCount.title == "item-count") {
          itemCount.title = item.count || "No count available";
        }
      }
      if (itemDescription) {
        itemDescription.innerHTML =
          item.description || "No description available";
        if (itemDescription.title == "item-description") {
          itemDescription.title =
            item.description || "No description available";
        } else if (itemDescription.title == "item-name") {
          itemDescription.title = item.name || "No name available";
        } else if (itemDescription.title == "item-count") {
          itemDescription.title = item.count || "No count available";
        }
      }

      const useButton = itemElement.querySelector(".use-button");
      if (useButton) {
        if (item.count > 0) {
          useButton.onclick = () => {
            item.triggerOnClick();
          };
        } else {
          useButton.onclick = () => {
            alert("You don't have any of this item to use.");
          };
        }
      } else {
        // If there is no use button, attach the onclick to the
        // entire menu item element so that clicking anywhere on the item will trigger the onclick
        if (item.count > 0) {
          itemElement.onclick = () => {
            item.triggerOnClick();
          };
        } else {
          itemElement.onclick = () => {
            alert("You don't have any of this item to use.");
          };
        }
      }

      const inspectButton = itemElement.querySelector(".inspect-button");
      if (inspectButton && item.count > 0) {
        inspectButton.onclick = () => {
          // Create a new window to display the inspectElement
          const inspectWindow = document.createElement("div");
          inspectWindow.className = "inspect-window";
          inspectWindow.innerHTML = item.inspectElement;
          inspectWindow.title = "click to close";
          document.body.appendChild(inspectWindow);

          const removeFromDocument = (event) => {
            if (event.key === "Escape") {
              document.body.removeChild(inspectWindow);
              document.removeEventListener("keydown", removeFromDocument);
            }
          };

          // Close the inspect window when clicked
          inspectWindow.onclick = (event) => {
            if (event.target === inspectWindow) {
              document.body.removeChild(inspectWindow);
              document.removeEventListener("keydown", removeFromDocument);
            }
          };
          // Close the inspect window when Escape is pressed
          document.addEventListener("keydown", removeFromDocument);
        };
      } else if (inspectButton) {
        inspectButton.onclick = () => {
          alert("You don't have any of this item to inspect.");
        };
      }

      itemList.appendChild(itemElement);
    }
  }
}
