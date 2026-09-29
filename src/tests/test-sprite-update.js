const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('./js/rpg_core/Sprite.js', 'utf8');
const match = source.match(/^Sprite\.prototype\.update = function\([\s\S]*?^};/m);
assert.ok(match, 'Sprite.update should exist');

const context = { Sprite: function Sprite() {} };
vm.runInNewContext(match[0], context);

const updated = [];
const children = [{
    update() {
        updated.push('existing');
        children.push({ update() { updated.push('added'); } });
    },
}];

context.Sprite.prototype.update.call({ children });
assert.deepEqual(updated, ['existing'], 'children added during an update are deferred to the next frame');
context.Sprite.prototype.update.call({ children });
assert.deepEqual(updated, ['existing', 'existing', 'added'], 'the deferred child updates on the next frame');

console.log('Sprite update iteration tests passed.');
