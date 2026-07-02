# NekkoPlat

A browser-based platformer engine built with plain JavaScript, HTML and CSS. Levels are authored directly in markup and the engine handles physics, collision, camera tracking and interaction logic.

## Getting Started

1. Include the engine script and styles in your HTML:

```html
<link rel="stylesheet" href="css/platformer.css">
<script type="module" src="js/platformer.js" defer></script>
```

2. Provide the minimal HTML structure:

```html
<div id="viewport">
  <div class="level grid-1x1" id="level-one">
    <div class="screen">
      <div id="player">
        <div id="interactionBox"></div>
      </div>
    </div>
  </div>
</div>
```

3. Open the page in a modern browser. Use `WASD` to move, `Shift` to sprint, `Space/W` to jump and `E` to interact. `R` respawns at the current checkpoint. `ESC` pauses the game, `3` toggles debug mode, and arrow keys adjust camera framing.

## Configuration

* Player physics can be configured with a `.config` block inside `#player`:

```html
<div id="player">
  <span class="config">
    <span class="maxVelocity">10</span>
    <span class="sprintMaxVelocity">18</span>
    <span class="acceleration">1</span>
    <span class="sprintAcceleration">2</span>
    <span class="maxAirJumps">1</span>
    <span class="gravity">0.9</span>
    <span class="fallingGravity">3</span>
    <span class="preJumpAllowance">10</span>
    <span class="jumpForce">25</span>
    <span class="coyoteTime">100</span>
  </span>
</div>
```

* Grid dimensions are defined on the `.level` element via a `grid-colsxrows` class.
* Add `dynamic` or `initial` on `.level` to control how `--screen-width`/`--screen-height` are initialized (`dynamic` updates on resize).
* Out-of-bounds behavior is controlled by classes on the `.level` element such as `contain`, `respawn` or `wrap` with optional direction suffixes (e.g. `wrap-vert`).
* Player spawn can be set via URL fragment target IDs (for example `#door-1`), which aligns with normal DOM anchor-style syntax.
* Filters and camera behavior are controlled with classes on `#viewport` (e.g. `no-follow`, `scroll-bar`).

## Module Overview

### `platformer.js`
Entry point that instantiates the game on `DOMContentLoaded`. It locates `#player`, creates `Player`, creates `Level` with the hardcoded id `level-one`, registers both on `gameInstance`, and starts the game loop. Exposes `teleportCheat` and `game` on `window`; `player` is also exposed once `Player` is constructed.

### `game.js`
Central controller. Maintains debug and pause modes, the `Camera`, active `Player` and `Level`, and a `BroadcastManager` for in-game signals. Uses `InputManager` action bindings (`move`, `jump`, `interact`, `respawn`, `camera` offsets, etc.) and runs a fixed-step update loop.

### `player.js`
Handles player physics, input, collisions, animation and interaction logic. Reads configuration from the embedded `.config` element and manages an `InteractionBox` and `GifAnimationManager`.

Spawn resolution order:
- If the URL includes a hash target (for example `./grassland.html#door-1`), the player spawns at the center of that element.
- If there is no hash target, player spawn falls back to CSS variables `--player-spawn-x` and `--player-spawn-y`.

Also wires inventory runtime dependencies:
- `InventoryService` for inventory state and item actions
- `HUDAdapter` for HUD icon/count rendering
- `InventoryMenuAdapter` for pause menu rendering

### `level.js`
Represents the level grid. Discovers `.screen` elements, wraps them as `Screen` objects, configures grid dimensions from `grid-CxR`, and initializes screen sizing variables (`--screen-width`, `--screen-height`) based on `initial`/`dynamic` classes. It stores per-side out-of-bounds policy that collision handling applies at runtime.

### `screen.js`
Represents a single screen within the level. Collects solid objects, interactables, receivers and parallax objects, registers nearby solids/interactables with the player and updates objects when the player is present.

### `levelObjects.js`
Defines in‑level object types:
- `LevelObject`: base class with enable/disable logic and optional parallax support.
- `SolidObject`: impassable geometry.
- `MovingPlatform`: follows CSS transform motion and carries the grounded player by transform delta.
- `SaggingPlatform`: applies configurable downward sag while the player is standing on it.
- `TriggerArea`: runs its `onclick` when the player enters.
- `InteractableObject` and `InteractableToggle`: elements that react to player interaction and can broadcast signals.
- `Receiver`: shows different child elements based on received signals.
- `ItemPickup`: builds `InventoryItem` data from item fragments and adds or executes item actions.
- `Slope`: ramp geometry. Combine classes `object`, `solid` and `slope` and set `data-slope` to `up-right`, `up-left`, `down-right` or `down-left`.
- `Slope` also supports `data-slope-equation` (`y=...`) and optional `data-slope-role="ceiling"` for ceiling collisions.
- `OneWaySolid`: blocks movement from one side. Use classes `object solid oneway-DIR` where `DIR` is `up`, `down`, `left` or `right`. Add `dropthrough` to an `oneway-up` element to allow falling through by holding `S` and pressing a jump key; each platform maintains its own drop timer.

Example sloped surface:

```html
<div class="object solid slope" data-slope="up-right"
     style="width:200px;height:200px;clip-path:polygon(0% 100%,100% 100%,100% 0%);"></div>
```

Example one-way platform:

```html
<div class="object solid oneway-up" style="width:100px;height:20px;"></div>
```

Example drop-through platform:

```html
<div class="object solid oneway-up dropthrough" style="width:100px;height:20px;"></div>
```

Example toggle/receiver pair:

```html
<div class="object interactable toggle">
  <div class="on"><span class="broadcast channel-door">open</span></div>
  <div class="off"><span class="broadcast channel-door">close</span></div>
</div>
<div class="object receiver">
  <span class="broadcast channel-door"></span>
  <div class="signal-open">Door is open</div>
  <div class="signal-close">Door is closed</div>
</div>
```

