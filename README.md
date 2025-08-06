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
  <div class="level" id="level-one">
    <div class="screen">
      <div id="player">
        <div id="interactionBox"></div>
      </div>
    </div>
  </div>
</div>
```

3. Open the page in a modern browser. Use `WASD` to move, `Shift` to sprint, `Space/W` to jump and `E` to interact. `ESC` pauses the game and `3` toggles debug mode.

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

* Out-of-bounds behavior is controlled by classes on the `.level` element such as `contain`, `respawn` or `wrap` with optional direction suffixes (e.g. `wrap-vert`).
* Player spawn can be set via URL query parameters `?spawn_x=` and `?spawn_y=`.
* Filters and camera behavior are controlled with classes on `#viewport` (e.g. `no-follow`, `scroll-bar`).

## Module Overview

### `platformer.js`
Entry point that instantiates the game. It locates `#player` and the `.level` element, creates `Player` and `Level` objects, registers them with the global `gameInstance` and starts the game loop. Exposes helpers (`teleportCheat`, `game`, `player`, `level`) on `window`.

### `game.js`
Central controller. Maintains key state, debug and pause modes, the `Camera`, active `Player` and `Level`, and a `BroadcastManager` for in‑game signals. Runs the update loop that processes input and updates all components.

### `player.js`
Handles player physics, input, collisions, animation and interaction logic. Reads configuration from the embedded `.config` element and manages an `InteractionBox` and `GifAnimationManager`.

### `level.js`
Represents the level grid. Discovers `.screen` elements, wraps them as `Screen` objects, sets CSS variables for screen size and enforces out‑of‑bounds effects (`contain`, `respawn`, `wrap`).

### `screen.js`
Represents a single screen within the level. Collects solid objects, interactables, receivers and parallax objects, registers nearby solids/interactables with the player and updates objects when the player is present.

### `levelObjects.js`
Defines in‑level object types:
- `LevelObject`: base class with enable/disable logic and optional parallax support.
- `SolidObject`: impassable geometry.
- `TriggerArea`: runs its `onclick` when the player enters.
- `InteractableObject` and `InteractableToggle`: elements that react to player interaction and can broadcast signals.
- `Reciever`: shows different child elements based on received signals.

Example toggle/receiver pair:

```html
<div class="object interactable toggle">
  <div class="on"><span class="broadcast channel-door">open</span></div>
  <div class="off"><span class="broadcast channel-door">close</span></div>
</div>
<div class="object reciever">
  <span class="broadcast channel-door"></span>
  <div class="signal-open">Door is open</div>
  <div class="signal-close">Door is closed</div>
</div>
```

### `camera.js`
Controls the viewport. Follows the player with smoothing and lookahead, allows offset adjustment with arrow keys, manages overlay elements and display filters via the `Filter` helper class.

### `collisionDetector.js`
Performs axis‑aligned collision checks between the player and level objects, handles trigger activation and applies out‑of‑bounds effects defined by the level.

### `physics.js`
Applies gravity, friction and acceleration limits. Provides a `move` method used by `Player` to adjust velocity.

### `interactionBox.js`
Tracks nearby interactable objects relative to the player. When the player presses `E`, it calls `interact()` on any overlapping interactables and shows an indicator while in range.

### `broadcastManager.js`
Minimal pub/sub system. Stores channel → signal mappings, allowing toggles to broadcast state changes and receivers to query them.

### `elementStateManagers.js`
`ToggleManager` swaps visibility of `.on`/`.off` elements and issues broadcasts. `MultiStateManager` selects a child matching a broadcast signal from a channel.

### `gifAnimationManager.js`
Utility for toggling GIF animations inside an `animation-container` by class name.

### `hexBackground.js`
Utility to align and animate hex‑pattern backgrounds. Call `syncBackgrounds()` to position `.hexBackground` elements and update on window resize.

### `tools.js`
Collection of helpers for geometry (`intersects`, `getCollisionOverlap`), logging (`debugLog`), class list checks and transform manipulation.

## Dependencies
The engine uses no external build tools or packages and runs entirely in the browser. A modern browser with ES module support is required.

## Known Limitations
- Collision detection is axis‑aligned and may allow tunnelling at very high speeds.
- Parallax and filter effects require manual HTML/CSS configuration; there is no runtime editor.
- APIs are unstable and subject to change as the project evolves.

## License
No license information is provided.

