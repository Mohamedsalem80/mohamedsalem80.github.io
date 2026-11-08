const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const plannerSource = fs.readFileSync(path.join(root, 'js', 'metro-script.js'), 'utf8');

function harness(source = plannerSource) {
    let now = 1800000000000;
    let nextId = 0;
    const elements = new Map();
    const watches = new Map();
    const timers = new Map();
    const cleared = [];
    const downloads = [];
    function element(id) {
        if (!elements.has(id)) elements.set(id, {
            value: '', innerText: '', textContent: '', disabled: false,
            classList: { add() {}, remove() {}, toggle() {} },
            addEventListener(event, callback) { this[event] = callback; }
        });
        return elements.get(id);
    }
    const context = vm.createContext({
        console,
        Date: class extends Date {
            constructor(...args) { super(...(args.length ? args : [now])); }
            static now() { return now; }
        },
        document: {
            readyState: 'loading',
            getElementById: element,
            querySelectorAll: () => [],
            addEventListener() {},
            createElement: () => ({ click() {} }),
            body: { appendChild() {}, removeChild() {} }
        },
        Blob,
        URL: {
            createObjectURL(blob) { downloads.push(blob); return 'blob:test'; },
            revokeObjectURL() {}
        },
        navigator: {
            geolocation: {
                watchPosition(success, error, options) {
                    const id = ++nextId;
                    watches.set(id, { success, error, options });
                    return id;
                },
                clearWatch(id) { cleared.push(id); watches.delete(id); }
            }
        },
        setInterval(callback) { const id = ++nextId; timers.set(id, callback); return id; },
        clearInterval(id) { timers.delete(id); },
        setTimeout(callback) { const id = ++nextId; timers.set(id, callback); return id; },
        clearTimeout(id) { timers.delete(id); },
        window: { isSecureContext: true }
    });
    vm.runInContext(source, context);
    return {
        context, watches, timers, cleared, downloads, element,
        get now() { return now; },
        advance(ms) { now += ms; },
        fix(meters = 1000, speed = null, accuracy = 5, timestamp = now) {
            return {
                timestamp,
                coords: {
                    latitude: 30 + meters / (6371000 * Math.PI / 180),
                    longitude: 31, accuracy, speed, altitude: null,
                    altitudeAccuracy: null, heading: null
                }
            };
        }
    };
}

function planner() {
    const h = harness();
    const c = h.context;
    c.window.currentRouteGeoPoints = [
        { lat: 30, lng: 31, plannerName: 'Start', lineId: 'Line 1' },
        { lat: 30.05, lng: 31, plannerName: 'End', lineId: 'Line 1' }
    ];
    const shape = () => ({
        addTo() { return this; }, bindPopup() { return this; }, setLatLng() {}, setLatLngs() {}
    });
    c.L = { circleMarker: shape, marker: shape, divIcon: options => options, polyline: shape, latLngBounds: points => points };
    c.window.metroMapState = {
        map: { fitBounds() {}, panTo() {} },
        travelLayer: { clearLayers() {} },
        routeLayer: { clearLayers() {} }
    };
    c.startTravelMode();
    h.gps = () => h.watches.get(c.travelWatchId);
    h.send = (...args) => h.gps().success(h.fix(...args));
    return h;
}

test('native GPS speed is converted from m/s, including slow movement and a real stop', () => {
    const h = planner();
    h.send(1000, 10);
    assert.equal(h.context.travelState.currentSpeedKmh, 36);
    assert.equal(h.element('travelSpeed').innerText, 'Speed: 36.0 km/h');
    h.advance(1000);
    h.send(1001, 0.5);
    assert.equal(h.context.travelState.currentSpeedKmh, 1.8);
    h.advance(1000);
    h.send(1001, 0);
    assert.equal(h.context.travelState.currentSpeedKmh, 0);
    assert.equal(h.element('travelSpeed').innerText, 'Speed: 0.0 km/h');
});