### `stores/inventoryStore.js`
Pure inventory state container. Stores `itemsList` and `pickupIDs`, exposes query methods, and emits state-change events to subscribers.

### `services/inventoryService.js`
Domain/service layer for inventory logic:
- add/remove/modify item operations
- localStorage sync (`itemsList`)
- pickup tracking (`isPickedUp`)
- item action execution (`useItemByName`, `executeItem`)
- helper-provider extension system (`registerHelperProvider`)

### `services/inventoryItem.js`
Data model for inventory entries and dynamic onclick execution.

Item onclick scripts run with `this` bound to the live item instance, so scripts can mutate item state directly.

### `adapters/hudAdapter.js`
Event-driven HUD adapter that renders icon/count displays for `.hud-item` targets and falls back to fragment icon loading when needed.

### `adapters/inventoryMenuAdapter.js`
Event-driven pause-menu adapter that renders inventory rows and wires use/inspect interactions.

### `camera.js`
Controls the viewport. Follows the player with smoothing and lookahead, allows offset adjustment with arrow keys, manages overlay elements and display filters via the `Filter` helper class.

### `collisionDetector.js`
Performs collision checks between the player and level objects, handles trigger activation, applies side-specific out-of-bounds effects from the level config, and resolves both AABB solids and slope surfaces.

### `physics.js`
Applies gravity, friction and acceleration limits. Provides a `move` method used by `Player` to adjust velocity.

### `interactionBox.js`
Tracks nearby interactable objects relative to the player. When the player presses `E`, it calls `interact()` on any overlapping interactables and shows an indicator while in range.

Idea 🐢: Make the interaction only happen with 1 interactable in range, then add a button to cycle through them. Only show the interaction indicator over the currently selected interactable.

### `broadcastManager.js`
Pub/sub signal system. Stores channel -> signal mappings and supports channel listeners (`addListener`/`removeListener`) so state managers can react to broadcasts immediately.

### `elementStateManagers.js`
`ToggleManager` swaps visibility of `.on`/`.off` elements and issues broadcasts. `MultiStateManager` selects a child matching a broadcast signal from a channel.

### `gifAnimationManager.js`
Utility for toggling GIF animations inside an `animation-container` by class name.

### `hexBackground.js`
Utility to align and animate hex‑pattern backgrounds. Call `syncBackgrounds()` to position `.hexBackground` elements and update on window resize.

### `tools.js`
Collection of helpers for geometry (`intersects`, `getCollisionOverlap`), logging (`debugLog`), class list checks and transform manipulation.

Also includes `loadInventoryItemFragment(itemName)` for loading item fragment data from `/items/*.html`.

## Inventory Helper Providers

The inventory action system supports helper injection through `InventoryService.registerHelperProvider`.

Use this when you want item scripts (the `onclick` body in item fragments) to access helpers from other modules without hard-coupling those modules to `InventoryItem`.

Provider signature:

```js
({ service, item, event }) => ({
  helperName: (...args) => {
    // custom behavior
  },
})
```

Example:

```js
const unregister = player.inventory.registerHelperProvider(
  ({ service, item, event }) => ({
    healPlayer: (amount = 1) => {
      service.removeItemByName(item.name, 1);
      // call into your health system here
    },
  }),
);

// Later if needed:
unregister();
```

Built-in helpers available in item onclick scripts:
- `this.consume(count = 1)`
- `this.hasItem(name)`
- `this.addItem(item)`
- `this.getItem(name)`

Note: helper methods are injected for the duration of action execution and then removed, while direct item mutations (for example `this.description = "..."`) persist.

## Onclick Context Runtime

NekkoPlat now routes dynamic onclick execution through a shared runtime in `js/onclickExecutor.js`.

What this gives you:
- Full browser-global access inside onclick scripts (`window`, `document`, `globalThis`, `location`, etc.).
- A helper-rich `this` context based on the object type that triggered the onclick.
- Temporary helper injection: helpers are attached only while the onclick runs, then restored/removed.

Why helper restore exists:
- Prevents temporary helpers from leaking into persistent object state.
- Prevents accidental long-term property collisions after a click.
- Keeps object mutations explicit: only properties your script intentionally sets on the object remain.


### Authoring Onclick Scripts

Use regular inline onclick scripts in your HTML fragments and level markup.

Example: trigger that disables itself after broadcasting a signal

```html
<div class="object trigger" onclick="{
  this.broadcastSignal('door', 'open');
  this.disableOnce();
}"></div>
```

Example: interactable door navigation with fragment-based spawn target

```html
<div class="door object interactable" onclick="window.location.href='./hub.html#door-1'"></div>
```

Example: inventory item onclick from item fragment

```html
<div onclick="{
  if (this.hasItem('key')) {
    this.consume(1);
    this.description = 'Used key';
  }
}">
  ...
</div>
```

### Practical Rules

- Prefer helper methods for game actions (`this.broadcastSignal`, `this.consume`, `this.setOn`, etc.).
- Keep using browser globals when needed (`window.location`, `document.querySelector`, timers, fetch).
- If a helper name overlaps an existing property, the original value is restored after onclick returns.
- If you intentionally mutate object state (for example `this.description = ...` on inventory items), that mutation persists.

## Dependencies
The engine uses no external build tools or packages and runs entirely in the browser. A modern browser with ES module support is required.

## Known Limitations
- Collision is still discrete/step-based and can allow tunneling at very high speeds.
- `platformer.js` currently initializes `Level` with the hardcoded id `level-one`.
- APIs are unstable and subject to change as the project evolves.

## License
No license information is provided.
