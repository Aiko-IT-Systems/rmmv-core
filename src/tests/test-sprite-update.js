const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('./js/rpg_core/Sprite.js', 'utf8');
const match = source.match(/^Sprite\._updateChild = function\(child\) \{[\s\S]*?^};\s*^Sprite\.prototype\.update = function\(\) \{[\s\S]*?^};/m);
assert.ok(match, 'Sprite child update callback and Sprite.update should exist');

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

const removed = [];
const removalChildren = Array.from({ length: 11 }, (_, index) => ({
    update() {
        removed.push(index);
        if (index === 7) removalChildren.splice(removalChildren.indexOf(this), 1);
    },
}));

assert.doesNotThrow(() => context.Sprite.prototype.update.call({ children: removalChildren }),
    'removing a child during update should not access a stale array index');
assert.deepEqual(removed, [0, 1, 2, 3, 4, 5, 6, 7, 9, 10],
    'forEach keeps its established iteration behavior when a child removes itself');

console.log('Sprite update iteration tests passed.');
