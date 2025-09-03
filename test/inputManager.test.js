import test from 'node:test';
import assert from 'node:assert/strict';
import InputManager from '../js/inputManager.js';

test('isActionActive reflects key states', () => {
  global.document = { addEventListener: () => {} };
  const manager = new InputManager({ jump: ['Space'] });
  manager.activeKeys.set('Space', true);
  assert.equal(manager.isActionActive('jump'), true);
  manager.activeKeys.set('Space', false);
  assert.equal(manager.isActionActive('jump'), false);
});

test('addKeyToAction and removeKeyFromAction manage bindings', () => {
  global.document = { addEventListener: () => {} };
  const manager = new InputManager();
  manager.bindAction('shoot', ['KeyS']);
  manager.addKeyToAction('shoot', 'KeyF');
  manager.activeKeys.set('KeyF', true);
  assert.equal(manager.isActionActive('shoot'), true);
  manager.removeKeyFromAction('shoot', 'KeyF');
  assert.equal(manager.isActionActive('shoot'), false);
});