test('missing speed starts unknown, then estimates from raw fixes and GPS timestamps', () => {
    const h = planner();
    const start = h.now;
    h.send(50, null);
    assert.equal(h.context.travelState.currentSpeedKmh, null);
    for (let i = 1; i <= 6; i++) {
        h.advance(i === 1 ? 2500 : 1000);
        h.send(50 + i * 10, null, 5, start + i * 1000);
    }
    assert.ok(Math.abs(h.context.travelState.currentSpeedKmh - 36) < 0.01);
    assert.match(h.element('travelSpeed').innerText, /Speed \(est\.\): 36\.0/);
});

test('stationary GPS jitter does not become train speed', () => {
    const h = planner();
    for (let i = 0; i <= 12; i++) {
        h.send(1000 + (i % 3 - 1) * 2, null, 10);
        h.advance(1000);
    }
    assert.equal(h.context.travelState.currentSpeedKmh, 0);
    assert.equal(h.context.travelState.smoothedSpeedKmh, 0);
});

test('coordinate-derived speed detects a stop and supports walking speed', () => {
    const h = planner();
    for (let i = 0; i <= 6; i++) {
        h.send(1000 + i * 10);
        h.advance(1000);
    }
    assert.ok(h.context.travelState.currentSpeedKmh > 35);
    for (let i = 0; i < 10; i++) {
        h.send(1060);
        h.advance(1000);
    }
    assert.equal(h.context.travelState.currentSpeedKmh, 0);
    const walking = planner();
    for (let i = 0; i <= 10; i++) {
        walking.send(1000 + i, null, 3);
        walking.advance(1000);
    }
    assert.ok(Math.abs(walking.context.travelState.currentSpeedKmh - 3.6) < 0.01);
});

test('invalid, stale, future, inaccurate and out-of-order fixes do not update GPS state', () => {
    const h = planner();
    h.send(1000, 10);
    const accepted = h.context.travelState.lastGpsSample;
    h.advance(1000);
    const invalid = [
        h.fix(1000, 10, 500),
        h.fix(1000, 10, null),
        h.fix(1000, 10, -1),
        h.fix(1000, 10, 5, h.now - 8000),
        h.fix(1000, 10, 5, h.now + 2000),
        h.fix(1000, 10, 5, accepted.timestamp),
        { timestamp: h.now, coords: { latitude: NaN, longitude: 31, accuracy: 5 } },
        { timestamp: h.now, coords: { latitude: 91, longitude: 31, accuracy: 5 } }
    ];
    for (const fix of invalid) {
        h.gps().success(fix);
        assert.equal(h.context.travelState.lastGpsSample, accepted);
        assert.equal(h.context.travelState.lastGpsAtMs, accepted.timestamp);
    }
});

test('zero accuracy is valid and unavailable or impossible native speed is not coerced to zero', () => {
    for (const speed of [null, undefined, -1, NaN, Infinity, 100]) {
        const h = planner();
        h.send(1000, speed, 0);
        assert.equal(h.context.travelState.lastAccuracyMeters, 0);
        assert.equal(h.context.travelState.currentSpeedKmh, null);
    }
});

test('GPS teleports and off-route fixes do not move route progress', () => {
    const h = planner();
    h.send(1000, 10);
    const progress = h.context.travelState.maxProgressKm;
    h.advance(1000);
    h.send(4000, 10);
    assert.equal(h.context.travelState.maxProgressKm, progress);
    assert.match(h.element('travelStatus').innerText, /jumped/);
    h.send(1010, 10);
    assert.ok(h.context.travelState.maxProgressKm > progress);
    const other = planner();
    const fix = other.fix();
    fix.coords.longitude += 0.1;
    other.gps().success(fix);
    assert.equal(other.context.travelState.lastGpsSample, null);
    assert.equal(other.context.travelState.maxProgressKm, 0);
    assert.match(other.element('travelStatus').innerText, /away from/);
});

test('no GPS fix or a stopped train never triggers assumed movement', () => {
    for (const speed of [null, 0]) {
        const h = planner();
        if (speed === 0) h.send(1000, speed);
        const progress = h.context.travelState.maxProgressKm;
        h.advance(10000);
        h.context.travelFallbackTick();
        assert.equal(h.context.travelState.maxProgressKm, progress);
        assert.equal(h.element('travelSpeed').innerText, 'Speed: -- km/h');
    }
});

