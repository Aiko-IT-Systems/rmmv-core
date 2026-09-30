const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const managerSource = fs.readFileSync('./js/rpg_managers/SceneManager.js', 'utf8');
const graphicsSource = fs.readFileSync('./js/rpg_core/Graphics.js', 'utf8');
const interpreterSource = fs.readFileSync('./js/rpg_objects/Game_Interpreter.js', 'utf8');

function extract(source, name) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = source.match(new RegExp('^' + escapedName + ' = function\\([\\s\\S]*?^};', 'm'));
    assert.ok(match, `Expected ${name} assignment`);
    return match[0];
}

const state = {
    now: 0,
    updates: 0,
    renders: 0,
    starts: 0,
    ends: 0,
    requests: 0,
};
const context = {
    Utils: { isMobileSafari: () => false },
    Graphics: {
        frameCount: 0,
        _skipCount: 0,
        _maxSkip: 3,
        _rendered: false,
        _renderer: { render() { state.renders++; }, gl: null },
    },
    SceneManager: {
        _deltaTime: 1 / 60,
        _currentTime: 0,
        _accumulator: 0,
        _stopped: false,
        _sceneStarted: true,
        _scene: { update() { state.updates++; } },
        _getTimeInMsWithoutMobileSafari() { return state.now; },
        tickStart() { state.starts++; },
        tickEnd() { state.ends++; },
        updateInputData() {},
        changeScene() {},
        isCurrentSceneStarted() { return true; },
        updateScene() { state.updates++; },
        updateFrameCount() {},
        renderScene() { state.renders++; },
        requestUpdate() { state.requests++; },
        updateManagers() {},
        catchException(error) { throw error; },
    },
    Game_Interpreter: function Game_Interpreter() {},
    Date: { now: () => state.now },
};

vm.runInNewContext(extract(managerSource, 'SceneManager.update'), context);
vm.runInNewContext(extract(managerSource, 'SceneManager.updateMain'), context);
vm.runInNewContext(extract(managerSource, 'SceneManager.updateScene'), context);
vm.runInNewContext(extract(graphicsSource, 'Graphics.render'), context);
vm.runInNewContext(extract(interpreterSource, 'Game_Interpreter.prototype.checkFreeze'), context);

context.SceneManager.update();
assert.equal(state.updates, 0, 'a high-refresh callback with no 60 Hz tick skips scene updates');
assert.equal(state.renders, 0, 'a callback with no logical frame skips rendering');
assert.equal(state.requests, 1, 'the next display callback is still scheduled');

state.now = 17;
context.SceneManager.update();
assert.equal(state.updates, 1, 'the accumulated interval produces one logical update');
assert.equal(context.Graphics.frameCount, 1, 'frameCount tracks logical updates');
assert.equal(state.starts, 1, 'FPS sampling starts once for a callback with a logical frame');
assert.equal(state.ends, 1, 'FPS sampling ends once for a callback with a logical frame');
assert.equal(state.renders, 1, 'a logical frame renders once');

context.Graphics.render({});
assert.equal(context.Graphics.oldFrameCount, 1, 'render callbacks use their own counter');
assert.equal(context.Graphics.frameCount, 1, 'rendering does not advance the logical frame counter');

const interpreter = { _frameCount: 0, _freezeChecker: 11 };
assert.equal(context.Game_Interpreter.prototype.checkFreeze.call(interpreter), false);
assert.equal(interpreter._frameCount, 1, 'freeze detection follows the render callback counter');
assert.equal(interpreter._freezeChecker, 1, 'a rendered callback clears the freeze streak before the next check increments it');

console.log('High refresh timing tests passed.');
