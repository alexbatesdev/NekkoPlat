# Movement Modes — Pseudocode Design Draft

> Design-only draft. This file intentionally contains pseudocode and architectural notes, not production implementation.

## Goal

Allow a single NekkoPlat `Player` to move under different locomotion rules depending on the current area of the level.

Initial modes:

- **Platformer** — left/right movement, gravity, jumping, grounding, slopes, coyote time, one-way platforms.
- **Top-down** — up/down/left/right movement, no gravity, no grounded state, equal-speed diagonals, Zelda-like traversal.

The important distinction is:

```text
Player = the character and persistent character state
MovementMode = the rules by which that character currently moves
```

The player should remain one object. Inventory, interaction, camera tracking, checkpoints, collision ownership, animation manager, etc. should not be duplicated between movement styles.

---

## High-level shape

```text
Player
 ├─ position
 ├─ velocity
 ├─ collision
 ├─ interaction
 ├─ inventory
 ├─ animation manager
 ├─ checkpoint state
 └─ movementMode
       ├─ PlatformerMovementMode
       └─ TopDownMovementMode
```

Avoid creating separate `PlatformerPlayer` and `TopDownPlayer` classes.

---

## Movement-mode interface

```js
class MovementMode {
    constructor(player) {
        this.player = player;
    }

    enter(previousMode) {
        // Called when this mode becomes active.
    }

    exit(nextMode) {
        // Called before another mode becomes active.
    }

    processInput() {
        // Interpret current input according to this movement style.
    }

    applyPhysics() {
        // Apply only the physics appropriate for this mode.
    }

    afterCollision() {
        // Process movement-mode-specific collision state.
    }

    applyAnimations() {
        // Select animations appropriate for this movement style.
    }
}
```

The base class may remain very small. Its purpose is primarily to establish a common lifecycle.

---

## Player ownership

```js
class Player {
    constructor(element) {
        // Existing shared player state remains here.

        this.x = 0;
        this.y = 0;
        this.velocityX = 0;
        this.velocityY = 0;

        this.physics = new Physics();
        this.collision = new CollisionDetection();
        this.interactionBox = new InteractionBox(this);

        this.movementModes = {
            platformer: new PlatformerMovementMode(this),
            topdown: new TopDownMovementMode(this),
        };

        this.movementMode = this.movementModes.platformer;
    }
}
```

Mode-independent state stays on `Player`.

Mode-specific temporary state should generally live on the mode unless another engine system needs to inspect it directly.

---

## Player update loop

Current player update behavior should be reorganized around a shared movement/collision core.

```js
Player.update() {
    movementMode.processInput();
    movementMode.applyPhysics();

    moveAndCollide();

    movementMode.afterCollision();

    interactionBox.update();
    movementMode.applyAnimations();

    updateDebugUI();
}
```

The important shared section is:

```js
Player.moveAndCollide() {
    steps = ceil(max(abs(velocityX), abs(velocityY)));
    iterations = max(1, steps);

    repeat iterations times {
        x += velocityX / iterations;
        y += velocityY / iterations;

        updateTransform();
        collision.applyCollisions(this, collisionObjects);
        updateTransform();

        if velocityX == 0 and velocityY == 0 {
            break;
        }
    }
}
```

This movement loop works for both platformer and top-down movement because both ultimately move a body through X/Y space and resolve collisions.

---

## Platformer movement mode

This mode contains behavior currently embedded in `Player.processInput()`, `Player.processCollisions()`, parts of `Player.applyAnimations()`, and platformer-specific portions of `Physics.applyPhysics()`.

```js
class PlatformerMovementMode extends MovementMode {
    processInput() {
        input = game.inputManager;
        player = this.player;

        configureSprintAcceleration();

        if input.moveLeft {
            player.lookLeft();
            player.physics.accelerateHorizontal(player, -acceleration);
        }

        if input.moveRight {
            player.lookRight();
            player.physics.accelerateHorizontal(player, acceleration);
        }

        if input.jump && input.moveDown {
            attemptDropThroughPlatform();
        }
        else if input.jump {
            attemptJump();
        }

        if input.respawn {
            player.respawnAtCheckpoint();
        }
    }

    applyPhysics() {
        player.physics.applyGravity(player);
        player.physics.applyGroundFriction(player);
        player.physics.limitHorizontalVelocity(player);
        player.physics.limitFallVelocity(player);
    }

    afterCollision() {
        wasGrounded = player.grounded;
        player.grounded = player.collision.isGrounded(...);

        if player.grounded {
            clearLandingStateAsNeeded();
        }
        else if justLeftGround {
            activateCoyoteTime();
        }

        handleWallFallBehavior();
    }

    applyAnimations() {
        if sprinting and moving horizontally {
            animation = "run";
        }
        else if moving horizontally {
            animation = "walk";
        }
        else if grounded {
            animation = "idle";
        }
        else {
            animation = "jump";
        }
    }
}
```