test('underground estimates are labeled, time bounded, and do not contaminate recovery speed', () => {
    const h = planner();
    h.send(1000, 10);
    const progress = h.context.travelState.maxProgressKm;
    h.advance(8000);
    h.context.travelFallbackTick();
    assert.ok(h.context.travelState.maxProgressKm > progress);
    assert.match(h.element('travelSpeed').innerText, /est/);
    assert.ok(h.context.travelState.maxProgressKm - progress <= 0.031);
    const estimatedProgress = h.context.travelState.maxProgressKm;
    h.advance(23000);
    h.context.travelFallbackTick();
    assert.equal(h.context.travelState.maxProgressKm, estimatedProgress);
    assert.equal(h.context.travelState.currentSpeedKmh, null);
    h.send(1000, 0);
    assert.equal(h.context.travelState.currentSpeedKmh, 0);
    assert.equal(h.context.travelState.isFallbackMode, false);
});

test('recovering after a gap does not derive speed across the outage', () => {
    const h = planner();
    h.send(1000, 10);
    h.advance(20000);
    h.send(1200, null);
    assert.equal(h.context.travelState.currentSpeedKmh, null);
});

test('arrival needs two distinct accurate fixes physically within the destination area', () => {
    const h = planner();
    h.send(5550, 0, 10);
    assert.ok(h.context.travelState);
    const duplicate = h.fix(5550, 0, 10);
    h.gps().success(duplicate);
    assert.ok(h.context.travelState);
    h.advance(1000);
    h.send(5550, 0, 10);
    assert.equal(h.context.travelState, null);
    assert.equal(h.watches.size, 0);
    assert.equal(h.timers.size, 0);
    const inaccurate = planner();
    inaccurate.send(5550, 0, 90);
    inaccurate.advance(1000);
    inaccurate.send(5550, 0, 90);
    assert.ok(inaccurate.context.travelState);
});

test('route projection alone cannot report arrival beside the destination', () => {
    const h = planner();
    const fix = h.fix(5550, 0, 5);
    fix.coords.longitude += 0.003;
    h.gps().success(fix);
    h.advance(1000);
    fix.timestamp = h.now;
    h.gps().success(fix);
    assert.ok(h.context.travelState);
    assert.equal(h.context.travelState.arrivedSamples, 0);
});

test('travel permissions, stop/restart and late callbacks clean up safely', () => {
    const h = planner();
    const old = h.gps();
    assert.equal(old.options.maximumAge, 0);
    h.context.stopTravelMode(false);
    assert.equal(h.watches.size, 0);
    assert.equal(h.timers.size, 0);
    old.success(h.fix());
    assert.equal(h.context.travelState, null);
    h.context.startTravelMode();
    old.success(h.fix());
    assert.equal(h.context.travelState.lastGpsSample, null);
    h.gps().error({ code: 1, message: 'denied' });
    assert.equal(h.watches.size, 0);
    assert.equal(h.timers.size, 0);
    assert.match(h.element('travelStatus').innerText, /permission was denied/);
});

test('redrawing a route stops the previous GPS session and permits a clean restart', () => {
    const h = planner();
    const old = h.gps();
    h.context.window.metroGeoStations = h.context.window.currentRouteGeoPoints.map(point => ({
        ...point, lineValue: 'one'
    }));
    h.context.showRouteOnMap(['Start', 'End'], 'one', 'one', null);
    assert.equal(h.context.travelState, null);
    assert.equal(h.watches.size, 0);
    assert.equal(h.timers.size, 0);
    assert.equal(h.element('travelStatus').innerText, 'Travel mode stopped.');
    h.context.startTravelMode();
    old.success(h.fix());
    assert.equal(h.context.travelState.lastGpsSample, null);
    h.send(1000, 10);
    assert.equal(h.context.travelState.currentSpeedKmh, 36);
});

