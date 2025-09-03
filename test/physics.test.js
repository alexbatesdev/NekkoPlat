import test from 'node:test';
import assert from 'node:assert/strict';
import { Physics } from '../js/physics.js';

test('applyPhysics zeroes small horizontal velocity when grounded', () => {
  const physics = new Physics();
  const obj = { velocityX: 0.1, velocityY: 0, grounded: true };
  physics.applyPhysics(obj, { bottom: 0 });
  assert.equal(obj.velocityX, 0);
});

test('applyPhysics applies friction and limits vertical speed', () => {
  const physics = new Physics();
  const obj = { velocityX: 5, velocityY: 50, grounded: true };
  physics.applyPhysics(obj, { bottom: 0 });
  assert.equal(obj.velocityX, 5 * physics.friction);
  assert.equal(obj.velocityY, 30); // falling speed capped
});

test('applyPhysics clamps horizontal velocity to max', () => {
  const physics = new Physics();
  const obj = { velocityX: 20, velocityY: 0, grounded: false };
  physics.applyPhysics(obj, { bottom: 0 });
  assert.equal(obj.velocityX, physics.maxVelocity);
});

test('move applies different horizontal acceleration when airborne', () => {
  const physics = new Physics();
  const grounded = { velocityX: 0, velocityY: 0, grounded: true };
  physics.move(grounded, 2, 3);
  assert.equal(grounded.velocityX, 2);
  assert.equal(grounded.velocityY, 3);

  const airborne = { velocityX: 0, velocityY: 0, grounded: false };
  physics.move(airborne, 2, 3);
  assert.equal(airborne.velocityX, 1); // half when airborne
  assert.equal(airborne.velocityY, 3);
});