Platformer semantics:

```text
velocityX = horizontal motion
velocityY = vertical / gravity motion
Down      = contextual platformer command
```

---

## Top-down movement mode

Top-down mode does not use gravity, jumping, grounding, coyote time, or floor slopes as movement mechanics.

```js
class TopDownMovementMode extends MovementMode {
    processInput() {
        input = game.inputManager;
        player = this.player;

        directionX = 0;
        directionY = 0;

        if input.moveLeft  { directionX -= 1; }
        if input.moveRight { directionX += 1; }
        if input.moveUp    { directionY -= 1; }
        if input.moveDown  { directionY += 1; }

        magnitude = hypot(directionX, directionY);

        if magnitude > 0 {
            directionX /= magnitude;
            directionY /= magnitude;
        }

        player.velocityX = directionX * moveSpeed;
        player.velocityY = directionY * moveSpeed;

        updateFacingDirection(directionX, directionY);
    }

    applyPhysics() {
        // Intentionally no gravity.
        // Optional acceleration/friction can be introduced here later.
    }

    afterCollision() {
        // No grounded / coyote / jump processing.
    }

    applyAnimations() {
        if velocity is zero {
            play idle animation for current facing direction;
        }
        else {
            play walk animation for current facing direction;
        }
    }
}
```

Top-down semantics:

```text
velocityX = west/east motion
velocityY = north/south motion
Down      = literal southward movement
```

---

## Diagonal movement normalization

Do not allow diagonal movement to be faster than cardinal movement.

Without normalization:

```text
horizontal speed = 10
vertical speed   = 10
actual diagonal speed = sqrt(10^2 + 10^2) = 14.14
```

Normalize before applying movement speed:

```js
length = hypot(x, y);

if length > 0 {
    x /= length;
    y /= length;
}

velocityX = x * speed;
velocityY = y * speed;
```

---

## Mode switching

Provide a single player API for switching movement behavior.

```js
Player.setMovementMode(name) {
    nextMode = movementModes[name];

    if nextMode is missing {
        warn and return;
    }

    if nextMode == movementMode {
        return;
    }

    previousMode = movementMode;

    previousMode.exit(nextMode);

    velocityX = 0;
    velocityY = 0;

    movementMode = nextMode;
    movementMode.enter(previousMode);
}
```

Velocity reset is useful initially because it prevents platformer gravity/jump momentum from leaking into top-down motion, and vice versa.

This can later become configurable if preserving momentum across a special transition becomes desirable.

---

## Platformer mode exit cleanup

```js
PlatformerMovementMode.exit() {
    player.grounded = false;
    player.groundedObject = null;

    player.jumpInProgress = false;
    player.jumpProcessed = false;
    player.airJumps = 0;

    player.coyoteTimeActive = false;

    player.physics.gravity = player.gravity;
}
```

The goal is to avoid stale platformer state being carried into top-down movement.

---

## Top-down mode enter cleanup

```js
TopDownMovementMode.enter() {
    player.velocityX = 0;
    player.velocityY = 0;

    player.grounded = false;
    player.groundedObject = null;
}
```

---

## Level-authored transitions

Movement modes should be selectable through level markup rather than hard-coded room IDs.

### Option A: explicit mode trigger

```html
<div
    class="object trigger movement-mode-trigger"
    data-movement-mode="topdown">
</div>
```

Pseudo behavior:

```js
MovementModeTrigger.trigger() {
    game.player.setMovementMode(element.dataset.movementMode);
}
```

### Option B: reuse existing onclick trigger system

```html
<div
    class="object trigger"
    onclick="player.setMovementMode('topdown')">
</div>
```

Return transition:

```html
<div
    class="object trigger"
    onclick="player.setMovementMode('platformer')">
</div>
```

This is especially compatible with NekkoPlat's markup-driven level authoring approach.

---

## Shared collision behavior

Ordinary AABB solids should remain usable in both modes.

```text
Platformer:

        player
          ↓ gravity
────────────── floor

Top-down:

        █████████
player →█ wall  █
        █████████
```

The same horizontal and vertical overlap resolution can service both.

Collision geometry should generally not need to know why the player is moving.

---

## Collision profile idea