test('insecure contexts fail explicitly without starting GPS', () => {
    const h = harness();
    h.context.window.isSecureContext = false;
    h.context.startTravelMode();
    assert.equal(h.watches.size, 0);
    assert.match(h.element('travelStatus').innerText, /HTTPS/);
    h.context.getLiveLocation();
    assert.match(h.element('coordResult').innerText, /HTTPS/);
});

test('live location cancels old requests and releases timers on success', () => {
    const h = harness();
    h.context.getLiveLocation();
    const old = [...h.watches.values()][0];
    h.context.getLiveLocation();
    assert.equal(h.watches.size, 1);
    assert.equal(h.timers.size, 1);
    old.success(h.fix(1000, 0, 1));
    assert.equal(h.element('currentLat').value, '');
    [...h.watches.values()][0].success(h.fix(1000, 0, 10));
    assert.equal(h.element('currentLat').value, h.fix().coords.latitude.toFixed(6));
    assert.equal(h.watches.size, 0);
    assert.equal(h.timers.size, 0);
});

test('live location retains the best fix through transient errors, but not permission denial', () => {
    const h = harness();
    h.context.getLiveLocation();
    const watch = [...h.watches.values()][0];
    watch.success(h.fix(1000, null, 150));
    watch.error({ code: 2, message: 'temporarily unavailable' });
    watch.success(h.fix(1010, null, 80));
    [...h.timers.values()][0]();
    assert.match(h.element('coordResult').innerText, /accuracy ±80 m/);
    assert.equal(h.watches.size, 0);
    assert.equal(h.timers.size, 0);
    h.context.getLiveLocation();
    [...h.watches.values()][0].success(h.fix(1000, null, 80));
    [...h.watches.values()][0].error({ code: 1, message: 'denied' });
    assert.match(h.element('coordResult').innerText, /denied/);
    assert.equal(h.watches.size, 0);
    assert.equal(h.timers.size, 0);
});

test('live location rejects malformed and stale fixes without filling inputs', () => {
    const h = harness();
    h.context.getLiveLocation();
    const watch = [...h.watches.values()][0];
    watch.success(h.fix(1000, null, null));
    watch.success(h.fix(1000, null, 10, h.now - 20000));
    [...h.timers.values()][0]();
    assert.equal(h.element('currentLat').value, '');
    assert.match(h.element('coordResult').innerText, /outdated/);
});

const recorderHtml = fs.readFileSync(path.join(root, 'recorder.html'), 'utf8');
const recorderSource = recorderHtml.match(/<script>([\s\S]*?)<\/script>/)[1];

test('recorder preserves unknown sensor fields, true zero speed and maximumAge=0', async () => {
    const h = harness(recorderSource);
    h.element('maxAge').value = '0';
    h.element('startBtn').click();
    const watch = [...h.watches.values()][0];
    assert.equal(watch.options.maximumAge, 0);
    watch.success(h.fix(1000, null));
    assert.equal(h.element('stSpeed').textContent, '-- km/h');
    h.element('jsonBtn').click();
    const data = JSON.parse(await h.downloads[0].text());
    assert.equal(data.settings.maximumAgeMs, 0);
    for (const field of ['speedMs', 'speedKmh', 'altitude', 'altitudeAccuracy', 'heading']) {
        assert.equal(data.points[0][field], null);
    }
    h.advance(1000);
    watch.success(h.fix(1000, 0));
    assert.equal(h.element('stSpeed').textContent, '0.0 km/h');
    watch.error({ code: 1, message: 'permission denied' });
    assert.equal(h.watches.size, 0);
    assert.equal(h.element('startBtn').disabled, false);
    assert.equal(h.element('stState').textContent, 'Stopped');
    assert.match(h.element('status').textContent, /permission denied/);
});

test('recorder does not claim success when geolocation is unavailable', () => {
    const h = harness(recorderSource);
    h.context.navigator.geolocation = undefined;
    h.element('startBtn').click();
    assert.equal(h.element('stState').textContent, 'Idle');
    assert.equal(h.element('startBtn').disabled, false);
    assert.match(h.element('status').textContent, /not supported/);
});
