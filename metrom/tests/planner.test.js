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
    const shape = (type, points, options) => ({
        type, points, options,
        getLatLng() { return { lat: this.points[0], lng: this.points[1] }; },
        addTo(layer) { layer.items.push(this); return this; },
        bindPopup(content) { this.popup = content; return this; }
    });
    const group = () => ({ items: [], getLayers() { return this.items; }, clearLayers() { this.items = []; } });
    context.L = {
        polyline: (points, options) => shape('polyline', points, options),
        circleMarker: (points, options) => shape('circleMarker', points, options),
        circle: (points, options) => shape('circle', points, options),
        rectangle: (points, options) => shape('rectangle', points, options),
        marker: (points, options) => shape('marker', points, options),
        divIcon: options => options,
        point: (x, y) => ({ x, y }),
        latLngBounds: points => points
    };
    context.window.metroMapState = {
        map: { fitBounds(points, options) { this.lastBounds = { points, options }; } },
        routeLayer: group(), contextLayer: group(), selectionLayer: group(), stationAreaLayer: group()
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

test('selected stations are anchored pins, with distinct start, end and transfer roles', () => {
    const h = planner();
    h.route('two', 'Faisal', 'three', 'Wadi El Nile');
    const markers = h.context.window.metroMapState.routeLayer.items.filter(item => item.type === 'marker');
    assert.equal(h.context.window.metroMapState.routeLayer.items.find(item => item.type === 'polyline').options.interactive, false);
    assert.deepEqual(markers.map(marker => marker.options.icon.className),
        ['station-pin station-pin-start', 'station-pin station-pin-end', 'station-pin station-pin-transfer']);
    for (const marker of markers) {
        assert.deepEqual(Array.from(marker.options.icon.iconSize), [32, 42]);
        assert.deepEqual(Array.from(marker.options.icon.iconAnchor), [16, 40]);
        assert.match(marker.options.icon.html, /<svg/);
        assert.match(marker.options.icon.html, /aria-hidden="true"/);
        assert.equal(marker.options.title, marker.popup);
    }
    h.route('two', 'Cairo University', 'three', 'Wadi El Nile');
    assert.equal(h.context.window.metroMapState.routeLayer.items.filter(item => item.type === 'marker').length, 2);
});

test('dropdown selections preview pins immediately and stale selections clear', () => {
    const h = planner();
    h.element('sline').value = 'two';
    h.element('eline').value = 'three';
    h.element('pickup-two').value = 'Faisal';
    h.element('dropoff-three').value = 'Wadi El Nile';
    h.context.invalidateCurrentRoute(false);
    const state = h.context.window.metroMapState;
    assert.deepEqual(state.selectionLayer.items.map(item => item.options.icon.className),
        ['station-pin station-pin-start', 'station-pin station-pin-end']);
    assert.equal(state.map.lastBounds.options.maxZoom, 14);
    h.context.calculateTicket();
    assert.equal(state.selectionLayer.items.length, 0);
    h.element('pickup-two').value = '';
    h.element('dropoff-three').value = '';
    h.context.invalidateCurrentRoute(false);
    assert.equal(state.selectionLayer.items.length, 0);
    assert.equal(state.routeLayer.items.length, 0);
});

test('closest-station results use pins while the user position remains a circle', () => {
    const h = planner();
    const stations = h.context.window.metroGeoStations;
    const nearest = stations.find(station => station.plannerName === 'Faisal');
    h.context.showNearestPointOnMap(30, 31, nearest);
    let items = h.context.window.metroMapState.contextLayer.items;
    assert.equal(items.filter(item => item.type === 'circleMarker').length, 1);
    assert.equal(items.filter(item => item.type === 'marker')[0].options.icon.className, 'station-pin station-pin-selected');
    h.context.showNearestStartEndOnMap(30, 31, 30.1, 31.1, nearest, stations[0]);
    items = h.context.window.metroMapState.contextLayer.items;
    assert.deepEqual(items.filter(item => item.type === 'marker').map(item => item.options.icon.className),
        ['station-pin station-pin-start', 'station-pin station-pin-end']);
    assert.ok(items.filter(item => item.type === 'polyline').every(item => item.options.interactive === false));
});

test('selected station labels move above pins and return when highlights clear', () => {
    const h = planner();
    const station = h.context.window.metroGeoStations.find(station => station.plannerName === 'Faisal');
    const tooltip = { options: {}, update() {} };
    h.context.window.metroMapState.stationMarkers = [{
        getLatLng: () => ({ lat: station.lat, lng: station.lng }),
        getTooltip: () => tooltip
    }];
    h.route('two', 'Faisal', 'three', 'Wadi El Nile');
    assert.equal(tooltip.options.offset.y, -42);
    h.context.clearMapHighlights();
    assert.equal(tooltip.options.offset.y, -8);
});

test('station-area circles have exactly half the radius without changing GPS detection', () => {
    const h = planner();
    const station = h.context.window.metroGeoStations[0];
    h.context.window.metroGeoStations = [station];
    h.context.renderStationAreasOverlay();
    const layer = h.context.window.metroMapState.stationAreaLayer;
    assert.equal(layer.items[0].options.radius, 110);
    assert.equal(h.context.stationAreaRadiusFor(station), 0.22);
    h.context.stationAreaByKey[h.context.stationKey(station.lineId, station.plannerName)] = 0.4;
    h.context.renderStationAreasOverlay();
    assert.equal(layer.items[0].options.radius, 200);
    assert.equal(h.context.stationAreaRadiusFor(station), 0.4);
    station.areaRadiusKm = 0.6;
    h.context.renderStationAreasOverlay();
    assert.equal(layer.items[0].options.radius, 300);
    assert.equal(h.context.stationAreaRadiusFor(station), 0.6);
    assert.equal(h.context.TRAVEL_CONFIG.arrivalRadiusKm, 0.08);
    assert.equal(h.context.estimateBoundsFromRadius(station.lat, station.lng, 0.6).maxLat,
        station.lat + 0.6 / 111.32);
    h.context.showStationAreasOverlay = false;
    h.context.renderStationAreasOverlay();
    assert.equal(layer.items.length, 0);
});

test('displayed bounds halve both dimensions, preserve the center and leave exports unchanged', () => {
    const h = planner();
    const station = h.context.window.metroGeoStations[0];
    h.context.window.metroGeoStations = [station];
    const bounds = { minLat: 10, maxLat: 14, minLng: 20, maxLng: 28 };
    const key = h.context.stationKey(station.lineId, station.plannerName);
    h.context.stationBoundsByKey[key] = bounds;
    h.context.renderStationAreasOverlay();
    const rectangle = h.context.window.metroMapState.stationAreaLayer.items.find(item => item.type === 'rectangle');
    const points = Array.from(rectangle.points, point => Array.from(point));
    assert.deepEqual(points, [[11, 22], [13, 26]]);
    assert.equal(points[1][0] - points[0][0], (bounds.maxLat - bounds.minLat) / 2);
    assert.equal(points[1][1] - points[0][1], (bounds.maxLng - bounds.minLng) / 2);
    assert.equal((points[0][0] + points[1][0]) / 2, (bounds.minLat + bounds.maxLat) / 2);
    assert.equal((points[0][1] + points[1][1]) / 2, (bounds.minLng + bounds.maxLng) / 2);
    assert.equal(h.context.stationAreaRadiusFor(station), 0.22);
    assert.deepEqual(h.context.resolveStationBounds(station).bounds, bounds);
    let exported;
    h.context.downloadTextFile = (filename, content) => { exported = JSON.parse(content); };
    h.context.downloadStationBoundsData();
    assert.deepEqual(exported.features[0].geometry.coordinates[0], [
        [20, 10], [28, 10], [28, 14], [20, 14], [20, 10]
    ]);
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
            keys: async () => ['metrom-static-v7', 'metrom-tiles-v1', 'metrom-static-v8', 'metrom-static-v9', 'metrom-static-v10', 'metrom-static-v11', 'other-app'],
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
    assert.deepEqual(deleted, ['metrom-static-v7', 'metrom-tiles-v1', 'metrom-static-v8', 'metrom-static-v9', 'metrom-static-v10']);
});
