import gameInstance from "./game.js";

export default class HUD {
  constructor(inventory) {
    this.inventory = inventory;
    this.HUD = {};
    this.initialize();

    this.inventory.on('itemAdded', () => {
      this.syncCounts();
      this.setIcons();
    });
    this.inventory.on('itemRemoved', () => {
      this.syncCounts();
      this.setIcons();
    });
    this.inventory.on('itemModified', () => {
      this.syncCounts();
      this.setIcons();
    });
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
        const iconHTML = this.inventory.getItemIcon(item);
        for (let k = 0; k < element.classList.length; k++) {
          const className = element.classList[k];
          if (className.includes("-icon")) {
            if (iconHTML) {
              element.innerHTML = iconHTML;
            } else {
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
              element.innerHTML = "";
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
    }
  }

  syncInventoryMenu() {
    const inventoryMenu = document.getElementById("inventory-menu");
    const itemList = inventoryMenu.querySelector(".item-list");
    const itemListPatternElement = inventoryMenu.querySelector(".list-pattern");
    const itemListPattern =
      itemListPatternElement.querySelector(".item-wrapper");

    const itemListPatternTemplate = itemListPattern.cloneNode(true);
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

      const template = document.getElementById(item.templateId);
      let inspectHTML = "";
      let iconHTML = "";
      if (template) {
        const fragment = template.content.cloneNode(true);
        const tplItem = fragment.querySelector('.item');
        iconHTML = tplItem.querySelector('.iconElement')?.outerHTML || "";
        inspectHTML = tplItem.querySelector('.inspectElement')?.outerHTML || "";
      }

      if (itemIcon && iconHTML) {
        itemIcon.innerHTML = iconHTML;
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
        useButton.onclick = () => {
          if (item.onclick) {
            const body = item.onclick
              .substring(
                item.onclick.indexOf("{") + 1,
                item.onclick.lastIndexOf("}")
              )
              .trim();
            const func = new Function(body);
            func.call(item); // 'item' as 'this'
          }
        };
      } else {
        itemElement.onclick = () => {
          if (item.onclick) {
            const body = item.onclick
              .substring(
                item.onclick.indexOf("{") + 1,
                item.onclick.lastIndexOf("}")
              )
              .trim();
            const func = new Function(body);
            func.call(item);
          }
        };
      }

      const inspectButton = itemElement.querySelector(".inspect-button");
      if (inspectButton) {
        inspectButton.onclick = () => {
          console.log("Inspecting item:", item.name);
          const inspectWindow = document.createElement("div");
          inspectWindow.className = "inspect-window";
          inspectWindow.innerHTML = inspectHTML;
          inspectWindow.title = "click to close";
          document.body.appendChild(inspectWindow);

          const removeFromDocument = (event) => {
            if (event.key === "Escape") {
              document.body.removeChild(inspectWindow);
              document.removeEventListener("keydown", removeFromDocument);
            }
          };

          inspectWindow.onclick = (event) => {
            if (event.target === inspectWindow) {
              document.body.removeChild(inspectWindow);
              document.removeEventListener("keydown", removeFromDocument);
            }
          };
          document.addEventListener("keydown", removeFromDocument);
        };
      }

      itemList.appendChild(itemElement);
    }
  }
}

