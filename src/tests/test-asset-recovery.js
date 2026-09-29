const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const bitmapSource = fs.readFileSync('./js/rpg_core/Bitmap.js', 'utf8');
const resourceSource = fs.readFileSync('./js/rpg_core/ResourceHandler.js', 'utf8');
const audioSource = fs.readFileSync('./js/rpg_core/WebAudio.js', 'utf8');
const coreEvents = [];
const context = {
    Bitmap: function Bitmap() {},
    WebAudio: function WebAudio() {},
    Utils: { emitAssetEvent: (type, detail) => coreEvents.push({ type, detail }) },
    ResourceHandler: { createLoader: () => null },
};

function evaluateAssignment(source, pattern) {
    const match = source.match(pattern);
    assert.ok(match, `Expected source function matching ${pattern}`);
    vm.runInNewContext(match[0], context);
}

evaluateAssignment(bitmapSource, /^Bitmap\._getCaseVariants = function\([\s\S]*?^};/m);
evaluateAssignment(bitmapSource, /^Bitmap\.prototype\._onError = function\([\s\S]*?^};/m);
evaluateAssignment(bitmapSource, /^Bitmap\.prototype\._drawErrorPlaceholder = function\([\s\S]*?^};/m);
evaluateAssignment(bitmapSource, /^Bitmap\.prototype\._onLoad = function\([\s\S]*?^};/m);
evaluateAssignment(resourceSource, /^ResourceHandler\.createLoader = function\([\s\S]*?^};/m);
evaluateAssignment(audioSource, /^WebAudio\.prototype\._reportError = function\([\s\S]*?^};/m);

const variants = context.Bitmap._getCaseVariants('img/sv_enemies/Snake.png', 16);
assert.equal(variants[0], 'img/sv_enemies/snake.png', 'filename lowercase is attempted first');
assert.ok(variants.includes('img/sv_enemies/SNAKE.PNG'));
assert.equal(variants.includes('img/sv_enemies/Snake.png'), false, 'the exact requested spelling is not retried');
assert.ok(variants.length <= 16, 'casing probes are bounded');
assert.deepEqual(Array.from(context.Bitmap._getCaseVariants('https://example.invalid/a.png', 16)), []);

function bitmapFixture(overrides = {}) {
    return Object.assign({
        _image: { removeEventListener() {} },
        _loader: null,
        _requestedUrl: 'img/sv_enemies/Snake.png',
        _url: 'img/sv_enemies/Snake.png',
        _fallbackUrl: null,
        _hasTriedFallback: false,
        _caseVariants: [],
        _caseVariantIndex: 0,
        _recoveringCase: false,
        _usingFallback: false,
        _decodeAfterRequest: false,
        requested: [],
        _requestImage(url) { this.requested.push(url); this._url = url; },
        _drawErrorPlaceholder() { this._loadingState = 'loaded'; },
    }, overrides);
}

const casingBitmap = bitmapFixture();
assert.equal(context.Bitmap.prototype._onError.call(casingBitmap), true);
assert.equal(casingBitmap.requested[0], 'img/sv_enemies/snake.png');
assert.equal(casingBitmap._recoveringCase, true);

const fallbackBitmap = bitmapFixture({
    _requestedUrl: 'img/pictures/Foo.png',
    _url: 'img/pictures/Foo.png',
    _fallbackUrl: 'img/pictures/Fallback.png',
    _caseVariants: ['img/pictures/foo.png'],
    _caseVariantIndex: 1,
    _recoveringCase: true,
});
assert.equal(context.Bitmap.prototype._onError.call(fallbackBitmap), true);
assert.equal(fallbackBitmap.requested[0], 'img/pictures/Fallback.png', 'configured fallback follows casing probes');
assert.equal(fallbackBitmap._usingFallback, true);

const failedBitmap = bitmapFixture({
    _requestedUrl: 'https://example.invalid/original.png',
    _url: 'https://example.invalid/original.png',
});
assert.equal(context.Bitmap.prototype._onError.call(failedBitmap), true);
assert.equal(failedBitmap._loadingState, 'loaded', 'unrecoverable assets become renderable placeholders');
assert.equal(coreEvents.at(-1).type, 'image-error');

const recoveredBitmap = bitmapFixture({
    _image: { removeEventListener() {} },
    _url: 'img/sv_enemies/snake.png',
    _loadingState: 'requesting',
    _recoveringCase: true,
    _renewCanvas() {},
    _clearImgInstance() {},
    _callLoadListeners() {},
});
context.Bitmap.prototype._onLoad.call(recoveredBitmap);
assert.equal(coreEvents.at(-1).type, 'image-recovered');
assert.equal(coreEvents.at(-1).detail.recovery, 'case');

const canvasCalls = [];
const canvasContext = new Proxy({}, { get: (_target, property) => (...args) => canvasCalls.push([property, ...args]) });
let listenerCalled = false;
const placeholder = {
    _image: {}, _loadingState: 'error', _createCanvas(width, height) {
        assert.equal(width, 360); assert.equal(height, 220); this._context = canvasContext;
    }, _setDirty() {}, _callLoadListeners() { listenerCalled = true; },
};
context.Bitmap.prototype._drawErrorPlaceholder.call(placeholder);
assert.equal(placeholder._loadingState, 'loaded');
assert.equal(listenerCalled, true);
assert.ok(canvasCalls.some(([method]) => method === 'fillText'));

const audio = { _url: 'audio/bgm/Traveler.ogg', _assetErrorReported: false, _hasError: false };
context.WebAudio.prototype._reportError.call(audio);
context.WebAudio.prototype._reportError.call(audio);
assert.equal(audio._hasError, true);
assert.equal(coreEvents.filter((event) => event.type === 'audio-error').length, 1, 'audio failure events emit once without polling');

let fatalUiCalled = false;
context.ResourceHandler._defaultRetryInterval = [];
context.ResourceHandler._reloaders = [];
context.Graphics = { printLoadingError() { fatalUiCalled = true; } };
context.SceneManager = { stop() { fatalUiCalled = true; } };
context.ResourceHandler.createLoader('img/missing.png', () => {}, () => true, [])();
assert.equal(fatalUiCalled, false, 'a locally recovered image does not invoke the global loading error');

console.log('Core asset recovery tests passed.');
