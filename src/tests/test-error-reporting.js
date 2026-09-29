const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const graphicsSource = fs.readFileSync('./js/rpg_core/Graphics.js', 'utf8');
const managerSource = fs.readFileSync('./js/rpg_managers/SceneManager.js', 'utf8');
const messages = [];
let rendered = false;
let stopped = false;

const context = {
    console: { error: (...args) => messages.push(args) },
    Error,
    document: { getElementById: () => null },
    setInterval: () => 1,
    clearInterval: () => {},
    Graphics: {
        _progressElement: null,
        _errorPrinter: null,
        _upperCanvas: null,
        _width: 800,
        _height: 600,
        _hideProgress() { throw new Error('progress is not initialized'); },
        hideFps() {},
        _applyCanvasFilter() {},
    },
    AudioManager: { stopAll() {} },
    SceneManager: { stop() { stopped = true; } },
};

function evaluateAssignment(source, pattern) {
    const match = source.match(pattern);
    assert.ok(match, `Expected source function matching ${pattern}`);
    vm.runInNewContext(match[0], context);
}

evaluateAssignment(graphicsSource, /^Graphics\.printFullError = function\([\s\S]*?^};/m);
evaluateAssignment(graphicsSource, /^Graphics\._escapeErrorHtml = function\([\s\S]*?^};/m);
evaluateAssignment(graphicsSource, /^Graphics\._animateError = function\([\s\S]*?^};/m);
evaluateAssignment(graphicsSource, /^Graphics\._createVideo = function\([\s\S]*?^};/m);
evaluateAssignment(managerSource, /^SceneManager\.catchException = function\([\s\S]*?^};/m);

context.Graphics._animateError = function() { rendered = true; };
const original = new Error('startup broke before the upper canvas existed');
context.SceneManager.catchException(original);

assert.equal(messages[0][0], original.stack, 'the original exception is logged before rendering');
assert.equal(messages.length, 1, 'a missing upper canvas does not create a secondary display exception');
assert.equal(rendered, true, 'the error presentation still runs when canvas initialization is incomplete');
assert.equal(stopped, true, 'the game loop is stopped after a fatal startup error');
assert.equal(context.Graphics._escapeErrorHtml('<script>&"'), '&lt;script&gt;&amp;&quot;');

let helperCalled = false;
context.document.createElement = () => ({ style: {}, setAttribute() {} });
context.document.body = { appendChild() {} };
context.enableInlineVideo = (video) => { helperCalled = !!video; };
const videoGraphics = {
    _videoVolume: 1,
    _updateVideo() {},
};
context.Graphics._createVideo.call(videoGraphics);
assert.equal(helperCalled, true, 'the bundled enableInlineVideo helper is called');

console.log('Core error reporting tests passed.');