This does not need to be implemented immediately, but movement modes may eventually advertise which collision features they use.

```js
PlatformerMovementMode.collisionProfile = {
    solids: true,
    slopes: true,
    oneWayPlatforms: true,
    grounding: true,
};
```

```js
TopDownMovementMode.collisionProfile = {
    solids: true,
    slopes: false,
    oneWayPlatforms: false,
    grounding: false,
};
```

Then collision handling can selectively process only relevant geometry.

Avoid overbuilding this until a real need appears.

---

## Physics refactor

Do not make `Physics` itself the movement mode.

Prefer:

```text
MovementMode
    decides which physical rules apply
        ↓
Physics
    performs reusable velocity calculations
        ↓
Player
```

Split broad `applyPhysics()` behavior into smaller primitives.

```js
class Physics {
    applyGravity(player) {}
    applyGroundFriction(player) {}
    applyPlanarFriction(player) {}

    accelerateHorizontal(player, amount) {}
    acceleratePlanar(player, x, y) {}

    limitHorizontalVelocity(player) {}
    limitFallVelocity(player) {}
    limitPlanarVelocity(player) {}
}
```

Then platformer mode chooses:

```js
physics.applyGravity(player);
physics.applyGroundFriction(player);
physics.limitHorizontalVelocity(player);
physics.limitFallVelocity(player);
```

while top-down mode might choose:

```js
physics.applyPlanarFriction(player);
physics.limitPlanarVelocity(player);
```

or initially use direct velocity assignment and no physics helpers at all.

---

## Input meaning belongs to the movement mode

The same action can mean different things depending on locomotion rules.

```text
Platformer
----------
Left / Right = horizontal movement
Up / Jump    = jump
Down         = contextual action / drop-through / staircase choice
velocityY    = vertical physics velocity

Top-down
--------
Left / Right = west/east
Up / Down    = north/south
velocityY    = planar north/south velocity
```

This is one of the main reasons input interpretation should move out of the core `Player` class.

---

## Animation ownership

Movement mode should decide which locomotion animation family is appropriate.

Platformer example:

```text
idle
walk
run
jump
```

Top-down example:

```text
idle-up
idle-down
idle-left
idle-right
walk-up
walk-down
walk-left
walk-right
```

The shared animation manager remains owned by `Player`; the active movement mode merely selects animations.

---

## Relationship to staircase/path-junction traversal

Movement modes and branching floors solve different problems.

```text
Stair/path junction:
    Changes WHICH traversable surface the player chooses.

Movement mode transition:
    Changes THE RULES used to traverse space.
```

A staircase may temporarily alter collision eligibility while remaining in platformer mode.

A Zelda-style floor changes the locomotion mode itself.

Keep these concepts separate.

---

## Future modes this architecture supports

```text
PlatformerMovementMode
TopDownMovementMode
LadderMovementMode
SwimmingMovementMode
ClimbingMovementMode
RailMovementMode
KnockbackMovementMode
CutsceneMovementMode
```

Examples:

### Ladder

```text
gravity off
up/down enabled
left/right limited or disabled
jump exits ladder
```

### Swimming

```text
reduced gravity
four-way acceleration
high drag
lower max speed
```

### Rail/cart

```text
player input partially disabled
position follows authored path
jump/action may remain available
```

---

## Suggested implementation order

```text
1. Add MovementMode base abstraction.
2. Move existing platformer-specific Player logic into PlatformerMovementMode.
3. Keep shared move-and-collide loop on Player.
4. Split Physics.applyPhysics into reusable primitives only where needed.
5. Verify existing platformer behavior has not changed.
6. Add TopDownMovementMode.
7. Add level-authored movement-mode transition trigger.
8. Add top-down directional animations.
9. Only then consider collision profiles if unnecessary collision work becomes awkward.
```

The first milestone should be a pure refactor where platformer behavior remains identical before any top-down functionality is added.

---

## Desired architectural result

```text
Player.update()
│
├── movementMode.processInput()
│
├── movementMode.applyPhysics()
│
├── Player.moveAndCollide()           shared
│
├── movementMode.afterCollision()
│
├── interactionBox.update()           shared
│
└── movementMode.applyAnimations()

               MovementMode
                    │
          ┌─────────┴─────────┐
          │                   │
 PlatformerMovementMode   TopDownMovementMode
          │                   │
        gravity             no gravity
        jumping             four-way movement
        grounding           normalized diagonals
        coyote time         planar animation facing
        slope behavior
```

The core rule is:

> The `Player` represents the persistent character. The active `MovementMode` represents the current rules for locomotion.
