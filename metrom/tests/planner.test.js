const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function planner() {
    const elements = new Map();
    function element(id) {
        if (!elements.has(id)) {
            const classes = new Set();
            elements.set(id, {
                value: '', innerText: '', textContent: '', children: [], dataset: {},
                classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
                appendChild(child) { this.children.push(child); },
                replaceChildren() { this.children = []; }
            });
        }
        return elements.get(id);
    }
    const lists = {
        '.pickupl1': [element('pickup-one')], '.pickupl2': [element('pickup-two')],
        '.pickupl3': [element('pickup-three')], '.dropoff1': [element('dropoff-one')],
        '.dropoff2': [element('dropoff-two')], '.dropoff3': [element('dropoff-three')]
    };
    const context = vm.createContext({
        console,
        document: {
            readyState: 'loading', getElementById: element,
            querySelectorAll: selector => lists[selector] || [],
            addEventListener() {}, createElement: () => element(Symbol())
        },
        window: {}, navigator: {}, clearInterval() {}, setTimeout() {}
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'js', 'metro-script.js'), 'utf8'), context);
    const stations = JSON.parse(fs.readFileSync(path.join(root, 'js', 'cairo_metro_station_points.geojson')));
    context.window.metroGeoStations = stations.features.map(feature => ({
        name: feature.properties.stationName,
        plannerName: feature.properties.stationName,
        lineId: feature.properties.lineId,
        lineValue: context.lineIdToPlannerValue(feature.properties.lineId),
        lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0]
    }));
    const shape = () => ({ addTo() { return this; }, bindPopup() { return this; } });
    context.L = { polyline: shape, circleMarker: shape, latLngBounds: points => points };
    context.window.metroMapState = {
        map: { fitBounds() {} },
        routeLayer: { clearLayers() {} }
    };
    return {
        context, element,
        route(startLine, start, endLine, end) {
            element('sline').value = startLine;
            element('eline').value = endLine;
            element('pickup-' + startLine).value = start;
            element('dropoff-' + endLine).value = end;
            context.calculateTicket();
            return element('stations').textContent.split(' → ');
        }
    };
}

test('Faisal to Wadi El Nile uses the five-station Cairo University route', () => {
    const h = planner();
    assert.deepEqual(h.route('two', 'Faisal', 'three', 'Wadi El Nile'), [
        'Faisal', 'Cairo University', 'Boulak El Dakrour', 'Gamat El Dowal', 'Wadi El Nile'
    ]);
    assert.equal(h.element('cstats').innerText, 5);
    assert.equal(h.element('ticketCost').innerText, '10 EGP');
    assert.equal(h.element('elderlyCost').innerText, '5 EGP');
    assert.equal(h.element('specialNeedsCost').innerText, '5 EGP');
    assert.equal(h.element('transferGuide').innerText,
        'Transfer at Cairo University. Take Line 3 toward Adly Mansour.');
    assert.equal(h.context.window.currentRouteGeoPoints.length, 5);
    assert.deepEqual(Array.from(h.context.window.currentRouteGeoPoints, point => point.lineId),
        ['Line 2', 'Line 2', 'Line 3', 'Line 3', 'Line 3']);
    assert.match(h.element('estimatedTime').innerText, /^\d+-\d+ min \(\d+\.\d km\)$/);
});

test('the reverse trip changes to Line 2 toward El Monib', () => {
    const h = planner();
    assert.deepEqual(h.route('three', 'Wadi El Nile', 'two', 'Faisal'), [
        'Wadi El Nile', 'Gamat El Dowal', 'Boulak El Dakrour', 'Cairo University', 'Faisal'
    ]);
    assert.equal(h.element('transferGuide').innerText,
        'Transfer at Cairo University. Take Line 2 toward El Monib.');
});

test('Ataba remains the shorter interchange for northern Line 2 journeys', () => {
    const h = planner();
    assert.deepEqual(h.route('two', 'Mohamed Naguib', 'three', 'Bab El Shaaria'),
        ['Mohamed Naguib', 'Ataba', 'Bab El Shaaria']);
    assert.match(h.element('transferGuide').innerText, /^Transfer at Ataba/);
});

test('a transfer at the departure station switches map metadata immediately', () => {
    const h = planner();
    assert.deepEqual(h.route('two', 'Cairo University', 'three', 'Wadi El Nile'),
        ['Cairo University', 'Boulak El Dakrour', 'Gamat El Dowal', 'Wadi El Nile']);
    assert.deepEqual(Array.from(h.context.window.currentRouteGeoPoints, point => point.lineId),
        ['Line 2', 'Line 3', 'Line 3', 'Line 3']);
});

test('Line 3 branch-to-branch paths go through Kit Kat, never a fictitious edge', () => {
    const h = planner();
    assert.deepEqual(h.route('three', 'Wadi El Nile', 'three', 'Imbaba'),
        ['Wadi El Nile', 'Tawfikia', 'Kit Kat', 'Sudan St.', 'Imbaba']);
    assert.equal(h.element('transferGuide').innerText, 'No transfer required on this trip.');
    const direction = h.context.lineThreeDirectionTarget;
    assert.equal(direction('Cairo University', 'Wadi El Nile'), 'Adly Mansour');
    assert.equal(direction('Cairo University', 'Nasser'), 'Adly Mansour');
    assert.equal(direction('Wadi El Nile', 'Cairo University'), 'Cairo University');
    assert.equal(direction('Cairo University', 'Imbaba'), 'Rod El Farag Corridor');
    assert.equal(direction('Rod El Farag Corridor', 'Sudan St.'), 'Adly Mansour');
});

test('same-line routing and duplicate-station rejection retain their behavior', () => {
    const h = planner();
    assert.deepEqual(h.route('two', 'Faisal', 'two', 'Dokki'),
        ['Faisal', 'Cairo University', 'Bohooth', 'Dokki']);
    h.route('two', 'Cairo University', 'three', 'Cairo University');
    assert.equal(h.element('plannerFeedback').dataset.state, 'error');
    assert.equal(h.element('cstats').innerText, '0');
});

test('service worker caches all local assets and removes only obsolete Metrom caches', async () => {
    const handlers = {};
    const deleted = [];
    let assets;
    const context = vm.createContext({
        self: {
            addEventListener: (type, callback) => { handlers[type] = callback; },
            skipWaiting() {}, clients: { claim() {} }
        },
        caches: {
            open: async () => ({ addAll: async values => { assets = values; } }),
            keys: async () => ['metrom-static-v7', 'metrom-tiles-v1', 'metrom-static-v8', 'metrom-static-v9', 'other-app'],
            delete: async key => { deleted.push(key); }
        }
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
    let pending;
    const event = { waitUntil(value) { pending = value; } };
    handlers.install(event);
    await pending;
    for (const asset of assets) assert.ok(fs.existsSync(path.join(root, asset)), asset);
    assert.ok(assets.includes('./js/metrom-i18n.js'));
    handlers.activate(event);
    await pending;
    assert.deepEqual(deleted, ['metrom-static-v7', 'metrom-tiles-v1', 'metrom-static-v8']);
});
