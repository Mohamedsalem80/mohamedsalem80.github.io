const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function localization() {
    const storage = new Map();
    const textNode = { data: 'Starting point' };
    const html = { nodeType: 1, closest: () => null, hasAttribute: () => false, querySelectorAll: () => [] };
    textNode.parentElement = html;
    const context = vm.createContext({
        console, WeakMap, NodeFilter: { SHOW_TEXT: 4 },
        document: {
            readyState: 'loading', documentElement: html,
            addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
            createTreeWalker() {
                let visited = false;
                return {
                    currentNode: textNode,
                    nextNode() { if (visited) return false; visited = true; return true; }
                };
            }
        },
        window: { localStorage: { setItem: (key, value) => storage.set(key, value) } }
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'js', 'metrom-i18n.js'), 'utf8'), context);
    return { api: context.window.MetroI18n, html, textNode, storage };
}

test('language switching restores original text, preserves updates and persists the preference', () => {
    const h = localization();
    h.api.setLanguage('ar');
    assert.equal(h.html.lang, 'ar');
    assert.equal(h.html.dir, 'rtl');
    assert.equal(h.storage.get('metrom-language'), 'ar');
    assert.equal(h.textNode.data, 'نقطة الانطلاق');
    h.api.setLanguage('ar');
    assert.equal(h.textNode.data, 'نقطة الانطلاق');
    h.api.setLanguage('en');
    assert.equal(h.textNode.data, 'Starting point');
    h.textNode.data = 'Destination';
    h.api.setLanguage('ar');
    assert.equal(h.textNode.data, 'الوجهة');
    h.api.setLanguage('en');
    assert.equal(h.textNode.data, 'Destination');
    assert.equal(h.html.dir, 'ltr');
    assert.throws(() => h.api.setLanguage('fr'), /Unsupported/);
});

test('every canonical network station and bundled map alias has an Arabic display name', () => {
    const h = localization();
    h.api.setLanguage('ar');
    const source = fs.readFileSync(path.join(root, 'js', 'metro-script.js'), 'utf8');
    const context = vm.createContext({
        document: { readyState: 'loading', getElementById: () => null, querySelectorAll: () => [], addEventListener() {} },
        window: {}
    });
    vm.runInContext(source, context);
    const names = [...Object.values(context.network).flat(), ...context.lineThreeRouteSegments.flat()];
    const geojson = JSON.parse(fs.readFileSync(path.join(root, 'js', 'cairo_metro_station_points.geojson')));
    geojson.features.forEach(feature => names.push(feature.properties.stationName, feature.properties.originalName));
    for (const name of new Set(names)) {
        assert.match(h.api.translate(name), /[\u0600-\u06ff]/, name);
    }
});

test('route results, fare, direction guidance and GPS templates translate completely', () => {
    const h = localization();
    h.api.setLanguage('ar');
    assert.equal(h.api.translate('Faisal → Cairo University → Boulak El Dakrour → Gamat El Dowal → Wadi El Nile'),
        'فيصل ← جامعة القاهرة ← بولاق الدكرور ← جامعة الدول ← وادي النيل');
    assert.equal(h.api.translate('Transfer at Cairo University. Take Line 3 toward Adly Mansour.'),
        'بدّل في جامعة القاهرة. استقل الخط الثالث باتجاه عدلي منصور.');
    assert.equal(h.api.translate('10 EGP'), '10 جنيه');
    assert.equal(h.api.translate('8-10 min (3.1 km)'), '8-10 دقيقة (3.1 كم)');
    assert.equal(h.api.translate('Speed (est.): 36.0 km/h'), 'السرعة (تقديرية): 36.0 كم/س');
    const travel = h.api.translate('GPS weak/underground detected, approximating along route. Traveling: nearest station is Faisal on Line 2. Remaining to destination ~1200 m (±5 m).');
    assert.ok(!/[A-Za-z]/.test(travel.replace('GPS', '')), travel);
    const location = h.api.translate('Live location set to 30.012345, 31.123456 (accuracy ±20 m). High accuracy fix.');
    assert.ok(!/[A-Za-z]/.test(location), location);
    assert.match(h.api.translate('Closest station now: El Bohoth (Line 2) - approx 0.12 km away.'), /البحوث/);
    assert.equal(h.api.translate('  Select Line:  '), '  اختر الخط:  ');
    assert.equal(h.api.translate('Use local map'), 'استخدم الخريطة المحلية');
    assert.equal(h.api.translate('Show street map'), 'اعرض خريطة الشوارع');
    assert.match(h.api.translate('Street tiles are unavailable. Showing the local metro map. Use Show street map to retry.'), /مجددًا/);
});

test('both public pages have translations for static text and accessibility labels', () => {
    const h = localization();
    h.api.setLanguage('ar');
    const brands = new Set(['Mivex', 'Metrom', 'Mivex ©', '/ Metrom']);
    const decode = text => text.replace(/&amp;/g, '&').replace(/&copy;/g, '©').trim();
    for (const file of ['index.html', 'main.html']) {
        const html = fs.readFileSync(path.join(root, file), 'utf8')
            .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
            .replace(/<button\b[^>]*data-no-i18n[^>]*>[\s\S]*?<\/button>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '');
        const values = html.split(/<[^>]*>/).map(decode);
        for (const match of html.matchAll(/(?:aria-label|title|placeholder)="([^"]+)"/g)) {
            values.push(decode(match[1]));
        }
        for (const value of values) {
            if (!/[A-Za-z]{2,}/.test(value) || brands.has(value)) continue;
            assert.match(h.api.translate(value), /[\u0600-\u06ff]/, file + ': ' + value);
        }
    }
});
