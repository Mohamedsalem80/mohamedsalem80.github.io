const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function background(online = true, protocol = 'https:') {
    const elements = new Map();
    const events = {};
    const layers = [];
    function element(id) {
        if (!elements.has(id)) elements.set(id, {
            textContent: '', attributes: {}, handlers: {},
            setAttribute(name, value) { this.attributes[name] = value; },
            addEventListener(name, callback) { this.handlers[name] = callback; }
        });
        return elements.get(id);
    }
    const map = {
        active: new Set(),
        hasLayer(layer) { return this.active.has(layer); },
        removeLayer(layer) { this.active.delete(layer); }
    };
    function layer(options, url) {
        const result = {
            options, url, handlers: {},
            addTo(map) { map.active.add(this); return this; },
            on(name, callback) { this.handlers[name] = callback; return this; }
        };
        layers.push(result);
        return result;
    }
    const context = vm.createContext({
        document: {
            readyState: 'loading', getElementById: element,
            querySelectorAll: () => [], addEventListener() {},
            createElement: () => ({ style: {} })
        },
        window: { location: { protocol }, addEventListener: (name, callback) => { events[name] = callback; } },
        navigator: { onLine: online },
        L: { gridLayer: options => layer(options), tileLayer: (url, options) => layer(options, url) }
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'js', 'metro-script.js'), 'utf8'), context);
    context.addMapBackground(map);
    return {
        context, events, map,
        local: layers[0], street: layers[1],
        toggle: element('toggleStreetMapBtn'), status: element('mapTileStatus')
    };
}

test('OSM street tiles are the default with attribution and a local grid underneath', () => {
    const h = background();
    assert.equal(h.street.url, 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    assert.match(h.street.options.attribution, /https:\/\/www\.openstreetmap\.org\/copyright/);
    assert.equal(h.street.options.maxZoom, 19);
    assert.ok(h.map.hasLayer(h.local));
    assert.ok(h.map.hasLayer(h.street));
    assert.equal(h.toggle.attributes['aria-pressed'], 'true');
    assert.equal(h.toggle.textContent, 'Use local map');
    assert.equal(h.status.textContent, 'Loading street map tiles...');
    assert.ok(h.local.createTile({ x: 1, y: 1 }).style.background);
    h.street.handlers.tileload();
    assert.equal(h.status.textContent, 'Street map tiles provided by OpenStreetMap.');
});

test('three consecutive failures fall back explicitly and allow a manual retry', () => {
    const h = background();
    h.street.handlers.tileerror();
    assert.match(h.status.textContent, /Some street tiles/);
    h.street.handlers.tileerror();
    assert.ok(h.map.hasLayer(h.street));
    h.street.handlers.tileerror();
    assert.ok(!h.map.hasLayer(h.street));
    assert.ok(h.map.hasLayer(h.local));
    assert.equal(h.toggle.attributes['aria-pressed'], 'false');
    assert.match(h.status.textContent, /unavailable.*retry/);
    h.street.handlers.tileload();
    assert.match(h.status.textContent, /unavailable/);
    h.toggle.handlers.click();
    assert.ok(h.map.hasLayer(h.street));
    h.street.handlers.tileerror();
    h.street.handlers.tileload();
    h.street.handlers.tileerror();
    h.street.handlers.tileerror();
    assert.ok(h.map.hasLayer(h.street));
});

test('offline startup and reconnection retain the local map and retry street tiles', () => {
    const h = background(false);
    assert.ok(h.map.hasLayer(h.local));
    assert.ok(!h.map.hasLayer(h.street));
    assert.match(h.status.textContent, /offline/);
    h.toggle.handlers.click();
    assert.ok(!h.map.hasLayer(h.street));
    h.context.navigator.onLine = true;
    h.events.online();
    assert.ok(h.map.hasLayer(h.street));
    h.context.navigator.onLine = false;
    h.events.offline();
    assert.ok(!h.map.hasLayer(h.street));
    assert.ok(h.map.hasLayer(h.local));
});

test('explicitly disabling tiles is respected after reconnecting', () => {
    const h = background();
    h.toggle.handlers.click();
    assert.ok(!h.map.hasLayer(h.street));
    assert.match(h.status.textContent, /turned off/);
    h.context.navigator.onLine = false;
    h.events.offline();
    h.context.navigator.onLine = true;
    h.events.online();
    assert.ok(!h.map.hasLayer(h.street));
    assert.match(h.status.textContent, /turned off/);
    h.toggle.handlers.click();
    assert.ok(h.map.hasLayer(h.street));
});

test('file URLs remain local-only rather than requesting tiles without a web referrer', () => {
    const h = background(true, 'file:');
    assert.ok(!h.map.hasLayer(h.street));
    assert.ok(h.map.hasLayer(h.local));
    assert.match(h.status.textContent, /require HTTP/);
    h.toggle.handlers.click();
    assert.ok(!h.map.hasLayer(h.street));
});

test('the service worker leaves external tiles to normal browser HTTP caching', () => {
    const handlers = {};
    const context = vm.createContext({
        URL,
        self: {
            location: { origin: 'https://mohamedsalem80.github.io' },
            addEventListener: (name, callback) => { handlers[name] = callback; }
        }
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
    let intercepted = false;
    handlers.fetch({
        request: { method: 'GET', url: 'https://tile.openstreetmap.org/11/1201/844.png' },
        respondWith() { intercepted = true; }
    });
    assert.equal(intercepted, false);
});
